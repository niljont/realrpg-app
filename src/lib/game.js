export const STORAGE_KEY = 'system.player.v1';

export const STATS = ['STR', 'END', 'AGI', 'INT', 'WIL'];

export const STAT_META = {
  STR: { label: 'Сила', color: '#ef4444' },
  END: { label: 'Выносливость', color: '#22c55e' },
  AGI: { label: 'Ловкость', color: '#eab308' },
  INT: { label: 'Интеллект', color: '#3b82f6' },
  WIL: { label: 'Воля', color: '#a855f7' },
};

// rate — сколько поинтов даёт одна единица (повтор / секунда / км / минута).
// apCost — переопределяет стоимость записи в дневном трекере.
/** Сложность для гири/гантелей: поинты за 1 повтор. */
export const LOAD_DIFFICULTIES = [
  { id: 'easy', label: 'Легко', rate: 0.5 },
  { id: 'normal', label: 'Нормально', rate: 1 },
  { id: 'hard', label: 'Сложно', rate: 1.5 },
];

export const EXERCISES = {
  STR: [
    { id: 'pushups', name: 'Отжимания', unit: 'повт.', rate: 1 },
    { id: 'pullups', name: 'Подтягивания', unit: 'повт.', rate: 3 },
    { id: 'legsquats', name: 'Приседания', unit: 'повт.', rate: 1 },
    { id: 'kettlebell', name: 'Гиря', unit: 'повт.', rate: 1, loadDifficulty: true },
    { id: 'dumbbells', name: 'Гантели', unit: 'повт.', rate: 1, loadDifficulty: true },
  ],
  END: [
    { id: 'abs', name: 'Пресс', unit: 'повт.', rate: 1 },
    { id: 'plank', name: 'Планка', unit: 'сек', rate: 0.5 },
    { id: 'run', name: 'Бег', unit: 'км', rate: 50, step: 0.1 },
  ],
  AGI: [
    { id: 'jumprope', name: 'Скакалка', unit: 'прыжк.', rate: 0.2 },
    { id: 'burpees', name: 'Берпи', unit: 'повт.', rate: 2 },
    { id: 'squats', name: 'Выпрыгивания', unit: 'повт.', rate: 1 },
  ],
  INT: [
    { id: 'reading', name: 'Чтение', unit: 'мин', rate: 1 },
    { id: 'study', name: 'Учёба', unit: 'мин', rate: 1.5 },
    { id: 'languages', name: 'Языки', unit: 'мин', rate: 1.5 },
    { id: 'chess', name: 'Партия шахмат', unit: 'парт.', rate: 25 },
  ],
  WIL: [
    { id: 'meditation', name: 'Медитация', unit: 'мин', rate: 2 },
    { id: 'coldshower', name: 'Холодный душ', unit: 'мин', rate: 5 },
  ],
};

export const BASE_AP = 10;
export const STR_PER_AP = 20;
export const TRAINING_AP_COST = 0; // Прокачка не тратит энергию
export const AP_REGEN_MS = 30 * 60 * 1000; // +1 AP / 30 мин
export const PUSHUPS_PER_SET = 15;
export const PULLUPS_PER_SET = 5;
export const AP_PER_STRENGTH_SET = 2;
export const BASE_SATIETY_HOURS = 3;
export const SATIETY_XP_BONUS = 0.05;
export const ANABOLIC_XP_BONUS = 0.15;
export const METABOLISM_BONUS = 0.15; // +15% XP и урон на 8ч
export const METABOLISM_HOURS = 8;
export const CLOG_STAT_PENALTY = 0.1; // −10% статов на 6ч
export const CLOG_HOURS = 6;
export const FOCUS_XP_BONUS = 0.1;

/* ---------- титулы и достижения ---------- */

