import { useState } from 'react';
import { Check, Dumbbell } from 'lucide-react';
import {
  EXERCISES,
  STATS,
  STAT_META,
  dayKey,
  exercisePoints,
  findExercise,
  formatAmount,
  xpMultiplier,
} from '../lib/game';

function ExerciseRow({ ex, color, mult, onDone }) {
  const [amount, setAmount] = useState('');
  const pts = Math.round(exercisePoints(ex, Number(amount) || 0) * mult);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-zinc-100">{ex.name}</div>
        <div className="text-[10px] text-zinc-500">
          1 {ex.unit} = {ex.rate} pt {pts > 0 && <span style={{ color }}>· +{pts} pt</span>}
        </div>
      </div>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step={ex.step ?? 1}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={ex.unit}
        className="w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-right font-bold tabular-nums outline-none"
        style={{ color }}
      />
      <button
        disabled={pts <= 0}
        onClick={() => onDone(ex.id, Number(amount)) && setAmount('')}
        className="flex min-w-12 items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-white transition active:scale-95 disabled:opacity-25"
        style={{ background: color, boxShadow: `0 0 12px ${color}77` }}
      >
        <Check size={14} />
      </button>
    </div>
  );
}

export default function TrainingScreen({ player, onTrain }) {
  const [stat, setStat] = useState('STR');
  const today = dayKey();
  const todayLog = (player.log ?? []).filter((e) => e.date === today);
  const todayTotals = Object.fromEntries(STATS.map((s) => [s, todayLog.filter((e) => e.stat === s).reduce((a, e) => a + e.points, 0)]));
  const color = STAT_META[stat].color;
  const mult = xpMultiplier(player, stat);

  return (
    <div className="space-y-4">
      <section className="system-panel p-4">
        <div className="mb-3 flex items-center gap-2">
          <Dumbbell size={16} className="text-neon" />
          <h2 className="font-display text-sm tracking-widest text-neon/90">ПРОКАЧКА</h2>
        </div>
        <p className="mb-3 text-[11px] text-zinc-500">Выполняйте упражнения — качайте статы и XP. Энергия (AP) здесь не тратится.</p>
        <div className="grid grid-cols-5 gap-1.5">
          {STATS.map((s) => (
            <div key={s} className="rounded-lg border border-zinc-800 bg-zinc-900/60 py-2 text-center">
              <div className="font-display text-[11px]" style={{ color: STAT_META[s].color }}>
                {s}
              </div>
              <div className="text-sm font-bold tabular-nums text-zinc-100">{todayTotals[s]}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="system-panel p-4">
        <div className="mb-3 flex gap-1.5 overflow-x-auto">
          {STATS.map((s) => {
            const c = STAT_META[s].color;
            const active = s === stat;
            return (
              <button
                key={s}
                onClick={() => setStat(s)}
                className="flex-1 rounded-lg border px-2 py-1.5 font-display text-xs transition"
                style={{ borderColor: active ? c : '#27272a', color: active ? c : '#71717a', background: active ? `${c}1a` : 'transparent', boxShadow: active ? `0 0 10px ${c}55` : 'none' }}
              >
                {s}
              </button>
            );
          })}
        </div>
        <div className="mb-2 flex justify-between text-xs text-zinc-400">
          <span>{STAT_META[stat].label}</span>
          {mult > 1 && <span className="font-bold text-amber-400">XP ×{mult.toFixed(2)}</span>}
        </div>
        <div className="space-y-2">
          {EXERCISES[stat].map((ex) => (
            <ExerciseRow key={`${stat}-${ex.id}`} ex={ex} color={color} mult={mult} onDone={(id, amt) => onTrain(stat, id, amt)} />
          ))}
        </div>
      </section>

      {todayLog.length > 0 && (
        <section className="system-panel p-4">
          <h3 className="mb-2 font-display text-xs tracking-widest text-zinc-400">ЖУРНАЛ ЗА СЕГОДНЯ</h3>
          <ul className="space-y-1.5 text-xs">
            {[...todayLog].reverse().map((e) => {
              const ex = findExercise(e.stat, e.exId);
              return (
                <li key={e.ts} className="flex justify-between border-b border-zinc-800/70 pb-1.5 last:border-0">
                  <span className="text-zinc-300">
                    <b style={{ color: STAT_META[e.stat].color }}>{e.stat}</b> {ex?.name} × {formatAmount(e.amount)} {ex?.unit}
                  </span>
                  <span className="tabular-nums text-zinc-500">
                    {new Date(e.ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })} · +{e.points}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
