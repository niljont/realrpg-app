import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, CalendarDays, ChefHat, Dumbbell, Flame, Gem, Hammer, Map as MapIcon, Sparkles, Trophy, Zap } from 'lucide-react';
import { PALIUM_COLOR, STATS, STAT_META, dayKey, formatPalium, levelFromXp, unlockedTitleCount } from '../lib/game';

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function buildSeries(log, days) {
  const byDay = new Map();
  for (const e of log ?? []) {
    if (!e?.date || !e?.stat) continue;
    const row = byDay.get(e.date) ?? {};
    row[e.stat] = (row[e.stat] ?? 0) + (e.points ?? 0);
    byDay.set(e.date, row);
  }
  const out = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const row = byDay.get(dayKey(d)) ?? {};
    out.push({
      label: days <= 7 ? WEEKDAYS[d.getDay()] : String(d.getDate()),
      full: d.toLocaleDateString('ru', { day: 'numeric', month: 'short' }),
      ...Object.fromEntries(STATS.map((s) => [s, row[s] ?? 0])),
    });
  }
  return out;
}

function streaks(log) {
  const days = [...new Set((log ?? []).map((e) => e.date).filter(Boolean))].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const k of days) {
    const d = new Date(`${k}T00:00:00`);
    run = prev && (d - prev) / 86400000 === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  const today = dayKey();
  const yesterday = dayKey(Date.now() - 86400000);
  const last = days.at(-1);
  const current = last === today || last === yesterday ? run : 0;
  return { activeDays: days.length, best, current };
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((a, p) => a + (p.value ?? 0), 0);
  return (
    <div className="rounded-lg border border-neon/40 bg-zinc-950/95 px-3 py-2 text-xs shadow-[0_0_16px_rgb(34_211_238/0.25)]">
      <div className="mb-1 font-display text-zinc-200">{payload[0]?.payload?.full}</div>
      {[...payload].reverse().map((p) =>
        p.value > 0 ? (
          <div key={p.dataKey} className="flex justify-between gap-4">
            <span style={{ color: p.color }}>{p.dataKey}</span>
            <span className="tabular-nums text-zinc-200">{p.value}</span>
          </div>
        ) : null,
      )}
      <div className="mt-1 flex justify-between gap-4 border-t border-zinc-800 pt-1 font-bold">
        <span className="text-zinc-400">Σ</span>
        <span className="tabular-nums text-neon">{total}</span>
      </div>
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/70 p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-md px-3 py-1 text-xs font-bold transition ${value === o.id ? 'bg-neon/15 text-neon shadow-[inset_0_0_0_1px_rgb(34_211_238/0.5)]' : 'text-zinc-500'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = '#22d3ee', sub }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
        <Icon size={12} color={color} />
        {label}
      </div>
      <div className="font-display text-xl tabular-nums" style={{ color, textShadow: `0 0 10px ${color}66` }}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-zinc-500">{sub}</div>}
    </div>
  );
}