export const TITLES = {
  wanderer: {
    names: { male: 'Странник', female: 'Странница' },
    color: '#22d3ee',
    bonus: '+5 Max HP',
    req: 'Открыт сразу',
    effect: { hp: 5 },
    achievement: null,
    track: null,
    tier: 0,
  },
  iron: {
    names: { male: 'Железный Кузнец', female: 'Железная Дева' },
    color: '#ef4444',
    bonus: '+3% к XP Силы',
    req: 'За 1000 отжиманий',
    effect: { xp: { STR: 0.03 } },
    achievement: 'pushups1000',
    track: 'pushups',
    tier: 1,
  },
  iron_ii: {
    names: { male: 'Титан Железа', female: 'Титанида Железа' },
    color: '#f43f5e',
    bonus: '+6% к XP Силы',
    req: 'За 5000 отжиманий',
    effect: { xp: { STR: 0.06 } },
    achievement: 'pushups5000',
    track: 'pushups',
    tier: 2,
  },
  rockbreaker: {
    names: { male: 'Сокрушитель Скал', female: 'Сокрушительница Скал' },
    color: '#f97316',
    bonus: 'Курс AP: 18 поинтов вместо 20',
    req: 'За 300 подтягиваний',
    effect: { strPerAp: 18 },
    achievement: 'pullups300',
    track: 'pullups',
    tier: 1,
  },
  rockbreaker_ii: {
    names: { male: 'Лорд Турника', female: 'Леди Турника' },
    color: '#fb923c',
    bonus: 'Курс AP: 15 поинтов вместо 20',
    req: 'За 1500 подтягиваний',
    effect: { strPerAp: 15 },
    achievement: 'pullups1500',
    track: 'pullups',
    tier: 2,
  },
  runner: {
    names: { male: 'Неутомимый Бегун', female: 'Неутомимая Бегунья' },
    color: '#22c55e',
    bonus: '+5% к XP Выносливости',
    req: 'За 100 км бега',
    effect: { xp: { END: 0.05 } },
    achievement: 'run100',
    track: 'run',
    tier: 1,
  },
  runner_ii: {
    names: { male: 'Марафонец Пустоши', female: 'Марафонка Пустоши' },
    color: '#4ade80',
    bonus: '+10% к XP Выносливости',
    req: 'За 500 км бега',
    effect: { xp: { END: 0.1 } },
    achievement: 'run500',
    track: 'run',
    tier: 2,
  },
  chef: {
    names: { male: 'Шеф-Повар Пустошей', female: 'Шеф-Повар Пустошей' },
    color: '#eab308',
    bonus: 'Бафф сытости длится 5ч',
    req: 'За 30 полезных блюд',
    effect: { satietyHours: 5 },
    achievement: 'meals30',
    track: 'meals',
    tier: 1,
  },
  keeper: {
    names: { male: 'Хранитель Знаний', female: 'Хранительница Знаний' },
    color: '#3b82f6',
    bonus: 'Крафт свитков требует на 2 чернила меньше',
    req: 'За 1000 мин языков',
    effect: { inkDiscount: 2 },
    achievement: 'languages1000',
    track: 'languages',
    tier: 1,
  },
  tactician: {
    names: { male: 'Тактик', female: 'Тактик' },
    color: '#60a5fa',
    bonus: '+4% к XP Интеллекта',
    req: 'За 50 партий',
    effect: { xp: { INT: 0.04 } },
    achievement: 'chess50',
    track: 'chess',
    tier: 1,
  },
};

// exId — прогресс по totals; track+tier — уровни одной ветки достижений/титулов.
export const ACHIEVEMENTS = [
  { id: 'pushups1000', name: 'Тысяча отжиманий', exId: 'pushups', goal: 1000, title: 'iron', color: '#ef4444', track: 'pushups', tier: 1 },
  { id: 'pushups5000', name: 'Пять тысяч отжиманий', exId: 'pushups', goal: 5000, title: 'iron_ii', color: '#f43f5e', track: 'pushups', tier: 2 },
  { id: 'pullups300', name: 'Покоритель турника', exId: 'pullups', goal: 300, title: 'rockbreaker', color: '#f97316', track: 'pullups', tier: 1 },
  { id: 'pullups1500', name: 'Властелин перекладины', exId: 'pullups', goal: 1500, title: 'rockbreaker_ii', color: '#fb923c', track: 'pullups', tier: 2 },
  { id: 'run100', name: 'Сотня километров', exId: 'run', goal: 100, title: 'runner', color: '#22c55e', track: 'run', tier: 1 },
  { id: 'run500', name: 'Пятьсот километров', exId: 'run', goal: 500, title: 'runner_ii', color: '#4ade80', track: 'run', tier: 2 },
  { id: 'meals30', name: 'Кулинар Системы', exId: 'meals', goal: 30, title: 'chef', color: '#eab308', track: 'meals', tier: 1 },
  { id: 'languages1000', name: 'Полиглот', exId: 'languages', goal: 1000, title: 'keeper', color: '#3b82f6', track: 'languages', tier: 1 },
  { id: 'chess50', name: 'Пятьдесят партий', exId: 'chess', goal: 50, title: 'tactician', color: '#60a5fa', track: 'chess', tier: 1 },
  { id: 'firstQuest', name: 'Первый шаг', desc: 'Выполнить первую тренировку', progress: (p) => p.log.length, goal: 1, color: '#22d3ee', tier: 1 },
  { id: 'level10', name: 'Пробуждённый', desc: 'Достичь 10 уровня', progress: (p) => levelFromXp(p.xp).level, goal: 10, color: '#a855f7', tier: 1 },
  { id: 'maxAp15', name: 'Бездонный резерв', desc: 'Поднять максимум энергии до 15 AP', progress: (p) => p.maxAp, goal: 15, color: '#3b82f6', tier: 1 },
];

