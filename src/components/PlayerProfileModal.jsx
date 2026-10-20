import { useEffect, useMemo, useState } from 'react';
import { Footprints, X } from 'lucide-react';
import { STAT_META, TITLES, levelFromXp, titleName } from '../lib/game';
import { fetchPlayerPublicProfile } from '../lib/profileSync';
import {
  GRIP_LABELS,
  ITEM_QUALITY,
  SLOT_LABELS,
  formatGearBonusLines,
  formatWeaponDamageLine,
  getGearBonuses,
  getGearItem,
  qualityColor,
} from '../lib/equipment';
import StatRadar from './StatRadar';

function formatActivityLine(e) {
  if (e.kind === 'steps') {
    const d = Number(e.amount) || 0;
    const sign = d > 0 ? '+' : '';
    return {
      title: 'Шаги',
      detail: `${sign}${d.toLocaleString('ru-RU')}${e.total != null ? ` · сегодня ${Number(e.total).toLocaleString('ru-RU')}` : ''}`,
      color: '#22d3ee',
      points: null,
    };
  }
  const color = STAT_META[e.stat]?.color || '#a1a1aa';
  const qty = e.kind === 'quest' ? '' : ` × ${e.amount}${e.unit ? ` ${e.unit}` : ''}`;
  return {
    title: e.stat ? `${e.stat}` : '',
    detail: `${e.name || 'Активность'}${qty}`,
    color,
    points: e.points != null ? `+${e.points}` : null,
  };
}

function DollSlot({ label, item, locked, selected, onClick }) {
  const color = item ? qualityColor(item) : '#3f3f46';
  return (
    <button
      type="button"
      disabled={!item}
      onClick={onClick}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border"
      style={{
        borderColor: selected ? '#fafafa' : item ? color : '#3f3f46',
        borderStyle: item ? 'solid' : 'dashed',
        background: item ? `${color}14` : 'rgb(9 9 11 / 0.8)',
        boxShadow: item ? `0 0 10px ${color}33` : 'none',
        opacity: locked ? 0.4 : 1,
      }}
      title={item?.name ?? label}
    >
      {item ? (
        <span className="text-lg leading-none">{item.emoji}</span>
      ) : (
        <span className="px-0.5 text-center text-[8px] font-bold leading-tight text-zinc-600">{locked ? '⚔️' : label}</span>
      )}
    </button>
  );
}

