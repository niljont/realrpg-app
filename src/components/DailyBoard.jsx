import { Flame, ScrollText, Sparkles } from 'lucide-react';
import { contractReady, weekKey } from '../lib/daily';

export default function DailyBoard({ player, onClaimContract, onClaimReturn }) {
  const tasks = player.daily?.tasks ?? [];
  const attendance = player.attendance ?? { streak: 0, best: 0, freeWeek: '' };
  const today = player.daily?.date ?? '';
  const freeUsed = attendance.freeWeek && today && attendance.freeWeek === weekKey(today);
  const offer = player.returnOffer?.date === today ? player.returnOffer : null;

  return (
    <section className="system-panel space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ScrollText size={16} className="text-neon" />
          <h2 className="font-display text-sm tracking-widest text-neon/90">КОНТРАКТ СИСТЕМЫ</h2>
        </div>
        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300">
          <Flame size={12} /> {attendance.streak || 0} дн.
        </div>
      </div>
      <p className="text-[10px] leading-relaxed text-zinc-500">
        Серия явки растёт, когда контракт закрыт. Один пропуск в неделю её не рвёт.
        {freeUsed ? ' На этой неделе свободный день уже потрачен.' : ''} Рекорд: {attendance.best || 0}.
      </p>
      <div className="space-y-1.5">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 px-2.5 py-2">
            <span className={`mt-0.5 text-xs ${task.done ? 'text-emerald-400' : 'text-zinc-600'}`}>{task.done ? '✓' : '○'}</span>
            <div className="min-w-0 flex-1">
              <div className={`text-xs font-bold ${task.done ? 'text-zinc-400 line-through' : 'text-zinc-100'}`}>{task.title}</div>
              <div className="text-[10px] text-zinc-500">
                {task.detail}
                {task.id === 'steps' ? ` · ${Math.min(task.goal, task.progress || 0).toLocaleString('ru-RU')}/${task.goal.toLocaleString('ru-RU')}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={!contractReady(player)}
        onClick={onClaimContract}
        className="w-full rounded-lg bg-neon/20 py-2.5 text-xs font-bold text-neon disabled:opacity-35"
      >
        {player.daily?.claimed ? 'Награда получена' : 'Забрать награду'}
      </button>

      {offer && !offer.claimed && (
        <div className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-fuchsia-200">
            <Sparkles size={14} /> Возвращение
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-300">
            Тебя не было {offer.gap} дн. Одно лёгкое дело: любая тренировка или 1 000 шагов. Штрафа нет.
          </p>
          <button
            type="button"
            disabled={!offer.done}
            onClick={onClaimReturn}
            className="mt-2 w-full rounded-lg bg-fuchsia-600 py-2 text-xs font-bold text-white disabled:opacity-35"
          >
            {offer.done ? 'Забрать сундук' : 'Сначала сделай лёгкое дело'}
          </button>
        </div>
      )}
    </section>
  );
}
