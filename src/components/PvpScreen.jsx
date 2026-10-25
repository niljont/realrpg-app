import { useEffect, useRef, useState } from 'react';
import { Swords } from 'lucide-react';
import { usePoseCamera } from './PushupCamera';
import { PVP_EXERCISES, pvpExercise, pvpRatingsOf } from '../lib/game';
import { PVP_FIGHT_MS, PVP_OPP_COLOR, PVP_SEARCH_MS, PVP_YOU_COLOR, pvpCancel, pvpChallenge, pvpPoll, pvpSync } from '../lib/pvp';

function TugBar({ mine, opp }) {
  const total = mine + opp;
  const minePct = total === 0 ? 50 : Math.min(92, Math.max(8, (mine / total) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-display text-3xl leading-none tabular-nums" style={{ color: PVP_YOU_COLOR }}>{mine}</div>
          <div className="mt-1 text-[10px] font-bold tracking-widest text-zinc-500">ТЫ</div>
        </div>
        <div className="text-right">
          <div className="font-display text-3xl leading-none tabular-nums" style={{ color: PVP_OPP_COLOR }}>{opp}</div>
          <div className="mt-1 text-[10px] font-bold tracking-widest text-zinc-500">СОПЕРНИК</div>
        </div>
      </div>
      <div className="flex h-4 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full transition-[width] duration-500" style={{ width: `${minePct}%`, background: PVP_YOU_COLOR }} />
        <div className="h-full flex-1" style={{ background: PVP_OPP_COLOR }} />
      </div>
    </div>
  );
}

export default function PvpScreen({ player, onResult, seek, onSeekDone }) {
  const [exerciseId, setExerciseId] = useState('pushups');
  const exercise = pvpExercise(exerciseId);
  const rating = pvpRatingsOf(player)[exercise.id];
  const [phase, setPhase] = useState('idle');
  const [searchLeft, setSearchLeft] = useState(PVP_SEARCH_MS / 1000);
  const [countLeft, setCountLeft] = useState(10);
  const [fightLeft, setFightLeft] = useState(PVP_FIGHT_MS / 1000);
  const [mine, setMine] = useState(0);
  const [opp, setOpp] = useState(0);
  const [oppName, setOppName] = useState('');
  const [oppId, setOppId] = useState('');
  const [bot, setBot] = useState(false);
  const matchRef = useRef(null);
  const mineRef = useRef(0);
  const finished = useRef(false);
  mineRef.current = mine;

  const cameraOn = phase === 'search' || phase === 'countdown' || phase === 'fight';
  const { videoRef, error: cameraError, ready, hint } = usePoseCamera(cameraOn, phase === 'fight', exercise.mode, setMine);
  const targetRef = useRef(null);

  useEffect(() => {
    if (phase !== 'search') return undefined;
    const started = Date.now();
    let cancel = false;
    const tick = async () => {
      const left = Math.max(0, PVP_SEARCH_MS - (Date.now() - started));
      setSearchLeft(Math.ceil(left / 1000));
      if (left <= 0) {
        setBot(true);
        setOppId('');
        setOppName('Тренировочный конструкт');
        setOpp(0);
        setMine(0);
        setCountLeft(10);
        setPhase('countdown');
        pvpCancel();
        return;
      }
      const res = await pvpPoll(player?.name, rating, exercise.id, targetRef.current);
      if (cancel || res.status !== 'matched' || !res.match) return;
      matchRef.current = { id: res.match.id, you: res.you };
      setOppId(res.you === 'a' ? res.match.bId || '' : res.match.aId || '');
      setBot(false);
      setOppName(res.you === 'a' ? res.match.bName : res.match.aName);
      setOpp(0);
      setMine(0);
      setCountLeft(10);
      setPhase('countdown');
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => {
      cancel = true;
      clearInterval(id);
      pvpCancel();
    };
  }, [phase, player?.name, rating, exercise.id]);

  useEffect(() => {
    if (phase !== 'countdown') return undefined;
    const started = Date.now();
    const id = setInterval(() => {
      const left = Math.max(0, 10_000 - (Date.now() - started));
      setCountLeft(Math.ceil(left / 1000));
      if (left <= 0) {
        clearInterval(id);
        setMine(0);
        setOpp(0);
        setPhase('fight');
      }
    }, 200);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'fight') return undefined;
    finished.current = false;
    const started = Date.now();
    const clock = setInterval(() => {
      const left = Math.max(0, PVP_FIGHT_MS - (Date.now() - started));
      setFightLeft(Math.ceil(left / 1000));
      if (left <= 0) clearInterval(clock);
    }, 250);

    let botTimer = 0;
    if (bot) {
      const step = () => {
        setOpp((n) => n + 1);
        botTimer = window.setTimeout(step, 4200 + Math.random() * 1800);
      };
      botTimer = window.setTimeout(step, 5000);
    }

    const sync = setInterval(async () => {
      const match = matchRef.current;
      if (!match || bot) return;
      const body = await pvpSync(match.id, mineRef.current);
      if (!body || body.error) return;
      setOpp(match.you === 'a' ? body.bReps : body.aReps);
    }, 1000);

    const end = setTimeout(() => {
      if (finished.current) return;
      finished.current = true;
      setPhase('result');
    }, PVP_FIGHT_MS);

    return () => {
      clearInterval(clock);
      clearInterval(sync);
      clearTimeout(end);
      clearTimeout(botTimer);
    };
  }, [phase, bot]);

  useEffect(() => {
    if (phase !== 'fight' || bot) return undefined;
    const match = matchRef.current;
    if (!match) return undefined;
    pvpSync(match.id, mine);
    return undefined;
  }, [mine, phase, bot]);

  useEffect(() => {
    if (phase !== 'result' || finished.current === 'sent') return undefined;
    finished.current = 'sent';
    const result = mine > opp ? 'win' : mine < opp ? 'loss' : 'draw';
    onResult?.({ outcome: result, bot, reps: mine, exercise: exercise.id });
    return undefined;
  }, [phase, mine, opp, bot, onResult, exercise.id]);

  const startSearch = (nextExercise = exerciseId, targetId = null) => {
    targetRef.current = targetId;
    if (nextExercise) setExerciseId(nextExercise);
    matchRef.current = null;
    finished.current = false;
    setMine(0);
    setOpp(0);
    setBot(false);
    setOppName('');
    setSearchLeft(PVP_SEARCH_MS / 1000);
    setCountLeft(10);
    setPhase('search');
    if (targetId && player?.name) pvpChallenge(targetId, player.name, pvpRatingsOf(player)[nextExercise] || rating, nextExercise);
  };

  useEffect(() => {
    if (!seek) return undefined;
    onSeekDone?.();
    if (seek.match) {
      matchRef.current = { id: seek.match.id, you: seek.you || 'b' };
      setExerciseId(seek.exercise || 'pushups');
      setBot(false);
      setOppId(seek.you === 'b' ? seek.match.aId || '' : seek.match.bId || '');
      setOppName(seek.you === 'b' ? seek.match.aName : seek.match.bName);
      setMine(0);
      setOpp(0);
      setCountLeft(10);
      setPhase('countdown');
      return undefined;
    }
    startSearch(seek.exercise || 'pushups', seek.targetId || null);
    return undefined;
    // Старт по внешнему вызову. startSearch меняет фазу и не должен перезапускать эффект.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seek]);

  const stopSearch = () => {
    pvpCancel();
    setPhase('idle');
  };

  return (
    <div className="space-y-4">
      <section className="system-panel space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Swords size={16} className="text-neon" />
            <h2 className="font-display text-sm tracking-widest text-neon">ДУЭЛЬ</h2>
          </div>
          <span className="text-[11px] text-zinc-400">{exercise.name} · {rating}</span>
        </div>

        {phase === 'fight' || phase === 'result' ? <TugBar mine={mine} opp={opp} /> : null}

        {phase === 'idle' && (
          <>
            <div className="grid grid-cols-2 gap-1">
              {PVP_EXERCISES.map((ex) => {
                const on = ex.id === exerciseId;
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => setExerciseId(ex.id)}
                    className="rounded-lg border px-2 py-2 text-[11px] font-bold"
                    style={{ borderColor: on ? '#22d3ee' : '#3f3f46', color: on ? '#22d3ee' : '#a1a1aa' }}
                  >
                    {ex.name}
                    <span className="mt-0.5 block font-display text-[10px] text-zinc-500">{pvpRatingsOf(player)[ex.id]}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              Поиск по рейтингу этого упражнения. Если за 40 секунд никого нет, выходит тренировочный конструкт. Камера считает повторы.
            </p>
            <button type="button" onClick={() => startSearch()} className="w-full rounded-xl bg-neon py-3 text-sm font-bold text-zinc-950">
              Искать соперника
            </button>
          </>
        )}

        {phase === 'search' && (
          <>
            <p className="text-center font-display text-2xl text-zinc-100">{searchLeft}</p>
            <p className="text-center text-[11px] text-zinc-500">Ищем Носителя с близким рейтингом. Поставь камеру, пока идёт поиск.</p>
          </>
        )}

        {phase === 'countdown' && (
          <div className="rounded-xl border border-neon/40 bg-neon/10 px-3 py-2 text-center">
            <div className="font-display text-[11px] tracking-widest text-neon">МАТЧ НАЙДЕН</div>
            <p className="mt-1 text-sm text-zinc-100">
              {bot ? 'Соперник не найден. Выходит тренировочный конструкт.' : `Соперник: ${oppName || 'Носитель'}.`}
            </p>
          </div>
        )}

        {cameraOn && (
          <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-black">
            <video ref={videoRef} playsInline muted className="aspect-[4/3] w-full -scale-x-100 object-cover" />
            {!ready && !cameraError && (
              <p className="absolute inset-0 flex items-center justify-center text-xs text-zinc-400">Камера запускается…</p>
            )}
            {hint && phase !== 'countdown' && (
              <p className="absolute inset-x-0 bottom-2 text-center text-[11px] font-bold text-amber-200">{hint}</p>
            )}
            {phase === 'countdown' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55">
                <div className="font-display text-5xl text-white">{Math.max(1, countLeft)}</div>
                <div className="mt-1 text-[11px] font-bold tracking-widest text-zinc-200">ДО СТАРТА</div>
              </div>
            )}
          </div>
        )}
        {cameraOn && cameraError && <p className="text-[11px] text-red-300">{cameraError}</p>}

        {phase === 'search' && (
          <button type="button" onClick={stopSearch} className="w-full rounded-xl border border-zinc-700 py-3 text-sm font-bold text-zinc-300">
            Отмена
          </button>
        )}

        {phase === 'fight' && (
          <>
            <div className="flex items-baseline justify-between text-[11px] text-zinc-400">
              <span>{bot ? 'Конструкт' : oppName || 'Соперник'}</span>
              <span className="font-display text-lg text-zinc-100">{fightLeft} с</span>
            </div>
            <p className="text-[11px] text-zinc-500">Камера считает: {exercise.name.toLowerCase()}. Один полный цикл — один повтор.</p>
          </>
        )}

      </section>

      {phase === 'result' && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm sm:items-center">
          <div className="system-panel modal-in w-full max-w-sm p-5">
            <div className="mb-2 text-center font-display text-[11px] tracking-[0.28em] text-neon/80">ИТОГ ДУЭЛИ</div>
            <p className="text-center font-display text-xl text-zinc-100">
              {mine > opp ? 'Победа' : mine < opp ? 'Поражение' : 'Ничья'}
            </p>
            <p className="mt-1 text-center text-[12px] text-zinc-500">
              {bot ? 'Тренировочный конструкт' : oppName || 'Соперник'}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-3 text-center">
                <div className="font-display text-3xl tabular-nums" style={{ color: PVP_YOU_COLOR }}>{mine}</div>
                <div className="mt-1 text-[10px] font-bold tracking-widest text-zinc-500">ТЫ</div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-3 text-center">
                <div className="font-display text-3xl tabular-nums" style={{ color: PVP_OPP_COLOR }}>{opp}</div>
                <div className="mt-1 text-[10px] font-bold tracking-widest text-zinc-500">СОПЕРНИК</div>
              </div>
            </div>
            {!bot && (
              <button
                type="button"
                onClick={() => startSearch(exercise.id, oppId || null)}
                className="mt-4 w-full rounded-xl border border-neon/50 py-3 text-sm font-bold text-neon"
              >
                Реванш
              </button>
            )}
            {bot && (
              <button
                type="button"
                onClick={() => {
                  setMine(0);
                  setOpp(0);
                  setCountLeft(10);
                  finished.current = false;
                  setPhase('countdown');
                }}
                className="mt-4 w-full rounded-xl border border-neon/50 py-3 text-sm font-bold text-neon"
              >
                Реванш
              </button>
            )}
            <button type="button" onClick={() => setPhase('idle')} className="mt-2 w-full rounded-xl bg-neon py-3 text-sm font-bold text-zinc-950">
              Подтвердить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
