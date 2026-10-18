import { useState } from 'react';
import { Ban, Check, Dumbbell, Plus, Trash2, X } from 'lucide-react';
import {
  CUSTOM_QUEST_POINTS,
  EXERCISES,
  LOAD_DIFFICULTIES,
  STATS,
  STAT_META,
  customQuestStreakView,
  dayKey,
  exercisePoints,
  findExercise,
  floorAwardPoints,
  formatAmount,
  xpMultiplier,
} from '../lib/game';

function pointsPreview(raw) {
  const awarded = floorAwardPoints(raw);
  const rough = Math.round(raw * 10) / 10;
  if (awarded <= 0) return { awarded: 0, label: '' };
  if (rough !== awarded) {
    return { awarded, label: ` · +${awarded} pt (из ${rough})` };
  }
  return { awarded, label: ` · +${awarded} pt` };
}

function ExerciseRow({ ex, color, mult, amount, diff, onAmount, onDiff }) {
  const load = ex.loadDifficulty ? LOAD_DIFFICULTIES.find((d) => d.id === diff) : null;
  const rate = load?.rate ?? ex.rate;
  const raw = exercisePoints(ex, Number(amount) || 0, rate) * mult;
  const { awarded: pts, label: ptsLabel } = pointsPreview(raw);

  return (
    <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-zinc-100">{ex.name}</div>
          <div className="text-[10px] text-zinc-500">
            {ex.loadDifficulty ? (
              <>
                1 {ex.unit} = {rate} pt ({load?.label})
              </>
            ) : (
              <>
                1 {ex.unit} = {ex.rate} pt
              </>
            )}
            {pts > 0 && <span style={{ color }}>{ptsLabel}</span>}
          </div>
        </div>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step={ex.step ?? 1}
          value={amount}
          onChange={(e) => onAmount(e.target.value)}
          placeholder={ex.unit}
          className="w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-right font-bold tabular-nums outline-none"
          style={{ color }}
        />
      </div>
      {ex.loadDifficulty && (
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {LOAD_DIFFICULTIES.map((d) => {
            const active = diff === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onDiff(d.id)}
                className="rounded-lg border px-1 py-1.5 text-[10px] font-bold transition"
                style={{
                  borderColor: active ? color : '#3f3f46',
                  color: active ? color : '#71717a',
                  background: active ? `${color}22` : 'transparent',
                }}
              >
                {d.label}
                <span className="mt-0.5 block font-display text-[9px] opacity-80">{d.rate} pt</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CustomQuestForm({ color, onCreate, onCancel }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  return (
    <div className="space-y-2 rounded-xl border px-3 py-3" style={{ borderColor: `${color}55`, background: `${color}12` }}>
      <div className="font-display text-[11px] tracking-widest" style={{ color }}>
        НОВЫЙ КВЕСТ
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Название · напр. День без энергетиков"
        maxLength={64}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
        style={{ borderColor: name.trim() ? `${color}66` : undefined }}
        autoFocus
      />
      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Короткое описание (необязательно)"
        maxLength={120}
        className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-[11px] text-zinc-400 outline-none placeholder:text-zinc-600"
      />
      <p className="text-[10px] text-zinc-500">Награда за выполнение: всегда {CUSTOM_QUEST_POINTS} pt Воли (+ XP).</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!name.trim()}
          onClick={() => {
            if (!name.trim()) return;
            onCreate({ name: name.trim(), desc: desc.trim() });
          }}
          className="flex-1 rounded-lg py-2 text-xs font-bold text-white disabled:opacity-35"
          style={{ background: color }}
        >
          Создать
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-400"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function CustomQuestRow({ quest, color, mult, today, onComplete, onBlock, onRemove }) {
  const [confirm, setConfirm] = useState(null); // done | fail | null
  const raw = CUSTOM_QUEST_POINTS * mult;
  const { awarded: pts, label: ptsLabel } = pointsPreview(raw);
  const { current, maxStreak, doneToday, blocked } = customQuestStreakView(quest, today);
  const inactive = blocked || doneToday;

  if (confirm === 'done') {
    return (
      <div className="rounded-xl border px-3 py-3" style={{ borderColor: `${color}66`, background: `${color}14` }}>
        <div className="text-sm font-semibold text-zinc-100">Квест выполнен?</div>
        <div className="mt-0.5 text-[11px] text-zinc-400">«{quest.name}»</div>
        <div className="mt-1 text-[10px] text-zinc-500">
          Будет начислено +{pts} pt Воли
          {raw > pts ? ` (из ${Math.round(raw * 10) / 10})` : ''}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onComplete(quest.id);
              setConfirm(null);
            }}
            className="rounded-lg py-2.5 text-xs font-bold text-white"
            style={{ background: color, boxShadow: `0 0 12px ${color}66` }}
          >
            Да, выполнил
          </button>
          <button
            type="button"
            onClick={() => setConfirm(null)}
            className="rounded-lg border border-zinc-700 py-2.5 text-xs font-bold text-zinc-400"
          >
            Отмена
          </button>
        </div>
      </div>
    );
  }

  if (confirm === 'fail') {
    return (
      <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 px-3 py-3">
        <div className="text-sm font-semibold text-rose-300">Отметить срыв?</div>
        <div className="mt-0.5 text-[11px] text-zinc-400">«{quest.name}»</div>
        <div className="mt-1 text-[10px] text-zinc-500">
          Квест станет неактивным до 00:00. Стрик сбросится (рекорд {maxStreak} сохранится).
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onBlock(quest.id);
              setConfirm(null);
            }}
            className="rounded-lg bg-rose-600 py-2.5 text-xs font-bold text-white"
          >
            Да, сорвался
          </button>
          <button
            type="button"
            onClick={() => setConfirm(null)}
            className="rounded-lg border border-zinc-700 py-2.5 text-xs font-bold text-zinc-400"
          >
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${
        blocked
          ? 'border-rose-500/60 bg-rose-500/15'
          : doneToday
            ? 'border-emerald-500/35 bg-emerald-500/10'
            : 'border-violet-500/25 bg-violet-500/5'
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-semibold ${blocked ? 'text-rose-300' : 'text-zinc-100'}`}>
            {quest.name}
            {blocked ? ' · срыв' : doneToday ? ' · выполнено' : ''}
          </div>
          {quest.desc ? <div className="mt-0.5 text-[11px] text-zinc-500">{quest.desc}</div> : null}
          <div className="mt-1 text-[10px] text-zinc-500">
            1 квест = {CUSTOM_QUEST_POINTS} pt
            {!inactive && pts > 0 && <span style={{ color }}>{ptsLabel}</span>}
          </div>
          <div className={`mt-1 text-[10px] font-bold ${blocked ? 'text-rose-400' : 'text-violet-300/90'}`}>
            Стрик {current} · рекорд {maxStreak}
            {blocked ? ' · блок до 00:00' : ''}
          </div>
        </div>
        <button
          type="button"
          disabled={inactive}
          onClick={() => setConfirm('done')}
          className="rounded-lg px-3 py-2 text-[11px] font-bold text-white transition active:scale-95 disabled:opacity-35"
          style={{ background: color, boxShadow: inactive ? 'none' : `0 0 12px ${color}77` }}
        >
          Готово
        </button>
        <button
          type="button"
          disabled={inactive}
          onClick={() => setConfirm('fail')}
          className="rounded-lg border border-rose-500/40 p-2 text-rose-400 disabled:opacity-35"
          aria-label="Срыв"
          title="Срыв"
        >
          <Ban size={14} />
        </button>
        <button
          type="button"
          onClick={() => onRemove(quest.id)}
          className="rounded-lg border border-zinc-700 p-2 text-zinc-500 hover:text-rose-400"
          aria-label="Удалить квест"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function TrainingScreen({ player, onTrain, onTrainBatch, onAddQuest, onRemoveQuest, onBlockQuest }) {
  const [stat, setStat] = useState('STR');
  const [creating, setCreating] = useState(false);
  const [drafts, setDrafts] = useState({});
  const today = dayKey();
  const todayLog = (player.log ?? []).filter((e) => e.date === today);
  const todayTotals = Object.fromEntries(STATS.map((s) => [s, todayLog.filter((e) => e.stat === s).reduce((a, e) => a + e.points, 0)]));
  const color = STAT_META[stat].color;
  const mult = xpMultiplier(player, stat);
  const customQuests = (player.customQuests ?? []).filter((q) => !q.archived);

  return (
    <div className="space-y-4">
      <section className="system-panel p-4">
        <div className="mb-3 flex items-center gap-2">
          <Dumbbell size={16} className="text-neon" />
          <h2 className="font-display text-sm tracking-widest text-neon/90">ПРОКАЧКА</h2>
        </div>
        <p className="mb-3 text-[11px] text-zinc-500">
          Выполняйте упражнения — качайте статы и XP. Дробные очки пишутся вниз (12.5 → 12). AP здесь не тратится.
        </p>
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
                onClick={() => {
                  setStat(s);
                  setCreating(false);
                }}
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
          {EXERCISES[stat].map((ex) => {
            const draft = drafts[`${stat}:${ex.id}`] ?? { amount: '', diff: 'normal' };
            return (
              <ExerciseRow
                key={`${stat}-${ex.id}`}
                ex={ex}
                color={color}
                mult={mult}
                amount={draft.amount}
                diff={draft.diff}
                onAmount={(amount) =>
                  setDrafts((prev) => ({ ...prev, [`${stat}:${ex.id}`]: { ...draft, amount } }))
                }
                onDiff={(diff) =>
                  setDrafts((prev) => ({ ...prev, [`${stat}:${ex.id}`]: { ...draft, diff } }))
                }
              />
            );
          })}
        </div>
        {(() => {
          const filled = EXERCISES[stat]
            .map((ex) => {
              const draft = drafts[`${stat}:${ex.id}`] ?? { amount: '', diff: 'normal' };
              const load = ex.loadDifficulty ? LOAD_DIFFICULTIES.find((d) => d.id === draft.diff) : null;
              const rate = load?.rate ?? ex.rate;
              const pts = floorAwardPoints(exercisePoints(ex, Number(draft.amount) || 0, rate) * mult);
              if (pts <= 0) return null;
              return { id: ex.id, amount: Number(draft.amount), rate: ex.loadDifficulty ? rate : undefined, pts };
            })
            .filter(Boolean);
          const total = filled.reduce((sum, row) => sum + row.pts, 0);
          return (
            <button
              type="button"
              disabled={total <= 0}
              onClick={() => {
                const ok = onTrainBatch?.(
                  stat,
                  filled.map(({ id, amount, rate }) => ({ id, amount, rate })),
                );
                if (ok) {
                  setDrafts((prev) => {
                    const next = { ...prev };
                    for (const ex of EXERCISES[stat]) delete next[`${stat}:${ex.id}`];
                    return next;
                  });
                }
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-30"
              style={{ background: color, boxShadow: total > 0 ? `0 0 14px ${color}66` : 'none' }}
            >
              <Check size={16} />
              {total > 0 ? `Записать всё · +${total} pt` : 'Записать всё'}
            </button>
          );
        })()}

        {stat === 'WIL' && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-display text-[11px] tracking-widest text-violet-300">ЛИЧНЫЕ КВЕСТЫ</div>
                <p className="mt-0.5 text-[10px] text-zinc-500">Свои правила: день без сладкого, алкоголя, энергетиков…</p>
              </div>
              {!creating && (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/40 bg-violet-500/15 text-violet-300"
                  aria-label="Создать квест"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>

            {creating && (
              <CustomQuestForm
                color={color}
                onCancel={() => setCreating(false)}
                onCreate={(data) => {
                  if (onAddQuest?.(data)) setCreating(false);
                }}
              />
            )}

            {customQuests.length === 0 && !creating && (
              <div className="rounded-xl border border-dashed border-zinc-800 py-4 text-center text-[11px] text-zinc-600">
                Пока нет квестов. Нажми +, чтобы создать.
              </div>
            )}

            {customQuests.map((q) => (
              <CustomQuestRow
                key={q.id}
                quest={q}
                color={color}
                mult={mult}
                today={today}
                onComplete={(id) => onTrain('WIL', id, 1)}
                onBlock={(id) => onBlockQuest?.(id)}
                onRemove={(id) => onRemoveQuest?.(id)}
              />
            ))}
          </div>
        )}
      </section>

      {todayLog.length > 0 && (
        <section className="system-panel p-4">
          <h3 className="mb-2 font-display text-xs tracking-widest text-zinc-400">ЖУРНАЛ ЗА СЕГОДНЯ</h3>
          <ul className="space-y-1.5 text-xs">
            {[...todayLog].reverse().map((e) => {
              const isSteps = e.kind === 'steps' || e.exId === 'steps';
              if (isSteps) {
                const d = Number(e.delta) || 0;
                const sign = d > 0 ? '+' : '';
                const pts = Number(e.points) || 0;
                return (
                  <li key={e.ts} className="flex justify-between border-b border-zinc-800/70 pb-1.5 last:border-0">
                    <span className="text-zinc-300">
                      <b className="text-cyan-400">Шаги</b> {sign}
                      {d.toLocaleString('ru-RU')}
                      <span className="text-zinc-500"> · сегодня {(e.total ?? e.amount ?? 0).toLocaleString('ru-RU')}</span>
                    </span>
                    <span className="tabular-nums text-zinc-500">
                      {new Date(e.ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                      {pts > 0 ? ` · +${pts} END` : ''}
                    </span>
                  </li>
                );
              }
              const ex = findExercise(e.stat, e.exId, player);
              return (
                <li key={e.ts} className="flex justify-between border-b border-zinc-800/70 pb-1.5 last:border-0">
                  <span className="text-zinc-300">
                    <b style={{ color: STAT_META[e.stat].color }}>{e.stat}</b> {ex?.name ?? e.exId}
                    {ex?.custom ? '' : ` × ${formatAmount(e.amount)} ${ex?.unit ?? ''}`}
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
