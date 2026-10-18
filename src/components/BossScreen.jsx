import { Skull } from 'lucide-react';
import { bossReasonLabel, isBossSpectator } from '../lib/daily';
import { formatPalium, STAT_META } from '../lib/game';
import {
  GRIP_LABELS,
  ITEM_QUALITY,
  SLOT_LABELS,
  formatGearBonusLines,
  formatWeaponDamageLine,
  qualityColor,
} from '../lib/equipment';

function formatWhen(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function BossRewardCard({ reward, onClose }) {
  const item = reward?.item;
  const color = item ? qualityColor(item) : '#ef4444';
  const quality = item ? ITEM_QUALITY[item.quality]?.label : '';
  const dmgLine = item ? formatWeaponDamageLine(item) : null;
  const bonusLines = item ? formatGearBonusLines(item) : [];
  const slotLabel = item?.grip
    ? GRIP_LABELS[item.grip]
    : item?.slot
      ? (SLOT_LABELS[item.slot] ?? SLOT_LABELS[`${item.slot}1`] ?? '')
      : '';

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="system-panel modal-in w-full max-w-sm p-5"
        style={{ borderColor: `${color}88` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 text-center font-display text-[11px] tracking-[0.28em] text-zinc-500">ДОБЫЧА БОССА</div>
        <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-center text-sm font-bold text-amber-200">
          +{formatPalium(reward?.palium ?? 0)} Палиум
        </div>
        {item ? (
          <div className="mt-3">
            <div className="flex items-start gap-3">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-3xl"
                style={{ background: `${color}22`, boxShadow: `0 0 16px ${color}44` }}
              >
                {item.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg leading-tight" style={{ color }}>
                  {item.name}
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">
                  {[quality, item.itemLevel ? `ур. ${item.itemLevel}` : '', slotLabel].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>
            {item.desc && <p className="mt-3 text-sm leading-relaxed text-zinc-300">{item.desc}</p>}
            {dmgLine && <p className="mt-2 text-[12px] text-zinc-100">{dmgLine}</p>}
            {bonusLines.map((line) => (
              <p key={line} className="text-[12px] text-zinc-100">
                {line}
              </p>
            ))}
            {item.reqLevel || item.req ? (
              <div className="mt-2 space-y-0.5">
                {item.reqLevel ? <div className="text-[11px] font-bold text-zinc-300">Требуется уровень {item.reqLevel}</div> : null}
                {Object.entries(item.req ?? {}).map(([stat, need]) => (
                  <div key={stat} className="text-[11px] font-bold text-zinc-300">
                    Требуется {STAT_META[stat]?.label ?? stat} {need}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-center text-[12px] text-zinc-400">
            {reward?.full ? 'В сумке нет места, вещь не выдана.' : 'Вещь в этот раз не выпала.'}
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl py-3 text-sm font-bold text-white"
          style={{ background: color }}
        >
          Забрать
        </button>
      </div>
    </div>
  );
}

export default function BossScreen({ player, boss, onClaimBoss }) {
  const today = player.daily?.date ?? '';
  const bossHp = boss ? Math.max(0, boss.hp ?? 0) : null;
  const bossMax = boss?.maxHp || 1;
  const bossPct = boss ? Math.round((bossHp / bossMax) * 100) : 0;
  const spectator = isBossSpectator(player?.name);
  const bossReady = boss && !spectator && bossHp === 0 && (boss.mine ?? 0) > 0 && player.bossClaimDate !== today;
  const log = boss?.log ?? [];

  return (
    <div className="space-y-4">
      <section className="system-panel space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Skull size={16} className="text-red-400" />
            <h2 className="font-display text-sm tracking-widest text-red-200">БОСС ДНЯ</h2>
          </div>
          <span className="text-[10px] text-zinc-500">{boss?.shared ? 'Общий' : boss ? 'Это устройство' : '…'}</span>
        </div>
        {boss ? (
          <>
            <div className="font-display text-base text-zinc-100">{boss.name}</div>
            <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full bg-red-500" style={{ width: `${bossPct}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>
                HP {bossHp.toLocaleString('ru-RU')} / {bossMax.toLocaleString('ru-RU')}
              </span>
              <span>
                Бойцов {boss.fighters ?? (boss.mine > 0 ? 1 : 0)}
                {spectator ? '' : ` · твой вклад ${Math.round(boss.mine || 0)}`}
              </span>
            </div>
            <p className="text-[10px] leading-relaxed text-zinc-500">
              Запас растёт только от тех, кто сегодня ударил: 450 HP на бойца. Награда одинаковая и только участникам — 0.100 Палиум и вещь вашего уровня, чаще зелёная.
            </p>
            {spectator && (
              <p className="text-[10px] leading-relaxed text-zinc-400">
                Этот аккаунт не участвует в бою: удары не снимают здоровье и не считаются в числе бойцов.
              </p>
            )}
            {!boss.shared && (
              <p className="text-[10px] leading-relaxed text-amber-200/80">
                {boss.error
                  ? `Общий бой не подключился: ${boss.error}`
                  : 'Общий бой и лог включатся после нового SQL из supabase/daily_boss.sql. Пока удары видны только на этом устройстве.'}
              </p>
            )}
            <button
              type="button"
              disabled={!bossReady}
              onClick={onClaimBoss}
              className="w-full rounded-lg bg-red-600 py-2.5 text-xs font-bold text-white disabled:opacity-35"
            >
              {spectator
                ? 'Аккаунт не участвует'
                : player.bossClaimDate === today
                  ? 'Награда получена'
                  : bossHp === 0 && (boss.mine ?? 0) <= 0
                    ? 'Ты не участвовал'
                    : bossHp === 0
                      ? 'Забрать добычу'
                      : 'Босс ещё держится'}
            </button>
          </>
        ) : (
          <p className="text-[11px] text-zinc-500">Босс просыпается…</p>
        )}
      </section>

      <section className="system-panel space-y-2 p-4">
        <h3 className="font-display text-xs tracking-widest text-zinc-400">ЖУРНАЛ УДАРОВ</h3>
        {log.length === 0 ? (
          <p className="text-[11px] text-zinc-500">Пока тихо. Тренировка, шаги, сбор, брешь и крафт бьют босса.</p>
        ) : (
          <ul className="space-y-1.5">
            {log.map((row) => (
              <li key={row.id ?? `${row.createdAt}-${row.username}-${row.damage}`} className="flex items-baseline justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 px-2.5 py-2">
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-zinc-100">{row.username || 'Игрок'}</div>
                  <div className="text-[10px] text-zinc-500">
                    {bossReasonLabel(row.reason)}
                    {row.createdAt ? ` · ${formatWhen(row.createdAt)}` : ''}
                  </div>
                </div>
                <div className="shrink-0 font-display text-sm text-red-300">−{Math.round(row.damage || 0)}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
