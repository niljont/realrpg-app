import { useState } from 'react';
import { BatteryCharging, ChevronsUp, Info } from 'lucide-react';
import Modal from './Modal';
import {
  AP_PER_STRENGTH_SET,
  EXERCISES,
  PULLUPS_PER_SET,
  PUSHUPS_PER_SET,
  STAT_META,
  applyExpand,
  applyRefill,
  maxApReq,
  previewExpand,
  previewStrengthRefill,
  sumPoints,
} from '../lib/game';

function Progress({ value, max, color }) {
  return (
    <div className="h-3 overflow-hidden rounded-sm border border-zinc-800 bg-zinc-900">
      <div
        className="h-full transition-[width] duration-500"
        style={{ width: `${Math.min(100, max > 0 ? (value / max) * 100 : 0)}%`, background: color, boxShadow: `0 0 10px ${color}` }}
      />
    </div>
  );
}

function RefillTab({ player, commit }) {
  const [pushups, setPushups] = useState('');
  const [pullups, setPullups] = useState('');
  const full = player.ap >= player.maxAp;
  const preview = previewStrengthRefill(player, pushups, pullups);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-blue-500/30 bg-blue-500/5 px-4 py-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-400">Текущая энергия</div>
          <div className="font-display text-2xl text-blue-400">
            {player.ap} <span className="text-base text-zinc-500">/ {player.maxAp} AP</span>
          </div>
        </div>
        <div className="text-right text-xs text-zinc-400">
          Курс подхода
          <div className="font-display text-sm text-red-400">
            {PUSHUPS_PER_SET} отж. / {PULLUPS_PER_SET} подт. = +{AP_PER_STRENGTH_SET} AP
          </div>
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-zinc-100">Отжимания</div>
          <div className="text-[10px] text-zinc-500">{PUSHUPS_PER_SET} повт. = +{AP_PER_STRENGTH_SET} AP</div>
        </div>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          value={pushups}
          onChange={(e) => setPushups(e.target.value)}
          placeholder="0"
          className="w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-right font-bold text-red-400 outline-none"
        />
      </label>

      <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-zinc-100">Подтягивания</div>
          <div className="text-[10px] text-zinc-500">{PULLUPS_PER_SET} повт. = +{AP_PER_STRENGTH_SET} AP</div>
        </div>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          value={pullups}
          onChange={(e) => setPullups(e.target.value)}
          placeholder="0"
          className="w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-right font-bold text-red-400 outline-none"
        />
      </label>

      <div className="flex gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-[11px] leading-relaxed text-zinc-400">
        <Info size={14} className="mt-0.5 shrink-0 text-neon" />
        Эти повторения идут только в Энергию, не в дневную Прокачку. Пассивно: +1 AP / 30 мин. Утром AP = max.
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">
          Подходов: <b className="text-red-400">{preview.sets}</b>
        </span>
        <span className="font-display text-blue-400">+{full ? 0 : preview.gain} AP</span>
      </div>

      <button
        disabled={full || preview.sets <= 0}
        onClick={() => commit(applyRefill(player, { pushups, pullups })) && (setPushups(''), setPullups(''))}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-display tracking-wide text-white shadow-[0_0_20px_rgb(59_130_246/0.5)] transition active:scale-[0.98] disabled:opacity-30 disabled:shadow-none"
      >
        <BatteryCharging size={18} />
        {full ? 'Энергия заполнена' : 'Пополнить'}
      </button>
    </div>
  );
}

function ExpandTab({ player, commit }) {
  const [values, setValues] = useState({});
  const points = sumPoints('END', values);
  const req = maxApReq(player.maxAp);
  const preview = previewExpand(player, points);
  const color = STAT_META.END.color;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-400">Лимит AP</div>
          <div className="font-display text-2xl text-green-400">{player.maxAp} AP</div>
        </div>
        <div className="text-right text-[11px] text-zinc-400">
          Формула
          <div className="font-mono text-xs text-zinc-300">50 × 1.10^(max−10)</div>
        </div>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
          <span>Прогресс до {player.maxAp + 1} AP</span>
          <span className="tabular-nums">
            {player.endProgress} / {req}
          </span>
        </div>
        <Progress value={player.endProgress} max={req} color="#22c55e" />
      </div>

      <div className="space-y-2">
        {EXERCISES.END.map((ex) => (
          <label key={ex.id} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-zinc-100">{ex.name}</div>
              <div className="text-[10px] text-zinc-500">
                1 {ex.unit} = {ex.rate} pt
              </div>
            </div>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step={ex.step ?? 1}
              value={values[ex.id] ?? ''}
              onChange={(e) => setValues({ ...values, [ex.id]: e.target.value })}
              placeholder="0"
              className="w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-right font-bold outline-none"
              style={{ color }}
            />
            <span className="w-10 text-[11px] text-zinc-500">{ex.unit}</span>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">
          Очков выносливости: <b className="text-green-400">{points}</b>
        </span>
        <span className="font-display text-green-400">
          {preview.gained > 0 ? `+${preview.gained} Max AP` : `${preview.progress}/${maxApReq(preview.maxAp)}`}
        </span>
      </div>

      <button
        disabled={points <= 0}
        onClick={() => commit(applyExpand(player, values)) && setValues({})}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-display tracking-wide text-white shadow-[0_0_20px_rgb(34_197_94/0.45)] transition active:scale-[0.98] disabled:opacity-30 disabled:shadow-none"
      >
        <ChevronsUp size={18} /> Увеличить лимит AP
      </button>
    </div>
  );
}

const TABS = [
  { id: 'refill', label: 'Пополнить текущую энергию', color: '#3b82f6' },
  { id: 'expand', label: 'Увеличить лимит AP', color: '#22c55e' },
];

export default function EnergyModal({ player, commit, onClose }) {
  const [tab, setTab] = useState('refill');
  return (
    <Modal title="Система Энергии" onClose={onClose}>
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-zinc-800 bg-zinc-900/70 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="rounded-lg px-2 py-2 text-[11px] font-bold leading-tight transition"
            style={
              tab === t.id
                ? { background: `${t.color}26`, color: t.color, boxShadow: `inset 0 0 0 1px ${t.color}88, 0 0 12px ${t.color}44` }
                : { color: '#71717a' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'refill' ? <RefillTab player={player} commit={commit} /> : <ExpandTab player={player} commit={commit} />}
    </Modal>
  );
}