export const titleName = (id, gender) => TITLES[id]?.names[gender] ?? '—';

export const achievementProgress = (p, a) => {
  const raw = a.exId ? (p.totals[a.exId] ?? 0) : a.progress(p);
  return Math.min(a.goal, raw);
};

/** Сырой прогресс трека (для отображения уровней). */
export const achievementRawProgress = (p, a) => (a.exId ? (p.totals[a.exId] ?? 0) : a.progress(p));

export const isTitleUnlocked = (p, id) => {
  const ach = TITLES[id]?.achievement;
  return ach === null || p.achievements.includes(ach);
};

export const unlockedTitleCount = (p) => Object.keys(TITLES).filter((id) => isTitleUnlocked(p, id)).length;

export const titleForAchievement = (achId) => ACHIEVEMENTS.find((a) => a.id === achId)?.title ?? null;

/** Подпись прогресса: «Отжимания: 450 / 1000» */
export function achievementTrackLabel(a) {
  if (a.exId) {
    const ex = exerciseById(a.exId);
    return ex?.name ?? a.name;
  }
  return a.name;
}

/** Максимальный открытый уровень ветки достижений. */
export function achievementTrackTier(p, track) {
  if (!track) return 0;
  return ACHIEVEMENTS.filter((a) => a.track === track && p.achievements.includes(a.id)).reduce(
    (max, a) => Math.max(max, a.tier ?? 1),
    0,
  );
}

/** Мс до следующего +1 AP (0 если на капе или тик уже должен сработать). */
export function msUntilNextAp(p, now = Date.now()) {
  if (!p || p.ap >= p.maxAp) return 0;
  const last = p.lastApTick ?? now;
  const elapsed = Math.max(0, now - last);
  const mod = elapsed % AP_REGEN_MS;
  if (mod === 0 && elapsed > 0) return 0;
  return AP_REGEN_MS - mod;
}

