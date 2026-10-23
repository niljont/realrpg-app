import { useEffect, useRef, useState } from 'react';

const VISION_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

function elbowAngle(shoulder, elbow, wrist) {
  const abx = shoulder.x - elbow.x;
  const aby = shoulder.y - elbow.y;
  const cbx = wrist.x - elbow.x;
  const cby = wrist.y - elbow.y;
  const dot = abx * cbx + aby * cby;
  const mag = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
  if (mag < 1e-5) return 180;
  return (Math.acos(Math.min(1, Math.max(-1, dot / mag))) * 180) / Math.PI;
}

function vis(point) {
  return point?.visibility ?? 0;
}

/** 0 — корпус горизонтален, 90 — вертикален. */
function tiltFromLevel(a, b) {
  const tilt = Math.abs(Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI);
  return Math.min(tilt, 180 - tilt);
}

function bestChain(landmarks, chains) {
  const score = (idx) => idx.reduce((sum, i) => sum + vis(landmarks[i]), 0);
  const idx = [...chains].sort((a, b) => score(b) - score(a))[0];
  const pts = idx.map((i) => landmarks[i]);
  if (pts.some((p) => !p || vis(p) < 0.4)) return null;
  return pts;
}

function armPose(landmarks) {
  const arm = bestChain(landmarks, [[11, 13, 15], [12, 14, 16]]);
  const hip = bestChain(landmarks, [[23], [24]]);
  if (!arm) return null;
  return {
    angle: elbowAngle(arm[0], arm[1], arm[2]),
    plank: Boolean(hip) && tiltFromLevel(arm[0], hip[0]) < 32,
    hanging: arm[2].y + 0.04 < arm[0].y,
  };
}

function legPose(landmarks) {
  const leg = bestChain(landmarks, [[23, 25, 27], [24, 26, 28]]);
  const torso = bestChain(landmarks, [[11, 23], [12, 24]]);
  if (!leg || !torso) return null;
  return {
    knee: elbowAngle(leg[0], leg[1], leg[2]),
    upright: tiltFromLevel(torso[0], torso[1]) > 55,
    level: tiltFromLevel(torso[0], torso[1]) < 32,
  };
}

/**
 * Камера считает упражнение. Пока counting ложно, картинка есть, счёт не идёт.
 * @param {boolean} active
 * @param {boolean} counting
 * @param {'pushups' | 'pullups' | 'squats' | 'abs' | 'plank'} mode
 * @param {(value: number) => void} onValue повторы или секунды планки
 */
export function usePoseCamera(active, counting, mode, onValue) {
  const videoRef = useRef(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const onValueRef = useRef(onValue);
  const countingRef = useRef(counting);
  const modeRef = useRef(mode);
  const repsRef = useRef(0);
  const posePhase = useRef('up');
  const lastRepAt = useRef(0);
  const plankMs = useRef(0);
  const lastTick = useRef(0);
  onValueRef.current = onValue;
  countingRef.current = counting;
  modeRef.current = mode;

  useEffect(() => {
    if (!counting) return undefined;
    repsRef.current = 0;
    posePhase.current = 'up';
    lastRepAt.current = 0;
    plankMs.current = 0;
    lastTick.current = 0;
    onValueRef.current(0);
    return undefined;
  }, [counting]);

  useEffect(() => {
    if (!active) return undefined;
    let stop = false;
    let stream = null;
    let landmarker = null;
    let frame = 0;
    const video = videoRef.current;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (stop || !video) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        const { PoseLandmarker, FilesetResolver } = await import(/* @vite-ignore */ VISION_URL);
        const files = await FilesetResolver.forVisionTasks(WASM_URL);
        const options = (delegate) => ({
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: 'VIDEO',
          numPoses: 1,
        });
        try {
          landmarker = await PoseLandmarker.createFromOptions(files, options('GPU'));
        } catch {
          landmarker = await PoseLandmarker.createFromOptions(files, options('CPU'));
        }
        if (stop) return;
        setReady(true);
        let lastVideoTime = -1;
        const loop = () => {
          if (stop) return;
          frame = requestAnimationFrame(loop);
          if (!video || video.readyState < 2 || video.currentTime === lastVideoTime) return;
          lastVideoTime = video.currentTime;
          const result = landmarker.detectForVideo(video, performance.now());
          const landmarks = result?.landmarks?.[0];
          if (!landmarks) return;
          const now = performance.now();
          const kind = modeRef.current;
          if (!countingRef.current) {
            posePhase.current = 'up';
            lastTick.current = now;
            return;
          }
          if (kind === 'plank') {
            const leg = legPose(landmarks);
            const dt = lastTick.current ? Math.min(200, now - lastTick.current) : 0;
            lastTick.current = now;
            if (leg?.level && leg.knee > 150) plankMs.current += dt;
            const sec = Math.floor(plankMs.current / 1000);
            if (sec !== repsRef.current) {
              repsRef.current = sec;
              onValueRef.current(sec);
            }
            return;
          }
          lastTick.current = now;
          const arm = kind === 'pushups' || kind === 'pullups' ? armPose(landmarks) : null;
          const leg = kind === 'squats' || kind === 'abs' ? legPose(landmarks) : null;
          const countRep = () => {
            if (now - lastRepAt.current < 800) return;
            lastRepAt.current = now;
            repsRef.current += 1;
            onValueRef.current(repsRef.current);
          };
          if (kind === 'pushups') {
            if (!arm?.plank) {
              posePhase.current = 'up';
              return;
            }
            if (posePhase.current === 'up' && arm.angle < 95) posePhase.current = 'down';
            if (posePhase.current === 'down' && arm.angle > 155) {
              posePhase.current = 'up';
              countRep();
            }
            return;
          }
          if (kind === 'pullups') {
            if (!arm) {
              posePhase.current = 'up';
              return;
            }
            if (posePhase.current === 'up' && arm.hanging && arm.angle > 155) posePhase.current = 'hang';
            if (posePhase.current === 'hang' && arm.angle < 85) {
              posePhase.current = 'up';
              countRep();
            } else if (posePhase.current === 'hang' && !arm.hanging && arm.angle > 150) {
              posePhase.current = 'up';
            }
            return;
          }
          if (kind === 'squats') {
            if (!leg?.upright) {
              posePhase.current = 'up';
              return;
            }
            if (posePhase.current === 'up' && leg.knee < 105) posePhase.current = 'down';
            if (posePhase.current === 'down' && leg.knee > 160) {
              posePhase.current = 'up';
              countRep();
            }
            return;
          }
          if (kind === 'abs') {
            if (!leg || leg.knee > 140) {
              posePhase.current = 'up';
              return;
            }
            if (posePhase.current === 'up' && leg.level) posePhase.current = 'down';
            if (posePhase.current === 'down' && leg.upright) {
              posePhase.current = 'up';
              countRep();
            }
          }
        };
        frame = requestAnimationFrame(loop);
      } catch (err) {
        if (!stop) setError(err?.message || 'Камера недоступна');
      }
    })();

    return () => {
      stop = true;
      cancelAnimationFrame(frame);
      landmarker?.close?.();
      stream?.getTracks().forEach((track) => track.stop());
      if (video) video.srcObject = null;
      setReady(false);
    };
  }, [active]);

  return { videoRef, error, ready };
}

/**
 * Камера дуэли: только отжимания.
 * @param {boolean} active
 * @param {boolean} counting
 * @param {(reps: number) => void} onReps
 */
export function usePushupCamera(active, counting, onReps) {
  return usePoseCamera(active, counting, 'pushups', onReps);
}
