/** Личная цель на неделю и соперник «вчера». Общего счётчика на всех нет. */

export const SELF_RIVAL_BONUS = 0.15;

export const WEEK_GOALS = [
  { id: 'pullups', name: 'Подтягивания', unit: 'повт.', exIds: ['pullups'], tiers: [15, 30, 50] },
  { id: 'routes', name: 'Скалодром', unit: 'трасса', exIds: ['boulder', 'climbroute'], tiers: [8, 15, 25] },
  { id: 'run', name: 'Бег', unit: 'км', exIds: ['run'], tiers: [5, 10, 20] },
];

function weekMonday(today) {
  const [y, m, d] = String(today).split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

function daysBetween(from, to) {
  if (!from || !to) return 999;
  const [ay, am, ad] = from.split('-').map(Number);
  const [by, bm, bd] = to.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

function emptyWeekGoal(week) {
  return { week, id: '', target: 0, progress: 0, claimed: false };
}

export function weekGoalOption(id) {
  return WEEK_GOALS.find((goal) => goal.id === id) ?? null;
}

/** Награда сундука по выбранной планке. */
export function weekChestReward(target, tiers) {
  const index = (tiers ?? []).indexOf(Number(target));
  if (index >= 2) return { palium: 0.24, uncommonChance: 0.6, rareChance: 0.18 };
  if (index === 1) return { palium: 0.16, uncommonChance: 0.5, rareChance: 0.08 };
  return { palium: 0.1, uncommonChance: 0.35, rareChance: 0 };
}

/**
 * Новый день и новая неделя. Сундук закрытой цели ждёт, пока его заберут.
 * @param {object} p
 * @param {string} today
 */
export function rollEngagement(p, today) {
  let weekGoal = p.weekGoal?.week ? { ...p.weekGoal } : null;
  let weekChest = p.weekChest?.id ? { ...p.weekChest } : null;
  let dayScore = p.dayScore?.date ? { ...p.dayScore, counts: { ...(p.dayScore.counts ?? {}) }, names: { ...(p.dayScore.names ?? {}) } } : null;
  let changed = false;

  const week = weekMonday(today);
  if (!weekGoal || weekGoal.week !== week) {
    if (weekGoal?.id && !weekGoal.claimed && (weekGoal.progress || 0) >= weekGoal.target && !weekChest) {
      const option = weekGoalOption(weekGoal.id);
      weekChest = {
        id: weekGoal.id,
        name: option?.name ?? weekGoal.id,
        unit: option?.unit ?? '',
        target: weekGoal.target,
        progress: weekGoal.progress,
      };
    }
    weekGoal = emptyWeekGoal(week);
    changed = true;
  }

  if (!dayScore || dayScore.date !== today) {
    let rival = null;
    if (dayScore && daysBetween(dayScore.date, today) === 1) {
      const best = Object.entries(dayScore.counts ?? {}).sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0))[0];
      if (best && Number(best[1]) > 0) {
        const meta = dayScore.names?.[best[0]] ?? {};
        rival = { exId: best[0], name: meta.name || best[0], unit: meta.unit || '', amount: Number(best[1]) || 0 };
      }
    }
    dayScore = { date: today, counts: {}, names: {}, rival, beaten: false };
    changed = true;
  }

  if (!changed) return { player: p, changed: false };
  return { player: { ...p, weekGoal, weekChest, dayScore }, changed: true };
}

/**
 * Записать подход в цель недели и в счётчик «вчера».
 * @param {object} p
 * @param {{ exId: string, name: string, unit: string, amount: number, today: string }} row
 */
export function noteEffort(p, row) {
  const qty = Number(row?.amount) || 0;
  if (!row?.exId || qty <= 0) return { player: p, events: [] };
  const rolled = rollEngagement(p, row.today);
  const next = rolled.player;
  const counts = { ...(next.dayScore.counts ?? {}) };
  counts[row.exId] = Math.round(((Number(counts[row.exId]) || 0) + qty) * 1000) / 1000;
  const names = { ...(next.dayScore.names ?? {}), [row.exId]: { name: row.name, unit: row.unit } };
  let beaten = Boolean(next.dayScore.beaten);
  const events = [];
  const rival = next.dayScore.rival;
  if (rival && rival.exId === row.exId && !beaten && counts[row.exId] + 1e-6 >= rival.amount) {
    beaten = true;
    events.push({ type: 'title', text: 'Вчерашний результат побит. До конца дня +15% опыта' });
  }

  let weekGoal = next.weekGoal;
  const option = weekGoalOption(weekGoal?.id);
  if (option && weekGoal.week && !weekGoal.claimed && option.exIds.includes(row.exId)) {
    const progress = Math.round(((Number(weekGoal.progress) || 0) + qty) * 1000) / 1000;
    if ((weekGoal.progress || 0) < weekGoal.target && progress >= weekGoal.target) {
      events.push({ type: 'title', text: 'Цель недели закрыта. Сундук можно забрать в понедельник' });
    }
    weekGoal = { ...weekGoal, progress };
  }

  return {
    player: {
      ...next,
      dayScore: { ...next.dayScore, counts, names, beaten },
      weekGoal,
    },
    events,
  };
}

/**
 * Выбор цели на текущую неделю. Одна цель, сменить нельзя.
 * @param {object} p
 * @param {string} id
 * @param {number} target
 * @param {string} today
 */
export function pickWeekGoal(p, id, target, today) {
  const option = weekGoalOption(id);
  if (!option) return { error: 'Такой цели нет' };
  const goalTarget = Number(target);
  if (!option.tiers.includes(goalTarget)) return { error: 'Выберите планку' };
  const rolled = rollEngagement(p, today).player;
  if (rolled.weekGoal?.id) return { error: 'Цель на эту неделю уже выбрана' };
  return {
    player: {
      ...rolled,
      weekGoal: { week: rolled.weekGoal.week, id: option.id, target: goalTarget, progress: 0, claimed: false },
    },
    events: [{ type: 'title', text: `Цель недели: ${option.name} ${goalTarget} ${option.unit}` }],
  };
}