function PublicLoadout({ loadout }) {
  const [slot, setSlot] = useState(null);
  const itemOf = (id) => getGearItem(loadout.equipment?.[id], loadout);
  const main = itemOf('mainHand');
  const off = itemOf('offHand');
  const twoHandLocked = main?.grip === 'twoHand';
  const gear = getGearBonuses(loadout);
  const selected = slot ? itemOf(slot) : null;
  const { level } = levelFromXp(loadout.xp ?? 0);
  const wornCount = Object.values(loadout.equipment ?? {}).filter(Boolean).length;

  const pick = (id) => {
    if (!itemOf(id)) return;
    setSlot((cur) => (cur === id ? null : id));
  };

  return (
    <div className="mb-4">
      <div className="mb-2 font-display text-[10px] tracking-widest text-zinc-500">ЭКИПИРОВКА</div>
      {wornCount === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 py-3 text-center text-[11px] text-zinc-600">Ничего не надето</div>
      ) : (
        <>
          <div className="flex items-stretch justify-center gap-1.5">
            <div className="flex flex-col gap-1">
              {['head', 'neck', 'shoulders', 'chest', 'wrists', 'hands', 'waist'].map((id) => (
                <DollSlot key={id} label={SLOT_LABELS[id]} item={itemOf(id)} selected={slot === id} onClick={() => pick(id)} />
              ))}
            </div>
            <div className="flex min-w-[92px] flex-col items-center justify-between py-1">
              <div className="flex w-full flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 px-2 py-3">
                <div className="flex h-14 w-10 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-950/60 text-xl text-zinc-500">
                  {loadout.gender === 'female' ? '♀' : '♂'}
                </div>
                <div className="text-[9px] tabular-nums text-zinc-600">Ур. {level}</div>
              </div>
              <div className="mt-1.5 flex gap-1">
                <DollSlot label="Оружие" item={main} selected={slot === 'mainHand'} onClick={() => pick('mainHand')} />
                <DollSlot
                  label="Левая"
                  item={twoHandLocked ? null : off}
                  locked={twoHandLocked}
                  selected={slot === 'offHand'}
                  onClick={() => pick('offHand')}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {['finger1', 'finger2', 'trinket1', 'trinket2', 'legs', 'feet'].map((id) => (
                <DollSlot key={id} label={SLOT_LABELS[id]} item={itemOf(id)} selected={slot === id} onClick={() => pick(id)} />
              ))}
            </div>
          </div>
          <div className="mt-2 text-center text-[10px] text-zinc-500">
            Броня {gear.armor} · HP+{gear.hp} · Крит {Math.round(gear.critChance * 100)}% · Уклон {Math.round(gear.dodgeChance * 100)}%
          </div>
          {selected && (
            <div className="mt-2 rounded-xl border px-3 py-2" style={{ borderColor: `${qualityColor(selected)}66` }}>
              <div className="font-bold" style={{ color: qualityColor(selected) }}>
                {selected.emoji} {selected.name}
              </div>
              <div className="mt-0.5 text-[10px] text-zinc-500">
                {[ITEM_QUALITY[selected.quality]?.label, selected.itemLevel ? `ур. ${selected.itemLevel}` : '', selected.grip ? GRIP_LABELS[selected.grip] : SLOT_LABELS[slot]]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
              {formatWeaponDamageLine(selected) && <div className="mt-1 text-[11px] text-zinc-200">{formatWeaponDamageLine(selected)}</div>}
              {formatGearBonusLines(selected).map((line) => (
                <div key={line} className="text-[11px] text-zinc-200">
                  {line}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function PlayerProfileModal({ userId, fallbackName, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchPlayerPublicProfile(userId);
        if (cancelled) return;
        if (res.error) setError(res.error);
        setProfile(res);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Не удалось загрузить профиль');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const activity = useMemo(
    () => [...(profile?.activity || [])].sort((a, b) => (b.ts || 0) - (a.ts || 0)),
    [profile],
  );

  const byDay = useMemo(() => {
    const map = new Map();
    for (const e of activity) {
      const key = e.date || '—';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    return [...map.entries()];
  }, [activity]);

  const username = profile?.username || fallbackName || 'Игрок';
  const titleId = profile?.activeTitle && TITLES[profile.activeTitle] ? profile.activeTitle : null;
  const title = titleId
    ? { label: titleName(titleId, profile?.gender === 'female' ? 'female' : 'male'), color: TITLES[titleId].color }
    : null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="system-panel modal-in flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800 px-4 py-3">
          <div className="min-w-0">
            <div className="font-display text-sm tracking-widest text-neon/90">ПРОФИЛЬ</div>
            <div className="mt-0.5 truncate text-sm text-zinc-100">{username}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-zinc-500">
              <span>Ур. {profile?.level ?? '—'}</span>
              {title && (
                <span className="font-bold" style={{ color: title.color }}>
                  «{title.label}»
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400"
            aria-label="Закрыть"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading && <div className="py-8 text-center text-xs text-zinc-600">Загрузка…</div>}
          {!loading && error && (
            <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
              {error}
            </div>
          )}

          {!loading && profile?.stats && (
            <div className="mb-4">
              <div className="mb-1 font-display text-[10px] tracking-widest text-zinc-500">ХАРАКТЕРИСТИКИ</div>
              <StatRadar stats={profile.stats} />
            </div>
          )}

          {!loading && profile?.loadout && <PublicLoadout loadout={profile.loadout} />}
          {!loading && profile && !profile.loadout && !error && (
            <div className="mb-4 rounded-lg border border-dashed border-zinc-800 py-3 text-center text-[11px] text-zinc-600">
              Экипировка появится после следующего входа этого игрока.
            </div>
          )}

          {!loading && (
            <>
              <div className="mb-2 font-display text-[10px] tracking-widest text-zinc-500">АКТИВНОСТЬ · 7 ДНЕЙ</div>
              {profile?.hideActivity ? (
                <div className="py-6 text-center text-xs text-zinc-600">Игрок скрыл активность.</div>
              ) : activity.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-600">За неделю записей нет.</div>
              ) : (
                byDay.map(([day, items]) => (
                  <div key={day} className="mb-3">
                    <div className="mb-1 font-display text-[10px] tracking-widest text-zinc-500">{day}</div>
                    <ul className="space-y-1.5">
                      {items.map((e, idx) => {
                        const line = formatActivityLine(e);
                        return (
                          <li
                            key={`${e.ts}-${idx}`}
                            className="flex items-start justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-2 text-[11px]"
                          >
                            <div className="min-w-0">
                              <div className="text-zinc-200">
                                {line.title && (
                                  <b className="mr-1" style={{ color: line.color }}>
                                    {line.title}
                                  </b>
                                )}
                                {e.kind === 'steps' && <Footprints size={11} className="mr-1 inline text-cyan-400" />}
                                {line.detail}
                              </div>
                              <div className="mt-0.5 tabular-nums text-[10px] text-zinc-600">
                                {e.ts
                                  ? new Date(e.ts).toLocaleString('ru-RU', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : ''}
                              </div>
                            </div>
                            {line.points != null && (
                              <span className="shrink-0 tabular-nums text-zinc-500">{line.points}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
