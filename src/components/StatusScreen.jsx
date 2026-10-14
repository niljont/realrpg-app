import { RotateCcw } from 'lucide-react';
import StatRadar from './StatRadar';
import { STATS, STAT_META, getStats, statProgress } from '../lib/game';

export default function StatusScreen({ player, onReset }) {
  const stats = getStats(player);

  return (
    <div className="space-y-4">
      <section className="system-panel p-4">
        <h2 className="font-display text-sm tracking-widest text-neon/90">ХАРАКТЕРИСТИКИ</h2>
        <StatRadar stats={stats} />
      </section>

      <section className="system-panel space-y-3 p-4">
        {STATS.map((s) => {
          const { level, cur, need } = statProgress(player.statPoints[s]);
          const { color, label } = STAT_META[s];
          return (
            <div key={s}>
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span>
                  <b className="font-display" style={{ color }}>
                    {s}
                  </b>{' '}
                  <span className="text-zinc-400">{label}</span>
                </span>
                <span className="tabular-nums text-zinc-400">
                  <b className="text-sm text-zinc-100">{level}</b> · {cur}/{need}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full transition-[width] duration-700" style={{ width: `${(cur / need) * 100}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
              </div>
            </div>
          );
        })}
      </section>

      <button
        onClick={() => confirm('Стереть профиль Игрока? Весь прогресс будет потерян.') && onReset()}
        className="mx-auto flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-red-400"
      >
        <RotateCcw size={12} /> Сбросить профиль
      </button>
    </div>
  );
}
