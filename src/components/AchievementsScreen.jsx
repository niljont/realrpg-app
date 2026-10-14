import { useState } from 'react';
import { Check, Crown, Lock, Sparkles } from 'lucide-react';
import { ACHIEVEMENT_ICONS } from './achievementIcons';
import {
  ACHIEVEMENTS,
  TITLES,
  achievementProgress,
  achievementTrackLabel,
  formatAmount,
  isTitleUnlocked,
  titleName,
} from '../lib/game';

function Segmented({ value, onChange, options }) {
  return (
    <div className="flex rounded-xl border border-zinc-800 bg-zinc-900/70 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-lg py-2 text-xs font-bold tracking-wide transition ${
            value === o.id ? 'bg-neon/15 text-neon shadow-[inset_0_0_0_1px_rgb(34_211_238/0.5)]' : 'text-zinc-500'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function TitlesTab({ player, onEquip }) {
  return (
    <div className="space-y-2">
      {Object.entries(TITLES).map(([id, t]) => {
        const owned = isTitleUnlocked(player, id);
        const active = player.activeTitle === id;
        return (
          <div
            key={id}
            className="rounded-xl border bg-zinc-900/70 p-3 transition"
            style={{
              borderColor: active ? t.color : owned ? `${t.color}55` : '#27272a',
              boxShadow: active ? `0 0 16px ${t.color}55` : 'none',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${t.color}1f`, color: owned ? t.color : '#52525b' }}
              >
                {owned ? <Crown size={18} /> : <Lock size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-display text-sm" style={{ color: owned ? t.color : '#71717a' }}>
                    {titleName(id, player.gender)}
                  </span>
                  {(t.tier ?? 0) > 0 && (
                    <span
                      className="rounded-full border px-1.5 py-0.5 text-[9px] font-bold"
                      style={{ borderColor: owned ? t.color : '#3f3f46', color: owned ? t.color : '#52525b' }}
                    >
                      Ур. {t.tier}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[11px] text-zinc-400">{t.bonus}</div>
                <div className="mt-1 text-[10px] text-zinc-600">{t.req}</div>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              {active ? (
                <span className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[11px] font-bold" style={{ borderColor: t.color, color: t.color }}>
                  <Check size={12} /> Экипирован
                </span>
              ) : (
                <button
                  disabled={!owned}
                  onClick={() => onEquip(id)}
                  className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                  style={{ background: owned ? t.color : '#3f3f46', boxShadow: owned ? `0 0 12px ${t.color}66` : 'none' }}
                >
                  Экипировать
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AchievementsTab({ player, justUnlocked }) {
  return (
    <div className="space-y-2">
      {ACHIEVEMENTS.map((a) => {
        const cur = achievementProgress(player, a);
        const done = player.achievements.includes(a.id);
        const pct = (cur / a.goal) * 100;
        const Icon = ACHIEVEMENT_ICONS[a.id] ?? Sparkles;
        const track = achievementTrackLabel(a);
        const flash = justUnlocked === a.id;
        const titleId = a.title;
        return (
          <div
            key={a.id}
            className={`rounded-xl border bg-zinc-900/70 p-3 ${flash ? 'unlock-flash' : ''}`}
            style={{
              borderColor: done ? a.color : '#27272a',
              boxShadow: done ? `0 0 12px ${a.color}33` : 'none',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${a.color}1f`, color: done ? a.color : '#52525b' }}
              >
                {done ? <Icon size={18} /> : <Lock size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="font-display text-sm text-zinc-100">{a.name}</span>
                    {(a.tier ?? 0) > 0 && a.track && (
                      <span className="rounded-full border px-1.5 py-0.5 text-[9px] font-bold" style={{ borderColor: a.color, color: a.color }}>
                        Ур. {a.tier}
                      </span>
                    )}
                  </div>
                  {done && (
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider" style={{ color: a.color }}>
                      Получено
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[11px] text-zinc-400">
                  {a.exId ? (
                    <>
                      {track}: {formatAmount(cur)} / {formatAmount(a.goal)}
                    </>
                  ) : (
                    <>
                      {a.desc}: {formatAmount(cur)} / {formatAmount(a.goal)}
                    </>
                  )}
                </div>
                {titleId && (
                  <div className="mt-1 text-[10px]" style={{ color: done ? a.color : '#52525b' }}>
                    Титул: {titleName(titleId, player.gender)}
                  </div>
                )}
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full transition-[width] duration-700"
                    style={{
                      width: `${pct}%`,
                      background: a.color,
                      boxShadow: done ? `0 0 8px ${a.color}` : 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AchievementsScreen({ player, onEquip, initialTab = 'titles', justUnlocked }) {
  const [tab, setTab] = useState(initialTab);

  return (
    <div className="space-y-4">
      <section className="system-panel space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-neon" />
          <h2 className="font-display text-sm tracking-widest text-neon/90">ДОСТИЖЕНИЯ И ТИТУЛЫ</h2>
        </div>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { id: 'titles', label: 'Титулы' },
            { id: 'achievements', label: 'Достижения' },
          ]}
        />
        {tab === 'titles' ? <TitlesTab player={player} onEquip={onEquip} /> : <AchievementsTab player={player} justUnlocked={justUnlocked} />}
      </section>
    </div>
  );
}
