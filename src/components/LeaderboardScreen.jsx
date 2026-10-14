import { useEffect, useState } from 'react';
import { Medal, RefreshCw, Trophy } from 'lucide-react';
import { fetchLeaderboard } from '../lib/profileSync';
import { useAuth } from '../context/AuthContext';

function powerScore(row) {
  return (row.strength ?? 0) + (row.endurance ?? 0) + (row.agility ?? 0) + (row.intelligence ?? 0) + (row.willpower ?? 0);
}

function rankColor(i) {
  if (i === 0) return '#eab308';
  if (i === 1) return '#94a3b8';
  if (i === 2) return '#b45309';
  return '#22d3ee';
}

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchLeaderboard(50);
      setRows(data);
    } catch (e) {
      setError(e?.message || 'Не удалось загрузить рейтинг');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <section className="system-panel space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-amber-400" />
            <h2 className="font-display text-sm tracking-widest text-amber-300/90">РЕЙТИНГ СИСТЕМЫ</h2>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-[10px] font-bold text-zinc-400 hover:text-neon"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Обновить
          </button>
        </div>
        <p className="text-[11px] text-zinc-500">Сортировка по уровню. Подсвечен ваш профиль.</p>

        {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-center text-[11px] text-red-300">{error}</div>}

        {loading && !rows.length ? (
          <div className="py-10 text-center text-xs text-zinc-600">Загрузка таблицы лидеров…</div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-xs text-zinc-600">Пока нет игроков в рейтинге</div>
        ) : (
          <div className="space-y-2">
            {rows.map((row, i) => {
              const mine = user?.id === row.id;
              const color = rankColor(i);
              return (
                <div
                  key={row.id}
                  className="rounded-xl border px-3 py-2.5"
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
                      <div className="truncate font-display text-sm text-zinc-100">
                        {row.username}
                        {mine && <span className="ml-1.5 text-[10px] font-bold text-neon">ВЫ</span>}
                      </div>
                      <div className="mt-0.5 text-[10px] text-zinc-500">
                        STR {row.strength} · END {row.endurance} · AGI {row.agility} · INT {row.intelligence} · WIL {row.willpower}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-display text-sm text-neon">Lv {row.level}</div>
                      <div className="text-[9px] text-zinc-500">Σ {powerScore(row)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