export default function AnalyticsScreen({ player }) {
  const [period, setPeriod] = useState('week');
  const [kind, setKind] = useState('bar');
  const days = period === 'week' ? 7 : 30;
  const log = player?.log ?? [];
  const energy = player?.energy ?? { apRestored: 0, strPoints: 0, endPoints: 0, maxApGained: 0 };

  const data = useMemo(() => buildSeries(log, days), [log, days]);
  const periodTotal = data.reduce((a, r) => a + STATS.reduce((b, s) => b + r[s], 0), 0);

  const life = useMemo(() => {
    const perStat = Object.fromEntries(STATS.map((s) => [s, 0]));
    for (const e of log) {
      if (e?.stat && perStat[e.stat] != null) perStat[e.stat] += e.points ?? 0;
    }
    return { perStat, total: player?.xp ?? 0, sessions: log.length, ...streaks(log) };
  }, [log, player?.xp]);

  const axis = { stroke: '#52525b', fontSize: 10, tickLine: false, axisLine: false };
  const Chart = kind === 'bar' ? BarChart : AreaChart;

  return (
    <div className="space-y-4">
      <section className="system-panel p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-sm tracking-widest text-neon/90">АКТИВНОСТЬ</h2>
          <div className="flex gap-2">
            <Segmented value={kind} onChange={setKind} options={[{ id: 'bar', label: 'Bar' }, { id: 'area', label: 'Area' }]} />
            <Segmented value={period} onChange={setPeriod} options={[{ id: 'week', label: 'Неделя' }, { id: 'month', label: 'Месяц' }]} />
          </div>
        </div>
        <div className="mb-2 text-xs text-zinc-400">
          За период: <b className="text-zinc-100">{periodTotal}</b> поинтов
        </div>
        <div className="h-60 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <Chart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
              <defs>
                {STATS.map((s) => (
                  <linearGradient key={s} id={`g-${s}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={STAT_META[s].color} stopOpacity={0.85} />
                    <stop offset="100%" stopColor={STAT_META[s].color} stopOpacity={0.2} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 4" vertical={false} />
              <XAxis dataKey="label" {...axis} interval={period === 'week' ? 0 : 3} />
              <YAxis {...axis} width={36} allowDecimals={false} domain={[0, 'auto']} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(34 211 238 / 0.06)', stroke: '#22d3ee33' }} />
              {STATS.map((s, i) =>
                kind === 'bar' ? (
                  <Bar key={s} dataKey={s} stackId="a" fill={STAT_META[s].color} radius={i === STATS.length - 1 ? [3, 3, 0, 0] : 0} maxBarSize={28} isAnimationActive={false} />
                ) : (
                  <Area key={s} dataKey={s} stackId="a" type="monotone" stroke={STAT_META[s].color} strokeWidth={1.5} fill={`url(#g-${s})`} isAnimationActive={false} />
                ),
              )}
            </Chart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px]">
          {STATS.map((s) => (
            <span key={s} className="flex items-center gap-1 text-zinc-400">
              <span className="h-2 w-2 rounded-sm" style={{ background: STAT_META[s].color }} />
              {s}
            </span>
          ))}
        </div>
      </section>

      <section className="system-panel p-4">
        <h2 className="mb-3 font-display text-sm tracking-widest text-neon/90">LIFETIME STATS</h2>
        <div className="grid grid-cols-2 gap-2">
          <StatCard icon={Sparkles} label="Всего поинтов" value={life.total} sub={`Уровень ${levelFromXp(player?.xp ?? 0).level}`} />
          <StatCard icon={Gem} label="Палиум" value={formatPalium(player?.palium)} color={PALIUM_COLOR} />
          <StatCard icon={Dumbbell} label="Тренировок" value={life.sessions} color="#a855f7" />
          <StatCard icon={CalendarDays} label="Активных дней" value={life.activeDays} color="#e4e4e7" />
          <StatCard icon={Flame} label="Серия" value={`${life.current} дн.`} color="#f97316" sub={`Рекорд: ${life.best} дн.`} />
          <StatCard icon={Zap} label="AP восстановлено" value={energy.apRestored} color="#3b82f6" sub={`${energy.strPoints} поинтов Силы`} />
          <StatCard icon={Hammer} label="Создано" value={player?.world?.crafted ?? 0} color="#22c55e" sub="В профессиях" />
          <StatCard icon={MapIcon} label="Ресурсов собрано" value={player?.world?.gathered ?? 0} color="#b45309" />
          <StatCard icon={ChefHat} label="Блюд" value={player?.world?.cooked ?? 0} color="#eab308" />
          <StatCard icon={Trophy} label="Бреши" value={player?.world?.breaches ?? 0} color="#a855f7" sub={`Побед: ${player?.world?.breachWins ?? 0}`} />
        </div>
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          {STATS.map((s) => (
            <div key={s} className="rounded-lg border border-zinc-800 bg-zinc-900/60 py-2 text-center">
              <div className="font-display text-[11px]" style={{ color: STAT_META[s].color }}>
                {s}
              </div>
              <div className="text-xs font-bold tabular-nums text-zinc-100">{life.perStat[s]}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-zinc-600">
          <Trophy size={11} /> Игрок с {new Date(player?.createdAt ?? Date.now()).toLocaleDateString('ru')}
          <Activity size={11} className="ml-2" /> {unlockedTitleCount(player)} титул(ов)
        </div>
      </section>
    </div>
  );
}
