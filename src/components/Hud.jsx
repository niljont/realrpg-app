import { Brain, Crown, Heart, Utensils, Zap, Plus, Skull, Gem, LogOut } from 'lucide-react';
import {
  PALIUM_COLOR,
  TITLES,
  formatPalium,
  isClogged,
  isFocused,
  isMetabolism,
  isSated,
  levelFromXp,
  maxHp,
  satietyHours,
  titleName,
} from '../lib/game';

function Bar({ icon: Icon, label, value, max, from, to, glow, children }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} color={glow} style={{ filter: `drop-shadow(0 0 4px ${glow})` }} className="shrink-0" />
      <div className="relative h-4 flex-1 overflow-hidden rounded-sm border border-zinc-800 bg-zinc-900">
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
      </div>
      {children}
    </div>
  );
}

function minsLeft(until) {
  return Math.max(0, Math.ceil((until - Date.now()) / 60000));
}

export default function Hud({ player, onOpenEnergy, onOpenTitles, onSignOut }) {
  const { level, xp, need } = levelFromXp(player.xp);
  const hp = maxHp(player);
  const title = TITLES[player.activeTitle] ?? TITLES.wanderer;
  const metabolism = isMetabolism(player);
  const sated = !metabolism && isSated(player);
  const focused = isFocused(player);
  const clogged = isClogged(player);

  return (
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
            </button>
            {metabolism && (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-orange-500/50 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-400"
                title="Оптимизация метаболизма +15% урон и XP"
              >
                <Utensils size={10} />
                {minsLeft(player.buffs.metabolismUntil || player.buffs.anabolicUntil)}м
              </span>
            )}
            {sated && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400" title={`Сытость · ${satietyHours(player)}ч`}>
                <Utensils size={10} />
                {minsLeft(player.buffs.satietyUntil)}м
              </span>
            )}
            {focused && (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/50 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400" title="Эликсир Фокуса +10% XP">
                <Brain size={10} />
                {minsLeft(player.buffs.focusUntil)}м
              </span>
            )}
            {clogged && (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-red-500/50 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400"
                title="Зашлакованность ядра −10% статов"
              >
                <Skull size={10} />
                {minsLeft(player.buffs.clogUntil || player.buffs.foodComaUntil)}м
              </span>
            )}
          </div>
          <h1 className="truncate font-display text-xl leading-tight text-zinc-50">{player.name}</h1>
          <div className="text-xs text-zinc-400">
            Уровень <span className="glow-text font-display text-sm text-neon">{level}</span>
            {(player.inscriptionXp ?? 0) > 0 && (
              <span className="ml-2 text-violet-400/80">· Начертание {player.inscriptionXp}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div
            className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold tabular-nums"
            style={{ borderColor: `${PALIUM_COLOR}55`, color: PALIUM_COLOR, background: `${PALIUM_COLOR}14`, boxShadow: `0 0 12px ${PALIUM_COLOR}33` }}
            title="Палиум"
          >
            <Gem size={13} style={{ filter: `drop-shadow(0 0 4px ${PALIUM_COLOR})` }} />
            {formatPalium(player.palium)}
          </div>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-[10px] font-bold text-zinc-400 transition hover:border-red-500/50 hover:text-red-300"
              title="Выйти"
            >
              <LogOut size={11} /> Выйти
            </button>
          )}
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5">
        <Bar icon={Heart} label="HP" value={hp} max={hp} from="#7f1d1d" to="#ef4444" glow="#ef4444" />
        <Bar icon={Zap} label="AP" value={player.ap} max={player.maxAp} from="#1e3a8a" to="#3b82f6" glow="#3b82f6">
          <button
            onClick={onOpenEnergy}
            className="plus-btn flex h-6 w-6 shrink-0 items-center justify-center rounded border border-blue-400 bg-blue-500/20 text-blue-200 active:scale-90"
            aria-label="Система энергии"
          >
            <Plus size={14} strokeWidth={3} />
          </button>
        </Bar>
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
  );
}
