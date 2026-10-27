import { useEffect, useMemo, useState } from 'react';
import { Clock, Crosshair, Footprints, Map, Pickaxe, Radio, Zap } from 'lucide-react';
import { formatPalium } from '../lib/game';
import {
  BREACH_RANKS,
  END_PER_STEPS_BLOCK,
  STEPS_PER_END_BLOCK,
  formatSteps,
  msUntilRadarRefresh,
  previewStepsEnd,
  rankLevelHint,
} from '../lib/breaches';
import { attackApCost, getGearBonuses, isMageWeapon } from '../lib/equipment';
import { WORLD_NODES, formatCooldown, nodeCooldownLeft, nodeLootPreview, pickNodeSite } from '../lib/world';

/** Плашка после полной зачистки Бреши. */
export function BreachClearCard({ reward, onClose }) {
  const items = reward?.items ?? [];
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="system-panel modal-in w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 text-center font-display text-[11px] tracking-[0.28em] text-neon/80">ПРОТОКОЛ ЗАКРЫТИЯ</div>
        <p className="text-center font-display text-base leading-snug text-zinc-100">Поздравляем, Носитель.</p>
        <p className="mt-2 text-center text-sm leading-relaxed text-zinc-300">
          Брешь «{reward?.name}» закрыта. Добыча зафиксирована Системой.
        </p>
        <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-center text-sm font-bold text-amber-200">
          +{formatPalium(reward?.palium ?? 0)} Палиум
        </div>
        {items.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2">
                <span className="min-w-0 truncate text-sm text-zinc-100">
                  {item.emoji} {item.name}
                </span>
                <span className="shrink-0 font-display text-sm text-neon">×{item.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-center text-[12px] text-zinc-500">Предметов в добыче нет.</p>
        )}
        <button type="button" onClick={onClose} className="mt-4 w-full rounded-xl bg-neon py-3 text-sm font-bold text-zinc-950">
          Принять
        </button>
      </div>
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/70 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`flex shrink-0 flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-bold transition ${
            value === o.id ? 'bg-neon/15 text-neon shadow-[inset_0_0_0_1px_rgb(34_211_238/0.5)]' : 'text-zinc-500'
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function useNow(active = true, ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [active, ms]);
  return now;
}

function formatCountdown(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function StepsBank({ player, onSetSteps }) {
  const [value, setValue] = useState(String(player.steps?.today ?? ''));
  useEffect(() => {
    setValue(String(player.steps?.today || ''));
  }, [player.steps?.today, player.steps?.date]);

  const preview = previewStepsEnd(player, value);

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Footprints size={14} className="text-cyan-400" />
        <h3 className="font-display text-xs tracking-widest text-cyan-300">БАНК ШАГОВ</h3>
      </div>
      <div className="mb-2 flex justify-between text-[11px] text-zinc-400">
        <span>
          Доступно: <b className="text-cyan-300">{formatSteps(player.steps?.bank)}</b>
        </span>
        <span>
          Сегодня: <b className="text-zinc-200">{formatSteps(player.steps?.today)}</b>
        </span>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Шаги за сегодня"
          className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-bold text-cyan-300 outline-none focus:border-cyan-500"
        />
        <button
          onClick={() => onSetSteps(value)}
          className="rounded-lg bg-cyan-600 px-3 py-2 text-[11px] font-bold text-white shadow-[0_0_12px_rgb(8_145_178/0.45)]"
        >
          Записать
        </button>
      </div>
      {preview.newlyCredited > 0 ? (
        <p className="mt-2 text-[11px] font-bold leading-relaxed text-emerald-400">
          +{preview.newlyCredited.toLocaleString('ru-RU')} шагов → +{preview.points} END
        </p>
      ) : (
        <p className="mt-2 text-[10px] leading-relaxed text-zinc-500">
          Ходьба: {STEPS_PER_END_BLOCK.toLocaleString('ru-RU')} шагов = {END_PER_STEPS_BLOCK} END.
        </p>
      )}
      <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">
        Разница с прошлым вводом уходит в банк (переходы к Брешам). Бег в прокачке выгоднее на километр.
      </p>
    </div>
  );
}

function RadarMap({ breaches, selectedId, onSelect }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-full border border-neon/30 bg-[radial-gradient(circle_at_center,#0c1929_0%,#05080f_70%)] shadow-[inset_0_0_40px_rgb(34_211_238/0.12)]">
      <div className="pointer-events-none absolute inset-[12%] rounded-full border border-neon/10" />
      <div className="pointer-events-none absolute inset-[28%] rounded-full border border-neon/15" />
      <div className="pointer-events-none absolute inset-[44%] rounded-full border border-neon/20" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-neon/10" />
      <div className="pointer-events-none absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-neon/10" />
      <div className="absolute top-1/2 left-1/2 z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-neon/60 bg-neon/20 text-[10px] font-bold text-neon">
        Я
      </div>
      {breaches.map((b) => {
        const def = BREACH_RANKS[b.rank];
        const left = 50 + b.x * 42;
        const top = 50 + b.y * 42;
        const selected = selectedId === b.id;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => onSelect(b.id)}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition active:scale-95"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: selected ? 18 : 12,
              height: selected ? 18 : 12,
              borderColor: def.color,
              background: b.traveled ? def.color : `${def.color}55`,
              boxShadow: selected ? `0 0 14px ${def.color}` : `0 0 8px ${def.color}88`,
            }}
            title={b.name}
            aria-label={b.name}
          />
        );
      })}
    </div>
  );
}

function BreachCard({ breach, bank, ap, onTravel, onEnter, selected, onSelect }) {
  const def = BREACH_RANKS[breach.rank];
  const canTravel = !breach.traveled && bank >= breach.stepsCost;
  const canEnter = breach.traveled && ap >= breach.apCost;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(breach.id)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(breach.id)}
      className="rounded-xl border bg-zinc-900/70 p-3 text-left transition"
      style={{
        borderColor: selected ? def.color : `${def.color}44`,
        boxShadow: selected ? `0 0 16px ${def.color}33` : 'none',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-display text-sm text-zinc-100">{breach.name}</div>
          <div className="mt-0.5 text-[10px] text-zinc-500">
            Дистанция: {Number(breach.distanceKm).toFixed(1)} км (Требуется шагов:{' '}
            {formatSteps(breach.stepsCost)})
          </div>
          <div className="mt-0.5 text-[10px] text-zinc-600">
            Азимут {Math.round((breach.angle * 180) / Math.PI)}°
          </div>
          <div className="mt-0.5 text-[10px] font-bold" style={{ color: def.color }}>
            {rankLevelHint(breach.rank)}
          </div>
        </div>
        <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold" style={{ borderColor: def.color, color: def.color }}>
          {def.label}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
        <span className="inline-flex items-center gap-1 rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 font-bold text-cyan-300">
          <Footprints size={10} /> {formatSteps(breach.stepsCost)}
        </span>
        <span className="inline-flex items-center gap-1 rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 font-bold text-blue-300">
          <Zap size={10} /> {breach.apCost} AP
        </span>
        {breach.traveled && <span className="rounded border border-emerald-500/40 px-1.5 py-0.5 font-bold text-emerald-400">Переход выполнен</span>}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          disabled={breach.traveled || !canTravel}
          onClick={(e) => {
            e.stopPropagation();
            onTravel(breach.id);
          }}
          className="rounded-lg py-2 text-[11px] font-bold text-white disabled:opacity-30"
          style={{ background: canTravel ? '#0891b2' : '#3f3f46' }}
        >
          Совершить переход
        </button>
        <button
          disabled={!canEnter}
          onClick={(e) => {
            e.stopPropagation();
            onEnter(breach.id);
          }}
          className="rounded-lg py-2 text-[11px] font-bold text-white disabled:opacity-30"
          style={{ background: canEnter ? def.color : '#3f3f46', boxShadow: canEnter ? `0 0 12px ${def.color}55` : 'none' }}
        >
          Войти в Брешь
        </button>
      </div>
    </div>
  );
}

function BreachCombat({
  player,
  onStrike,
  onDefend,
  onBarrier,
  onEndTurn,
  onTrinket,
  onContinue,
  onFlee,
}) {
  const s = player.breach;
  const def = BREACH_RANKS[s.rank] ?? BREACH_RANKS.F;
  const enemy = s.enemy;
  const total = s.enemies?.length ?? 1;
  const room = (s.room ?? 0) + 1;
  const intent = s.enemyIntent;
  const ap = s.combatAp ?? 0;
  const gear = getGearBonuses(player);
  const strikeCost = attackApCost(player);
  const showTrinket = Boolean(gear.trinketShield) && onTrinket;

  if (s.ui === 'victory' && s.victory) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 text-center">
          <div className="font-display text-sm tracking-widest text-amber-300">ПОБЕДА</div>
          <div className="mt-2 text-lg text-zinc-100">{s.victory.name}</div>
          <div className="mt-1 text-sm text-sky-300">+{formatPalium(s.victory.gain)} Палиум</div>
          <div className="mt-1 text-[11px] text-zinc-500">Всего лута: {formatPalium(s.lootPalium)} Палиум</div>
          <button
            type="button"
            onClick={onContinue}
            className="mt-4 w-full rounded-xl py-3 text-sm font-bold text-white"
            style={{ background: def.color }}
          >
            {s.victory.final ? 'Забрать лут и выйти' : 'Следующий враг'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-center font-display text-xs tracking-widest" style={{ color: def.color }}>
        БРЕШЬ · {def.label} · ВРАГ {room}/{total}
        {enemy.boss ? ' · ХОЗЯИН' : ''} · ХОД {s.turn}
      </div>
      <div className="text-center text-[10px] text-zinc-500">{s.name}</div>

      <div className="rounded-xl border bg-zinc-900/80 p-4 text-center" style={{ borderColor: `${def.color}66` }}>
        {intent && (
          <div className="mb-2 rounded-lg border border-zinc-700 bg-black/40 px-2 py-1.5 text-[11px] font-bold text-zinc-200">
            Намерение: {intent.icon} {intent.label}
            {intent.damage != null ? ` · ${intent.damage} урона` : ''}
            {intent.armor != null ? ` · +${intent.armor} броня` : ''}
          </div>
        )}
        <div className="text-4xl">{enemy.emoji}</div>
        <div className="mt-1 font-display text-lg text-zinc-100">{enemy.name}</div>
        {enemy.level != null && (
          <div className="mt-0.5 text-[11px] font-bold" style={{ color: def.color }}>
            Ур. {enemy.level} · ATK {enemy.atk}
            {(s.enemyArmorBuff ?? 0) > 0 ? ` · броня +${s.enemyArmorBuff}` : ''}
          </div>
        )}
        <div className="mt-2 h-3 overflow-hidden rounded-sm border border-zinc-800 bg-zinc-950">
          <div className="h-full transition-all" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%`, background: def.color }} />
        </div>
        <div className="mt-1 text-xs tabular-nums text-zinc-400">
          HP {enemy.hp}/{enemy.maxHp}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
        <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
          <span>HP</span>
          <span>
            {s.playerHp}/{s.playerMaxHp}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-sm bg-zinc-950">
          <div className="h-full bg-gradient-to-r from-rose-900 to-rose-500" style={{ width: `${(s.playerHp / s.playerMaxHp) * 100}%` }} />
        </div>
        {(s.playerMaxShield ?? 0) > 0 && (
          <>
            <div className="mt-2 mb-1 flex justify-between text-[11px] text-sky-400">
              <span>Щит</span>
              <span>
                {s.playerShield ?? 0}/{s.playerMaxShield}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-sm bg-zinc-950">
              <div
                className="h-full bg-sky-500"
                style={{ width: `${Math.min(100, ((s.playerShield ?? 0) / Math.max(1, s.playerMaxShield)) * 100)}%` }}
              />
            </div>
          </>
        )}
        <div className="mt-2 flex justify-between text-[11px]">
          <span className="font-bold text-neon">Combat AP: {ap}/3</span>
          <span className="text-sky-400">Лут {formatPalium(s.lootPalium ?? 0)} P</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onStrike}
          disabled={ap < strikeCost}
          className="rounded-xl py-3 text-xs font-bold text-white disabled:opacity-40"
          style={{ background: def.color }}
        >
          Атака ({strikeCost} AP)
        </button>
        <button
          type="button"
          onClick={onDefend}
          disabled={ap < 1}
          className="rounded-xl border border-zinc-600 bg-zinc-900 py-3 text-xs font-bold text-zinc-200 disabled:opacity-40"
        >
          {gear.hasShield ? 'Блок щитом' : 'Защитная стойка'} (1 AP)
        </button>
        <button
          type="button"
          onClick={onEndTurn}
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 py-3 text-xs font-bold text-amber-300"
        >
          Конец хода
        </button>
        <button
          type="button"
          onClick={onFlee}
          className="rounded-xl border border-zinc-700 py-3 text-xs font-bold text-zinc-400"
        >
          Отступить
        </button>
      </div>
      {isMageWeapon(player) && (
        <button
          type="button"
          onClick={onBarrier}
          disabled={ap < 1}
          className="w-full rounded-xl border border-sky-400/40 bg-sky-400/10 py-2.5 text-xs font-bold text-sky-200 disabled:opacity-40"
        >
          Барьер (1 AP){s.barrierCut ? ' · готов' : ''}
        </button>
      )}
      {showTrinket && (
        <button
          type="button"
          disabled={s.trinketUsed}
          onClick={onTrinket}
          className="w-full rounded-xl border border-violet-500/40 bg-violet-500/10 py-2.5 text-xs font-bold text-violet-300 disabled:opacity-40"
        >
          Глаз аномалии: +{gear.trinketShield} щита {s.trinketUsed ? '(использован)' : ''}
        </button>
      )}

      <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-neon/20 bg-black/60 p-3 font-mono text-[11px] leading-relaxed text-neon/90">
        {[...s.log].reverse().map((line, i) => (
          <div key={`${i}-${line.slice(0, 24)}`}>{line}</div>
        ))}
      </div>
    </div>
  );
}