export function formatDuration(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}ч ${String(m).padStart(2, '0')}м`;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export const BUFF_INFO = {
  metabolism: {
    id: 'metabolism',
    label: 'Оптимизация метаболизма',
    desc: '+15% к урону и получаемому XP. Действует 8 часов после здоровой домашней еды.',
    color: '#f97316',
    untilKey: 'metabolismUntil',
    altUntilKey: 'anabolicUntil',
  },
  satiety: {
    id: 'satiety',
    label: 'Сытость',
    desc: 'Небольшой бонус к XP после обычной сытости. Длительность зависит от титула.',
    color: '#fbbf24',
    untilKey: 'satietyUntil',
  },
  focus: {
    id: 'focus',
    label: 'Эликсир Фокуса',
    desc: '+10% к XP и бонус к набору навыка Начертания.',
    color: '#3b82f6',
    untilKey: 'focusUntil',
  },
  clog: {
    id: 'clog',
    label: 'Зашлакованность ядра',
    desc: '−10% к статам в бою на 6 часов. Снимается здоровой едой или Свитком Читмила при срыве.',
    color: '#ef4444',
    untilKey: 'clogUntil',
    altUntilKey: 'foodComaUntil',
  },
};

/* ---------- эффекты активного титула и баффов ---------- */

export const activeEffect = (p) => TITLES[p.activeTitle]?.effect ?? {};

export const strPerAp = (p) => activeEffect(p).strPerAp ?? STR_PER_AP;

export const satietyHours = (p) => activeEffect(p).satietyHours ?? BASE_SATIETY_HOURS;

export const isSated = (p, now = Date.now()) => (p.buffs?.satietyUntil ?? 0) > now;
export const isAnabolic = (p, now = Date.now()) => (p.buffs?.anabolicUntil ?? 0) > now;
export const isMetabolism = (p, now = Date.now()) => (p.buffs?.metabolismUntil ?? 0) > now || isAnabolic(p, now);
export const isFocused = (p, now = Date.now()) => (p.buffs?.focusUntil ?? 0) > now;
export const isFoodComa = (p, now = Date.now()) => (p.buffs?.foodComaUntil ?? 0) > now;
export const isClogged = (p, now = Date.now()) => (p.buffs?.clogUntil ?? 0) > now || isFoodComa(p, now);

export function xpMultiplier(p, stat, now = Date.now()) {
  let m = 1 + (activeEffect(p).xp?.[stat] ?? 0);
  if (isMetabolism(p, now)) m += METABOLISM_BONUS;
  else if (isAnabolic(p, now)) m += ANABOLIC_XP_BONUS;
  else if (isSated(p, now)) m += SATIETY_XP_BONUS;
  if (isFocused(p, now)) m += FOCUS_XP_BONUS;
  return m;
}

/** Множитель статов в бою/формулах при дебаффе зашлакованности. */
export function statMultiplier(p, now = Date.now()) {
  return isClogged(p, now) ? 1 - CLOG_STAT_PENALTY : 1;
}

/** Бонус урона от метаболизма (+15%). Штраф зашлакованности — через combatStats/statMultiplier. */
export function damageMultiplier(p, now = Date.now()) {
  let m = 1;
  if (isMetabolism(p, now)) m += METABOLISM_BONUS;
  return m;
}

/* ---------- формулы ---------- */

export const exercisePoints = (ex, amount, rateOverride) => {
  const rate = rateOverride != null ? Number(rateOverride) : ex.rate;
  const raw = Math.max(0, (Number(amount) || 0) * rate);
  // Сохраняем половинки (0.5 / 1.5) до финального округления в applyTraining.
  return Math.round(raw * 100) / 100;
};

export const findExercise = (stat, id) => EXERCISES[stat]?.find((e) => e.id === id);

export const exerciseById = (id) => Object.values(EXERCISES).flat().find((e) => e.id === id);

export const exerciseApCost = (ex) => ex.apCost ?? TRAINING_AP_COST;

// Уровень стата n требует 50·(n−1)² накопленных поинтов: 0, 50, 200, 450, 800...
export const statLevel = (pts) => 1 + Math.floor(Math.sqrt(pts / 50));

export function statProgress(pts) {
  const level = statLevel(pts);
  const from = 50 * (level - 1) ** 2;
  const to = 50 * level ** 2;
  return { level, cur: pts - from, need: to - from };
}

export const getStats = (p) => Object.fromEntries(STATS.map((s) => [s, statLevel(p.statPoints[s])]));

export const xpForNext = (lvl) => Math.round(100 * 1.2 ** (lvl - 1));

export function levelFromXp(xp) {
  let level = 1;
  let rest = xp;
  while (rest >= xpForNext(level)) {
    rest -= xpForNext(level);
    level++;
  }
  return { level, xp: rest, need: xpForNext(level) };
}

export const maxHp = (p) => getStats(p).END * 15 + (activeEffect(p).hp ?? 0);

export const maxApReq = (maxAp) => Math.round(50 * 1.1 ** (maxAp - BASE_AP));

/** @deprecated валюта теперь единый Палиум */
export const splitCoins = (n) => ({ gold: 0, silver: 0, copper: n });

/** Палиум считается тысячными долями (как 0.017 в «Системе компиляции»). */
export const formatPalium = (n) => (Math.round((Number(n) || 0) * 1000) / 1000).toFixed(3);

export const addPalium = (a, b) => Math.round(((Number(a) || 0) + (Number(b) || 0)) * 1000) / 1000;

export const formatAmount = (n) => String(Math.round(n * 100) / 100);

export const PALIUM_COLOR = '#38bdf8';

/** Конвертация старой «целой» экономики в тысячные доли. */
export function migratePalium(raw, version = 0) {
  const v = Number(raw) || 0;
  if (version >= 6) return Math.round(v * 1000) / 1000;
  // Старые сейвы: целые единицы → тысячные (50 → 0.050).
  if (v >= 1) return Math.round(v) / 1000;
  return Math.round(v * 1000) / 1000;
}

/* ---------- даты ---------- */

export function dayKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ---------- состояние игрока ---------- */

const EMPTY_INV = {
  copper_ore: 0,
  wood: 0,
  wild_herbs: 0,
  raw_fish: 0,
  magic_ink: 0,
  cheatmeal_scroll: 0,
  focus_elixir: 0,
  recovery_rune: 0,
  dish_grilled_fish: 0,
  dish_herb_fish: 0,
  dish_fish_stew: 0,
  dish_herb_broth: 0,
};

export function createPlayer(name, gender) {
  const now = Date.now();
  return {
    version: 7,
    name: name.trim(),
    gender,
    createdAt: now,
    xp: 0,
    statPoints: { STR: 0, END: 0, AGI: 0, INT: 0, WIL: 0 },
    ap: BASE_AP,
    maxAp: BASE_AP,
    strBuffer: 0,
    endProgress: 0,
    lastApTick: now,
    lastDailyReset: dayKey(now),
    palium: 0,
    inscriptionXp: 0,
    cookingSkill: 0,
    customRecipes: [],
    activeTitle: 'wanderer',
    achievements: [],
    totals: {},
    buffs: {},
    inventory: { ...EMPTY_INV },
    nodeCooldowns: {},
    cookCounts: {},
    steps: { date: dayKey(now), today: 0, bank: 0 },
    radar: null,
    breach: null,
    world: { gathered: 0, cooked: 0, breaches: 0, breachWins: 0 },
    log: [],
    energy: { strPoints: 0, endPoints: 0, apRestored: 0, maxApGained: 0 },
    updatedAt: now,
  };
}

export function checkAchievements(p, events) {
  const fresh = ACHIEVEMENTS.filter((a) => !p.achievements.includes(a.id) && achievementProgress(p, a) >= a.goal);
  if (!fresh.length) return p;
  for (const a of fresh) events?.push({ type: 'achievement', id: a.id, text: `Достижение «${a.name}»` });
  return { ...p, achievements: [...p.achievements, ...fresh.map((a) => a.id)] };
}

/** Прогоняет результат действия через проверку достижений. */
export function sealResult(result) {
  if (result.error) return result;
  const events = [...(result.events ?? [])];
  return { player: checkAchievements(result.player, events), events };
}

// Приводит сохранения v1/v2 / облачный JSON к текущей схеме.
export function hydratePlayer(p) {
  if (!p || typeof p !== 'object') return null;
  const totals = p.totals ?? (p.log ?? []).reduce((t, e) => ({ ...t, [e.exId]: (t[e.exId] ?? 0) + e.amount }), {});
  const { unlockedTitles: _legacy, copper: legacyCopper, ...rest } = p;
  const next = {
    ...rest,
    achievements: p.achievements ?? [],
    buffs: p.buffs ?? {},
    inventory: { ...EMPTY_INV, ...(p.inventory ?? {}) },
    nodeCooldowns: p.nodeCooldowns ?? {},
    cookCounts: p.cookCounts ?? {},
    customRecipes: p.customRecipes ?? [],
    cookingSkill: p.cookingSkill ?? 0,
    inscriptionXp: p.inscriptionXp ?? 0,
    lastApTick: p.lastApTick ?? Date.now(),
    lastDailyReset: p.lastDailyReset ?? '',
    steps: p.steps ?? { date: '', today: 0, bank: 0 },
    radar: p.radar ?? null,
    breach: p.breach?.active ? p.breach : null,
    world: { gathered: 0, cooked: 0, breaches: 0, breachWins: 0, ...(p.world ?? {}) },
    log: Array.isArray(p.log) ? p.log.slice(-200) : [],
    palium: migratePalium(p.palium ?? legacyCopper ?? 0, p.version ?? 0),
    energy: {
      strPoints: 0,
      endPoints: 0,
      apRestored: 0,
      maxApGained: 0,
      ...(p.energy ?? {}),
    },
    totals,
    updatedAt: Number(p.updatedAt) || 0,
    version: 7,
  };
  delete next.copper;
  delete next.dungeon;
  if (!TITLES[next.activeTitle]) next.activeTitle = 'wanderer';
  return applyTimeSystems(checkAchievements(next)).player;
}

export function loadPlayer(storageKey = STORAGE_KEY) {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? hydratePlayer(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** Метка времени перед записью в localStorage / Supabase. */
export function stampPlayer(p, now = Date.now()) {
  if (!p) return p;
  return { ...p, updatedAt: now };
}

/** Утренний сброс AP + пассивный реген +1 / 30 мин по timestamp. */
export function applyTimeSystems(p, now = Date.now()) {
  if (!p) return p;
  let next = { ...p };
  const events = [];
  let changed = false;
  const today = dayKey(now);

  if (next.lastDailyReset !== today) {
    next = {
      ...next,
      ap: next.maxAp,
      lastDailyReset: today,
      lastApTick: now,
    };
    events.push({ type: 'energy', text: 'Утренний сброс: энергия восстановлена до максимума' });
    changed = true;
  }

  const last = next.lastApTick ?? now;
  const ticks = Math.floor((now - last) / AP_REGEN_MS);
  if (ticks > 0) {
    const lastApTick = last + ticks * AP_REGEN_MS;
    if (next.ap < next.maxAp) {
      const gain = Math.min(ticks, next.maxAp - next.ap);
      next = {
        ...next,
        ap: next.ap + gain,
        lastApTick,
        energy: { ...next.energy, apRestored: (next.energy?.apRestored ?? 0) + gain },
      };
      if (gain > 0) events.push({ type: 'energy', text: `Пассивный реген: +${gain} AP` });
      changed = true;
    } else if (next.lastApTick !== lastApTick) {
      // На капе тики не копятся — сдвигаем timestamp без начисления.
      next = { ...next, lastApTick };
      changed = true;
    }
  } else if (!next.lastApTick) {
    next = { ...next, lastApTick: now };
    changed = true;
  }

  return { player: next, events, changed };
}

export function savePlayer(p, storageKey = STORAGE_KEY) {
  if (!p) return;
  localStorage.setItem(storageKey, JSON.stringify(p));
}

function addTotals(totals, stat, values) {
  const next = { ...totals };
  for (const ex of EXERCISES[stat]) {
    const amount = Number(values[ex.id]) || 0;
    if (amount > 0) next[ex.id] = (next[ex.id] ?? 0) + amount;
  }
  return next;
}

export function equipTitle(p, id) {
  if (!TITLES[id] || !isTitleUnlocked(p, id)) return { error: 'Титул ещё не открыт' };
  return {
    player: { ...p, activeTitle: id },
    events: [{ type: 'title', text: `Экипирован «${titleName(id, p.gender)}»: ${TITLES[id].bonus}` }],
  };
}

/** Прокачка: упражнения без траты AP → XP и статы (без Палиума). rateOverride — для гири/гантелей. */
export function applyTraining(p, stat, exId, amount, rateOverride) {
  const ex = findExercise(stat, exId);
  if (!ex) return { error: 'Неизвестное упражнение' };
  if (ex.loadDifficulty && rateOverride == null) return { error: 'Выберите сложность' };
  const base = exercisePoints(ex, amount, rateOverride);
  if (base <= 0) return { error: 'Введите количество' };

  const now = Date.now();
  const points = Math.round(base * xpMultiplier(p, stat, now) * 2) / 2; // шаг 0.5
  const events = [];
  const prevLevel = levelFromXp(p.xp).level;
  const prevStat = statLevel(p.statPoints[stat]);

  let next = {
    ...p,
    xp: p.xp + points,
    statPoints: { ...p.statPoints, [stat]: p.statPoints[stat] + points },
    totals: addTotals(p.totals, stat, { [exId]: amount }),
    log: [...(p.log ?? []), { ts: now, date: dayKey(now), stat, exId, amount, points, rate: rateOverride ?? ex.rate }],
  };

  events.push({
    type: 'gain',
    text: `+${points} ${stat} · +${points} XP${points > base ? ` (бонус +${Math.round((points - base) * 2) / 2})` : ''}`,
  });

  const newStat = statLevel(next.statPoints[stat]);
  if (newStat > prevStat) {
    events.push({ type: 'stat', text: `${STAT_META[stat].label} повышена: ${prevStat} → ${newStat}` });
  }

  const newLevel = levelFromXp(next.xp).level;
  if (newLevel > prevLevel) {
    next = { ...next, ap: next.maxAp };
    events.push({ type: 'level', text: `УРОВЕНЬ ПОВЫШЕН: ${newLevel}! Энергия восстановлена` });
  }

  next = checkAchievements(next, events);
  return { player: next, events };
}

export function sumPoints(stat, values) {
  return EXERCISES[stat].reduce((acc, ex) => acc + exercisePoints(ex, Number(values[ex.id]) || 0), 0);
}

/** 15 отжиманий или 5 подтягиваний = +2 AP. */
export function previewStrengthRefill(p, pushups, pullups) {
  const pu = Math.max(0, Number(pushups) || 0);
  const pl = Math.max(0, Number(pullups) || 0);
  const sets = Math.floor(pu / PUSHUPS_PER_SET) + Math.floor(pl / PULLUPS_PER_SET);
  const raw = sets * AP_PER_STRENGTH_SET;
  const space = Math.max(0, p.maxAp - p.ap);
  const gain = Math.min(raw, space);
  return {
    gain,
    sets,
    leftoverPushups: pu % PUSHUPS_PER_SET,
    leftoverPullups: pl % PULLUPS_PER_SET,
    capped: raw > space,
  };
}

export function applyRefill(p, values) {
  const pushups = Number(values.pushups) || 0;
  const pullups = Number(values.pullups) || 0;
  if (pushups <= 0 && pullups <= 0) return { error: 'Введите отжимания или подтягивания' };
  if (p.ap >= p.maxAp) return { error: 'Энергия уже заполнена' };
  const { gain, sets } = previewStrengthRefill(p, pushups, pullups);
  if (sets <= 0) {
    return {
      error: `Нужно минимум ${PUSHUPS_PER_SET} отжиманий или ${PULLUPS_PER_SET} подтягиваний за подход`,
    };
  }
  const events = [{ type: 'energy', text: `+${gain} AP (${sets} подход(а) × ${AP_PER_STRENGTH_SET})` }];
  const next = checkAchievements(
    {
      ...p,
      ap: p.ap + gain,
      totals: addTotals(p.totals, 'STR', { pushups, pullups }),
      energy: {
        ...p.energy,
        strPoints: (p.energy?.strPoints ?? 0) + pushups + pullups * 3,
        apRestored: (p.energy?.apRestored ?? 0) + gain,
      },
    },
    events,
  );
  return { player: next, events };
}

/** @deprecated совместимость */
export function previewRefill(p, points) {
  return previewStrengthRefill(p, points, 0);
}

/** Поинты Выносливости расширяют максимум энергии. */
export function previewExpand(p, points) {
  let maxAp = p.maxAp;
  let progress = p.endProgress + points;
  while (progress >= maxApReq(maxAp)) {
    progress -= maxApReq(maxAp);
    maxAp++;
  }
  return { maxAp, progress, gained: maxAp - p.maxAp };
}

export function applyExpand(p, values) {
  const points = sumPoints('END', values);
  if (points <= 0) return { error: 'Введите значения' };
  const { maxAp, progress, gained } = previewExpand(p, points);
  const events = [
    gained > 0
      ? { type: 'level', text: `Лимит энергии расширен: ${maxAp} AP` }
      : { type: 'energy', text: `Прогресс лимита: ${progress}/${maxApReq(maxAp)}` },
  ];
  const next = checkAchievements(
    {
      ...p,
      maxAp,
      endProgress: progress,
      totals: addTotals(p.totals, 'END', values),
      energy: { ...p.energy, endPoints: p.energy.endPoints + points, maxApGained: p.energy.maxApGained + gained },
    },
    events,
  );
  return { player: next, events };
}
