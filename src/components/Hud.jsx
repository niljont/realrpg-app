import { useEffect, useState } from 'react';
import { Brain, Crown, Heart, Utensils, Zap, Plus, Skull, Gem, Settings } from 'lucide-react';
import {
  BUFF_INFO,
  PALIUM_COLOR,
  TITLES,
  formatDuration,
  formatPalium,
  isClogged,
  isFocused,
  isMetabolism,
  isSated,
  levelFromXp,
  msUntilNextAp,
  hpRegenPerTick,
  msUntilNextHp,
  titleName,
} from '../lib/game';
import { getPlayerHp, playerMaxHp } from '../lib/equipment';
import SettingsModal from './SettingsModal';

function Bar({ icon: Icon, label, value, max, from, to, glow, children, onBarClick }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} color={glow} style={{ filter: `drop-shadow(0 0 4px ${glow})` }} className="shrink-0" />
      <button
        type="button"
        disabled={!onBarClick}
        onClick={onBarClick}
        className="relative h-4 flex-1 overflow-hidden rounded-sm border border-zinc-800 bg-zinc-900 text-left disabled:cursor-default"
      >
        <div
          className="bar-shine relative h-full overflow-hidden transition-[width] duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${from}, ${to})`, boxShadow: `0 0 10px ${glow}` }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-bold leading-none tracking-wider text-white [text-shadow:0_1px_2px_#000]">
          <span>{label}</span>
          <span>
            {value} / {max}
          </span>
        </div>
      </button>
      {children}
    </div>
  );
}

function minsLeft(until) {
  return Math.max(0, Math.ceil((until - Date.now()) / 60000));
}

function untilOf(player, info) {
  return player.buffs?.[info.untilKey] || (info.altUntilKey ? player.buffs?.[info.altUntilKey] : 0) || 0;
}

