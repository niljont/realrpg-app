import { useState } from 'react';
import { Flag, Swords } from 'lucide-react';
import { WEEK_GOALS } from '../lib/engagement';
import { formatAmount } from '../lib/game';

function amountLabel(amount, unit) {
  return `${formatAmount(amount)} ${unit}`.trim();
}

export default function EngagementBoard({ player, onPickWeekGoal, onClaimWeekChest }) {
  const [picked, setPicked] = useState(WEEK_GOALS[0].id);
  const goal = player.weekGoal;
  const option = WEEK_GOALS.find((row) => row.id === goal?.id) ?? null;
  const chest = player.weekChest;
  const score = player.dayScore;
  const rival = score?.rival;
  const todayAmount = rival ? Number(score.counts?.[rival.exId]) || 0 : 0;
  const active = WEEK_GOALS.find((row) => row.id === picked) ?? WEEK_GOALS[0];

  return (
    <section className="system-panel space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Swords size={16} className="text-amber-300" />
        <h2 className="font-display text-sm tracking-widest text-amber-200/90">ВЧЕРАШНИЙ СОПЕРНИК</h2>
      </div>
      {rival ? (
        <p className="text-[11px] leading-relaxed text-zinc-300">
          Вчера: {amountLabel(rival.amount, rival.unit)} · {rival.name}. Сегодня {amountLabel(todayAmount, rival.unit)}.
          {score.beaten
            ? ' Себя обогнал: до конца дня опыт +15%.'
            : ' Обгони себя — и до конца дня опыт +15%.'}
        </p>
      ) : (
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Соперник появляется утром, если вчера была тренировка. Бьёшь свой результат, не чужой.
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Flag size={16} className="text-neon" />
        <h2 className="font-display text-sm tracking-widest text-neon/90">ЦЕЛЬ НЕДЕЛИ</h2>
      </div>
      <p className="text-[10px] leading-relaxed text-zinc-500">
        Только твоя. Сундук открывается в понедельник, если планка закрыта. Сменить цель на этой неделе нельзя.
      </p>

      {chest && (
        <button
          type="button"
          onClick={onClaimWeekChest}
          className="w-full rounded-lg bg-amber-500/20 py-2.5 text-xs font-bold text-amber-200"
        >
          Забрать сундук · {chest.name} {formatAmount(chest.target)} {chest.unit}
        </button>
      )}

      {option ? (
        <div>
          <div className="mb-1 flex justify-between text-[11px] text-zinc-300">
            <span>{option.name}</span>
            <span className="tabular-nums">
              {formatAmount(Math.min(goal.progress || 0, goal.target))} / {formatAmount(goal.target)} {option.unit}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-sm bg-zinc-950">
            <div
              className="h-full bg-neon"
              style={{ width: `${Math.min(100, ((goal.progress || 0) / Math.max(1, goal.target)) * 100)}%` }}
            />
          </div>
          {(goal.progress || 0) >= goal.target && (
            <p className="mt-1 text-[10px] text-emerald-300">Планка закрыта. Сундук будет в понедельник.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1">
            {WEEK_GOALS.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setPicked(row.id)}
                className="rounded-lg border px-1 py-1.5 text-[10px] font-bold"
                style={{
                  borderColor: picked === row.id ? '#22d3ee' : '#3f3f46',
                  color: picked === row.id ? '#22d3ee' : '#a1a1aa',
                }}
              >
                {row.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {active.tiers.map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => onPickWeekGoal(active.id, tier)}
                className="rounded-lg border border-zinc-700 py-2 text-[11px] font-bold text-zinc-200"
              >
                {tier} {active.unit}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
