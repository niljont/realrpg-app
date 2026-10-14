import { Sparkles } from 'lucide-react';
import { ACHIEVEMENTS, TITLES, titleName } from '../lib/game';
import { ACHIEVEMENT_ICONS } from './achievementIcons';

export default function UnlockOverlay({ achievementId, gender, onClose }) {
  const a = ACHIEVEMENTS.find((x) => x.id === achievementId);
  if (!a) return null;
  const Icon = ACHIEVEMENT_ICONS[a.id] ?? Sparkles;
  const title = a.title ? TITLES[a.title] : null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm" onClick={onClose}>
      <div className="unlock-burst pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="unlock-particle"
            style={{
              '--a': `${(i / 18) * 360}deg`,
              '--c': a.color,
              animationDelay: `${i * 0.03}s`,
            }}
          />
        ))}
      </div>
      <div
        className="system-panel unlock-card relative w-full max-w-sm p-6 text-center"
        style={{ borderColor: `${a.color}99`, boxShadow: `0 0 40px ${a.color}55` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 font-display text-[11px] tracking-[0.35em]" style={{ color: a.color }}>
          [ СИСТЕМА ]
        </div>
        <h2 className="font-display text-lg text-zinc-100">ДОСТИЖЕНИЕ РАЗБЛОКИРОВАНО</h2>
        <div
          className="mx-auto my-5 flex h-20 w-20 items-center justify-center rounded-2xl"
          style={{
            background: `${a.color}22`,
            color: a.color,
            boxShadow: `0 0 28px ${a.color}88, inset 0 0 20px ${a.color}33`,
          }}
        >
          <Icon size={40} style={{ filter: `drop-shadow(0 0 8px ${a.color})` }} />
        </div>
        <div className="font-display text-xl" style={{ color: a.color, textShadow: `0 0 12px ${a.color}` }}>
          {a.name}
        </div>
        {title && (
          <p className="mt-3 text-sm text-zinc-300">
            Открыт титул{' '}
            <span className="font-display" style={{ color: title.color }}>
              «{titleName(a.title, gender)}»
            </span>
            <br />
            <span className="text-xs text-zinc-500">{title.bonus}</span>
          </p>
        )}
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl py-3 font-display tracking-wide text-white transition active:scale-[0.98]"
          style={{ background: a.color, boxShadow: `0 0 20px ${a.color}77` }}
        >
          Принять
        </button>
      </div>
    </div>
  );
}