function TipCard({ title, body, color, onClose }) {
  return (
    <div
      className="mt-2 rounded-xl border px-3 py-2 text-[11px] leading-relaxed"
      style={{ borderColor: `${color}66`, background: `${color}12`, color: '#e4e4e7' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-0.5 flex items-center justify-between gap-2">
        <span className="font-display text-xs" style={{ color }}>
          {title}
        </span>
        <button type="button" onClick={onClose} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300">
          ✕
        </button>
      </div>
      {body}
    </div>
  );
}

export default function Hud({ player, onOpenEnergy, onOpenTitles, onSignOut, onResetAccount, onRename, onChangeGender, onHideActivity, onNotifyDaily }) {
  const { level, xp, need } = levelFromXp(player.xp);
  const maxHpVal = player.breach?.active ? (player.breach.playerMaxHp ?? playerMaxHp(player)) : playerMaxHp(player);
  const hpVal = player.breach?.active ? (player.breach.playerHp ?? getPlayerHp(player)) : getPlayerHp(player);
  const title = TITLES[player.activeTitle] ?? TITLES.wanderer;
  const metabolism = isMetabolism(player);
  const sated = !metabolism && isSated(player);
  const focused = isFocused(player);
  const clogged = isClogged(player);
  const [tip, setTip] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (tip?.type !== 'ap' && tip?.type !== 'hp') return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [tip?.type]);

  const toggleTip = (next) => setTip((cur) => (cur?.id === next.id ? null : next));

  const apLeft = msUntilNextAp(player, now);
  const hpLeft = msUntilNextHp(player, maxHpVal, now);
  const apTipBody =
    player.ap >= player.maxAp
      ? 'Энергия на максимуме. Пассивный реген приостановлен.'
      : `До +1 AP: ${formatDuration(apLeft)} · реген каждые 30 мин. Утром AP восстанавливается до max.`;
  const hpTick = hpRegenPerTick(maxHpVal);
  const hpTipBody = player.breach?.active
    ? `В Бреши HP общее со статусом. Пассивный реген снаружи боя: +${hpTick} (5%) / 15 мин.`
    : hpVal >= maxHpVal
      ? 'HP на максимуме. Реген приостановлен.'
      : `До +${hpTick} HP: ${formatDuration(hpLeft)} · 5% максимума каждые 15 мин. В Бреши тот же запас HP.`;

  return (
    <>
    <header className="sticky top-0 z-30 border-b border-neon/20 bg-void/85 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <button
              onClick={onOpenTitles}
              className="title-badge inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-display text-[11px] tracking-wide"
              style={{ '--c': title.color }}
            >
              <Crown size={11} />
              {titleName(player.activeTitle, player.gender)}
              {(title.tier ?? 0) > 0 && <span className="opacity-80">· Ур.{title.tier}</span>}
            </button>
            {metabolism && (
              <button
                type="button"
                onClick={() => toggleTip({ id: 'metabolism', type: 'buff', info: BUFF_INFO.metabolism })}
                className="inline-flex items-center gap-1 rounded-full border border-orange-500/50 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-400"
              >
                <Utensils size={10} />
                {minsLeft(untilOf(player, BUFF_INFO.metabolism))}м
              </button>
            )}
            {sated && (
              <button
                type="button"
                onClick={() => toggleTip({ id: 'satiety', type: 'buff', info: BUFF_INFO.satiety })}
                className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400"
              >
                <Utensils size={10} />
                {minsLeft(untilOf(player, BUFF_INFO.satiety))}м
              </button>
            )}
            {focused && (
              <button
                type="button"
                onClick={() => toggleTip({ id: 'focus', type: 'buff', info: BUFF_INFO.focus })}
                className="inline-flex items-center gap-1 rounded-full border border-blue-500/50 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400"
              >
                <Brain size={10} />
                {minsLeft(untilOf(player, BUFF_INFO.focus))}м
              </button>
            )}
            {clogged && (
              <button
                type="button"
                onClick={() => toggleTip({ id: 'clog', type: 'buff', info: BUFF_INFO.clog })}
                className="inline-flex items-center gap-1 rounded-full border border-red-500/50 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400"
              >
                <Skull size={10} />
                {minsLeft(untilOf(player, BUFF_INFO.clog))}м
              </button>
            )}
          </div>
          <h1 className="truncate font-display text-xl leading-tight text-zinc-50">{player.name}</h1>
          <div className="text-xs text-zinc-400">
            Уровень <span className="glow-text font-display text-sm text-neon">{level}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-1.5">
          <button
            type="button"
            onClick={() => toggleTip({ id: 'palium', type: 'palium' })}
            className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold tabular-nums"
            style={{ borderColor: `${PALIUM_COLOR}55`, color: PALIUM_COLOR, background: `${PALIUM_COLOR}14`, boxShadow: `0 0 12px ${PALIUM_COLOR}33` }}
            title="Палиум"
            aria-label="Что такое Палиум"
          >
            <Gem size={13} style={{ filter: `drop-shadow(0 0 4px ${PALIUM_COLOR})` }} />
            {formatPalium(player.palium)}
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex h-9 w-9 touch-manipulation items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/70 text-zinc-400 transition hover:border-neon/40 hover:text-neon active:scale-95"
            title="Настройки"
            aria-label="Настройки"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {tip?.type === 'palium' && (
        <TipCard
          title="Палиум"
          color={PALIUM_COLOR}
          body="Валюта Системы. Падает с Брешей, контракта, босса дня и продажи добычи. Им платят в магазине за снаряжение и расходники. Считается тысячными: 0.001 — самая мелкая монета."
          onClose={() => setTip(null)}
        />
      )}

      {tip?.type === 'buff' && tip.info && (
        <TipCard
          title={tip.info.label}
          color={tip.info.color}
          body={
            <>
              <div>{tip.info.desc}</div>
              <div className="mt-1 text-zinc-400">Осталось: {minsLeft(untilOf(player, tip.info))} мин</div>
            </>
          }
          onClose={() => setTip(null)}
        />
      )}

      <div className="mt-2.5 space-y-1.5">
        <Bar
          icon={Heart}
          label="HP"
          value={hpVal}
          max={maxHpVal}
          from="#7f1d1d"
          to="#ef4444"
          glow="#ef4444"
          onBarClick={() => toggleTip({ id: 'hp', type: 'hp' })}
        />
        {tip?.type === 'hp' && (
          <TipCard title="Здоровье" color="#ef4444" body={hpTipBody} onClose={() => setTip(null)} />
        )}
        <Bar
          icon={Zap}
          label="AP"
          value={player.ap}
          max={player.maxAp}
          from="#1e3a8a"
          to="#3b82f6"
          glow="#3b82f6"
          onBarClick={() => toggleTip({ id: 'ap', type: 'ap' })}
        >
          <button
            onClick={onOpenEnergy}
            className="plus-btn flex h-6 w-6 shrink-0 items-center justify-center rounded border border-blue-400 bg-blue-500/20 text-blue-200 active:scale-90"
            aria-label="Система энергии"
          >
            <Plus size={14} strokeWidth={3} />
          </button>
        </Bar>
        {tip?.type === 'ap' && (
          <TipCard title="Восстановление энергии" color="#3b82f6" body={apTipBody} onClose={() => setTip(null)} />
        )}
        <div className="flex items-center gap-2 pl-[22px]">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-[width] duration-700" style={{ width: `${(xp / need) * 100}%` }} />
          </div>
          <span className="text-[10px] tabular-nums text-zinc-500">
            XP {xp}/{need}
          </span>
        </div>
      </div>
    </header>

    {settingsOpen && (
      <SettingsModal
        player={player}
        onClose={() => setSettingsOpen(false)}
        onSignOut={onSignOut}
        onResetAccount={onResetAccount}
        onRename={onRename}
        onChangeGender={onChangeGender}
        onHideActivity={onHideActivity}
        onNotifyDaily={onNotifyDaily}
      />
    )}
    </>
  );
}