function RadarTab({
  player,
  onTravel,
  onEnter,
  onStrike,
  onDefend,
  onBarrier,
  onEndTurn,
  onTrinket,
  onContinue,
  onFlee,
  onRefreshRadar,
}) {
  const now = useNow(true, 1000);
  const breaches = player.radar?.breaches ?? [];
  const [selectedId, setSelectedId] = useState(breaches[0]?.id ?? null);
  const left = msUntilRadarRefresh(now);

  useEffect(() => {
    onRefreshRadar?.();
  }, [onRefreshRadar]);

  useEffect(() => {
    if (!breaches.find((b) => b.id === selectedId)) {
      setSelectedId(breaches[0]?.id ?? null);
    }
  }, [breaches, selectedId]);

  if (player.breach?.active) {
    return (
      <BreachCombat
        player={player}
        onStrike={onStrike}
        onDefend={onDefend}
        onBarrier={onBarrier}
        onEndTurn={onEndTurn}
        onTrinket={onTrinket}
        onContinue={onContinue}
        onFlee={onFlee}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <Radio size={12} className="text-neon" /> Радар Брешей
        </span>
        <span className="tabular-nums text-neon/80">Обновление через {formatCountdown(left)}</span>
      </div>

      <RadarMap breaches={breaches} selectedId={selectedId} onSelect={setSelectedId} />

      <p className="text-center text-[10px] text-zinc-500">1 км = 1000 шагов · дистанция до 10 км</p>
      <div className="flex flex-wrap justify-center gap-2 text-[9px]">
        {Object.values(BREACH_RANKS).map((r) => (
          <span key={r.id} className="rounded-full border px-2 py-0.5 font-bold" style={{ borderColor: r.color, color: r.color }}>
            {r.label}: {r.ap} AP
          </span>
        ))}
      </div>

      {breaches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-8 text-center text-xs text-zinc-600">Нет активных Брешей. Ждите обновления радара.</div>
      ) : (
        breaches.map((b) => (
          <BreachCard
            key={b.id}
            breach={b}
            bank={player.steps?.bank ?? 0}
            ap={player.ap}
            selected={selectedId === b.id}
            onSelect={setSelectedId}
            onTravel={onTravel}
            onEnter={onEnter}
          />
        ))
      )}
    </div>
  );
}

