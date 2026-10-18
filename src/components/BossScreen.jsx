import { Skull } from 'lucide-react';
import { bossReasonLabel, isBossSpectator } from '../lib/daily';

function formatWhen(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
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
