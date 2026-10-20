import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Medal, RefreshCw, Trophy } from 'lucide-react';
import { fetchLeaderboard, powerScore, sortLeaderboard } from '../lib/profileSync';
import { STAT_META, TITLES, formatPalium, stampPlayer, titleName } from '../lib/game';
import { useAuth } from '../context/AuthContext';
import PlayerProfileModal from './PlayerProfileModal';

function rowTitle(row) {
  const id = row.active_title && TITLES[row.active_title] ? row.active_title : null;
  if (!id) return null;
  const gender = row.gender === 'female' ? 'female' : 'male';
  return {
    label: titleName(id, gender),
    color: TITLES[id].color,
  };
}

function rankColor(i) {
  if (i === 0) return '#eab308';
  if (i === 1) return '#94a3b8';
  if (i === 2) return '#b45309';
  return '#22d3ee';
}

const TABS = [
  { id: 'overall', label: 'Общий' },
  { id: 'level', label: 'Уровень' },
  { id: 'STR', label: 'STR' },
  { id: 'END', label: 'END' },
  { id: 'AGI', label: 'AGI' },
  { id: 'INT', label: 'INT' },
  { id: 'WIL', label: 'WIL' },
  { id: 'breaches', label: 'Бреши' },
  { id: 'rich', label: 'Богачи' },
];

function scoreLabel(mode, row) {
  switch (mode) {
    case 'STR':
      return `STR ${row.strength ?? 0}`;
    case 'END':
      return `END ${row.endurance ?? 0}`;
    case 'AGI':
      return `AGI ${row.agility ?? 0}`;
    case 'INT':
      return `INT ${row.intelligence ?? 0}`;
    case 'WIL':
      return `WIL ${row.willpower ?? 0}`;
    case 'level':
      return `Lv ${row.level ?? 1}`;
    case 'breaches':
      return `${row.breach_wins ?? 0} побед`;
    case 'rich':
      return `${formatPalium((row.gold ?? 0) / 1000)} P`;
    case 'overall':
    default:
      return `Σ ${powerScore(row)} · Lv ${row.level ?? 1}`;
  }
}

const ONLINE_MS = 90_000;

function lastSeenLabel(ts, now) {
  const t = Date.parse(ts || '');
  if (!Number.isFinite(t)) return 'был в сети давно';
  const min = Math.floor(Math.max(0, now - t) / 60000);
  if (min < 60) return `был в сети ${Math.max(1, min)} мин назад`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `был в сети ${hours} ч назад`;
  return `был в сети ${Math.floor(hours / 24)} дн. назад`;
}

function isOnline(ts, now, mine) {
  if (mine) return true;
  const t = Date.parse(ts || '');
  return Number.isFinite(t) && now - t < ONLINE_MS;
}

function formatUpdatedAt(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '';
  }
}