function NodeCard({ node, player, now, onGather }) {
  const left = nodeCooldownLeft(player, node.id, now);
  const ready = left <= 0;
  const enough = player.ap >= node.apCost;
  const site = pickNodeSite(node, now);
  const lootItems = nodeLootPreview(node);
  const lootLabel = lootItems.map((it) => `${it.emoji} ${it.name}`).join(' · ');
  return (
    <div className="rounded-xl border bg-zinc-900/70 p-3" style={{ borderColor: ready ? `${node.color}66` : '#27272a', opacity: ready ? 1 : 0.72 }}>
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl" style={{ background: `${node.color}18` }}>
          {node.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-sm text-zinc-100">{site.name}</div>
          <div className="mt-0.5 text-[11px] text-zinc-500">{site.blurb}</div>
          <div className="mt-1.5 flex flex-wrap gap-2 text-[10px]">
            <span className="inline-flex items-center gap-1 rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 font-bold text-blue-300">
              <Zap size={10} /> {node.apCost} AP
            </span>
            <span className="text-zinc-400">→ {lootLabel}</span>
          </div>
        </div>
      </div>
      <button
        disabled={!ready}
        onClick={() => onGather(node.id)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition active:scale-[0.98] disabled:cursor-not-allowed"
        style={{ background: ready ? (enough ? node.color : '#3f3f46') : '#27272a', color: ready ? '#fff' : '#71717a', boxShadow: ready && enough ? `0 0 14px ${node.color}66` : 'none' }}
      >
        {ready ? (
          <>
            <Pickaxe size={14} /> Собрать
          </>
        ) : (
          <>
            <Clock size={14} /> Восстановление {formatCooldown(left)}
          </>
        )}
      </button>
    </div>
  );
}

export default function WorldScreen({
  player,
  onGather,
  onSetSteps,
  onTravel,
  onEnterBreach,
  onBreachStrike,
  onBreachDefend,
  onBreachBarrier,
  onBreachEndTurn,
  onBreachTrinket,
  onBreachContinue,
  onBreachFlee,
  onRefreshRadar,
}) {
  const [tab, setTab] = useState('radar');
  const now = useNow(tab === 'gather');

  const tabs = useMemo(
    () => [
      { id: 'radar', label: 'Радар', icon: <Crosshair size={12} /> },
      { id: 'gather', label: 'Сбор', icon: <Pickaxe size={12} /> },
    ],
    [],
  );

  useEffect(() => {
    if (player.breach?.active) setTab('radar');
  }, [player.breach?.active]);

  return (
    <div className="space-y-4">
      <StepsBank player={player} onSetSteps={onSetSteps} />

      <section className="system-panel space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Map size={16} className="text-neon" />
          <h2 className="font-display text-sm tracking-widest text-neon/90">ОТКРЫТЫЙ МИР</h2>
        </div>
        <Segmented value={tab} onChange={setTab} options={tabs} />
        {tab === 'radar' && (
          <RadarTab
            player={player}
            onTravel={onTravel}
            onEnter={onEnterBreach}
            onStrike={onBreachStrike}
            onDefend={onBreachDefend}
            onBarrier={onBreachBarrier}
            onEndTurn={onBreachEndTurn}
            onTrinket={onBreachTrinket}
            onContinue={onBreachContinue}
            onFlee={onBreachFlee}
            onRefreshRadar={onRefreshRadar}
          />
        )}
        {tab === 'gather' && (
          <div className="space-y-2">
            <p className="text-[11px] text-zinc-500">
              Сбор тратит AP. Места меняются каждый день, ресурсы — в сумку (потом для профессий).
            </p>
            {WORLD_NODES.map((node) => (
              <NodeCard key={node.id} node={node} player={player} now={now} onGather={onGather} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