export default function LeaderboardScreen({ player }) {
  const { user, syncPlayerToCloud } = useAuth();
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState('overall');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [fetchedAt, setFetchedAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [viewPlayer, setViewPlayer] = useState(null);
  const reqId = useRef(0);
  const playerRef = useRef(player);
  playerRef.current = player;

  const load = useCallback(
    async ({ pushFirst = true } = {}) => {
      const id = ++reqId.current;
      setLoading(true);
      setError('');
      setHint('');
      try {
        const p = playerRef.current;
        if (pushFirst && p && user?.id) {
          const sync = await syncPlayerToCloud(stampPlayer(p));
          if (!sync?.ok && sync?.error) {
            setHint(`Синк: ${sync.error}`);
          }
        }

        const data = await fetchLeaderboard(100);
        if (id !== reqId.current) return;
        setRows(data);
        setFetchedAt(Date.now());

        if (data.length <= 1) {
          setHint(
            (h) =>
              h ||
              'Виден только 1 игрок — в Supabase нужна политика SELECT на profiles для authenticated (см. supabase/leaderboard_rls.sql).',
          );
        }
      } catch (e) {
        if (id !== reqId.current) return;
        setError(e?.message || 'Не удалось загрузить рейтинг');
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [user?.id, syncPlayerToCloud],
  );

  useEffect(() => {
    load({ pushFirst: true });
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      load({ pushFirst: false });
    }, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const sorted = useMemo(() => sortLeaderboard(rows, tab).slice(0, 50), [rows, tab]);
  const accent = STAT_META[tab]?.color || (tab === 'rich' ? '#38bdf8' : tab === 'breaches' ? '#a855f7' : '#eab308');

  return (
    <div className="space-y-4">
      <section className="system-panel space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="shrink-0 text-amber-400" />
              <h2 className="font-display text-sm tracking-widest text-amber-300/90">РЕЙТИНГ СИСТЕМЫ</h2>
            </div>
            {fetchedAt && (
              <p className="mt-1 text-[10px] text-zinc-600">Обновлено в {formatUpdatedAt(fetchedAt)} · игроков: {rows.length}</p>
            )}
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => load({ pushFirst: true })}
            className="inline-flex min-h-11 min-w-[5.5rem] touch-manipulation items-center justify-center gap-1.5 rounded-xl border border-zinc-600 bg-zinc-900/80 px-3 py-2 text-[11px] font-bold text-zinc-200 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Ждите…' : 'Обновить'}
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
          {TABS.map((t) => {
            const active = tab === t.id;
            const c = STAT_META[t.id]?.color || '#22d3ee';
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="min-h-10 shrink-0 touch-manipulation rounded-lg border px-3 py-2 text-[10px] font-bold transition active:scale-95"
                style={{
                  borderColor: active ? c : '#27272a',
                  color: active ? c : '#71717a',
                  background: active ? `${c}18` : 'transparent',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-zinc-500">
          Нажми на игрока — экипировка, радар статов и активность за 7 дней.
          {tab === 'overall' && ' Сумма характеристик после синка.'}
          {tab === 'level' && ' Максимальный уровень.'}
          {['STR', 'END', 'AGI', 'INT', 'WIL'].includes(tab) && ` Топ по ${STAT_META[tab].label}.`}
          {tab === 'breaches' && ' Топ по закрытым Брешам.'}
          {tab === 'rich' && ' Топ по Палиуму.'}
        </p>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-center text-[11px] text-red-300">
            {error}
          </div>
        )}
        {hint && !error && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-[11px] text-amber-200/90">
            {hint}
          </div>
        )}

        {loading && !rows.length ? (
          <div className="py-10 text-center text-xs text-zinc-600">Загрузка таблицы лидеров…</div>
        ) : sorted.length === 0 ? (
          <div className="py-10 text-center text-xs text-zinc-600">Пока нет игроков в рейтинге</div>
        ) : (
          <div className="space-y-2">
            {sorted.map((row, i) => {
              const mine = user?.id === row.id;
              const hidden = Boolean(row.hide_activity) && !mine;
              const online = !hidden && isOnline(row.updated_at, now, mine);
              const color = rankColor(i);
              const title = rowTitle(row);
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setViewPlayer({ id: row.id, name: row.username })}
                  className="w-full rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.99]"
                  style={{
                    borderColor: mine ? '#22d3ee88' : '#27272a',
                    background: mine ? 'rgb(34 211 238 / 0.08)' : 'rgb(24 24 27 / 0.7)',
                    boxShadow: mine ? '0 0 14px rgb(34 211 238 / 0.2)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex w-8 shrink-0 items-center justify-center font-display text-sm" style={{ color }}>
                      {i < 3 ? <Medal size={16} /> : `#${i + 1}`}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        {online && (
                          <span
                            className="inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"
                            title="В сети"
                          />
                        )}
                        <span className="truncate font-display text-sm text-zinc-100">{row.username}</span>
                        {title && (
                          <span className="truncate text-[10px] font-bold tracking-wide" style={{ color: title.color }}>
                            «{title.label}»
                          </span>
                        )}
                        {mine && <span className="text-[10px] font-bold text-neon">ВЫ</span>}
                      </div>
                      <div className="mt-0.5 text-[10px] text-zinc-500">
                        STR {row.strength} · END {row.endurance} · AGI {row.agility} · INT {row.intelligence} · WIL{' '}
                        {row.willpower}
                      </div>
                      {!online && !hidden && (
                        <div className="mt-0.5 text-[10px] text-zinc-500">{lastSeenLabel(row.updated_at, now)}</div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-display text-sm" style={{ color: accent }}>
                        {scoreLabel(tab, row)}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {viewPlayer && (
        <PlayerProfileModal
          userId={viewPlayer.id}
          fallbackName={viewPlayer.name}
          onClose={() => setViewPlayer(null)}
        />
      )}
    </div>
  );
}
