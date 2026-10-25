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
/** Сложность для упражнения со снарядом: поинты за 1 повтор. */
export const LOAD_DIFFICULTIES = [
  { id: 'easy', label: 'Легко', rate: 0.5 },
  { id: 'normal', label: 'Нормально', rate: 1 },
  { id: 'hard', label: 'Сложно', rate: 1.5 },
  { id: 'extreme', label: 'Оч. сложно', rate: 2 },
];

/** Награда за выполнение личного квеста Воли. */
export const CUSTOM_QUEST_POINTS = 25;

export const EXERCISES = {
  STR: [
    { id: 'pushups', name: 'Отжимания', unit: 'повт.', rate: 1 },
    { id: 'pullups', name: 'Подтягивания', unit: 'повт.', rate: 3 },
    { id: 'legsquats', name: 'Приседания', unit: 'повт.', rate: 1 },
    { id: 'implement', name: 'Упражнение со снарядом', unit: 'повт.', rate: 1, loadDifficulty: true },
  ],
  END: [
    { id: 'abs', name: 'Пресс', unit: 'повт.', rate: 1 },
    { id: 'plank', name: 'Планка', unit: 'сек', rate: 0.5 },
    { id: 'run', name: 'Бег', unit: 'км', rate: 50, step: 0.1 },
  ],
  AGI: [
    { id: 'jumprope', name: 'Скакалка', unit: 'мин', rate: 5 },
    { id: 'burpees', name: 'Берпи', unit: 'повт.', rate: 3 },
    { id: 'squats', name: 'Выпрыгивания', unit: 'повт.', rate: 1 },
    { id: 'stretching', name: 'Растяжка', unit: 'мин', rate: 5 },
  ],
  INT: [
    { id: 'reading', name: 'Чтение', unit: 'мин', rate: 1 },
    { id: 'study', name: 'Учёба', unit: 'мин', rate: 1.5 },
    { id: 'languages', name: 'Языки', unit: 'мин', rate: 1.5 },
    { id: 'drawing', name: 'Рисование', unit: 'мин', rate: 1.5 },
    { id: 'chess', name: 'Партия шахмат', unit: 'парт.', rate: 10 },
  ],
  WIL: [
    { id: 'meditation', name: 'Медитация', unit: 'мин', rate: 2 },
  ],
};

/** Упражнения дуэли. Рейтинг у каждого свой. */
export const PVP_EXERCISES = [
  { id: 'pushups', stat: 'STR', name: 'Отжимания', mode: 'pushups' },
  { id: 'pullups', stat: 'STR', name: 'Подтягивания', mode: 'pullups' },
  { id: 'legsquats', stat: 'STR', name: 'Приседания', mode: 'squats' },
  { id: 'abs', stat: 'END', name: 'Пресс', mode: 'abs' },
];

/** @param {string} [id] */
export function pvpExercise(id) {
  return PVP_EXERCISES.find((ex) => ex.id === id) ?? PVP_EXERCISES[0];
}

/** @param {object} p */
export function pvpRatingsOf(p) {
  const src = p?.pvpRatings && typeof p.pvpRatings === 'object' ? p.pvpRatings : {};
  const legacy = Math.max(100, Math.floor(Number(p?.pvpRating) || 1000));
  const out = {};
  for (const ex of PVP_EXERCISES) {
    const raw = src[ex.id] != null ? src[ex.id] : ex.id === 'pushups' ? legacy : 1000;
    out[ex.id] = Math.max(100, Math.floor(Number(raw) || 1000));
  }
  return out;
}

/** @param {object} p */
export function pvpWinsOf(p) {
  const src = p?.pvpWins && typeof p.pvpWins === 'object' ? p.pvpWins : {};
  const out = {};
  for (const ex of PVP_EXERCISES) out[ex.id] = Math.max(0, Math.floor(Number(src[ex.id]) || 0));
  return out;
}

export const BASE_AP = 10;
export const STR_PER_AP = 20;
export const TRAINING_AP_COST = 0; // Прокачка не тратит энергию
export const AP_REGEN_MS = 30 * 60 * 1000; // +1 AP / 30 мин
export const HP_REGEN_MS = 15 * 60 * 1000; // тик регена HP
export const HP_REGEN_PERCENT = 0.05;

/** Сколько HP прибавляет один тик: 5% максимума, минимум 1. */
export function hpRegenPerTick(maxHpValue) {
  const max = Math.max(1, Math.round(Number(maxHpValue) || 1));
  return Math.max(1, Math.floor(max * HP_REGEN_PERCENT));
}
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
  walker: {
    names: { male: 'Следопыт троп', female: 'Следопытка троп' },
    color: '#2dd4bf',
    bonus: '+3% к XP Выносливости',
    req: 'За 20 000 шагов',
    effect: { xp: { END: 0.03 } },
    achievement: 'steps20k',
    track: 'steps',
    tier: 1,
  },
  walker_ii: {
    names: { male: 'Властелин троп', female: 'Властелинша троп' },
    color: '#5eead4',
    bonus: '+6% к XP Выносливости',
    req: 'За 100 000 шагов',
    effect: { xp: { END: 0.06 } },
    achievement: 'steps100k',
    track: 'steps',
    tier: 2,
  },
  contractor: {
    names: { male: 'Порученец Системы', female: 'Порученка Системы' },
    color: '#c084fc',
    bonus: '+3% к XP Воли',
    req: 'Закрыть 7 ежедневных контрактов',
    effect: { xp: { WIL: 0.03 } },
    achievement: 'contracts7',
    track: 'contracts',
    tier: 1,
  },
  contractor_ii: {
    names: { male: 'Архивариус контрактов', female: 'Архивариус контрактов' },
    color: '#d8b4fe',
    bonus: '+6% к XP Воли',
    req: 'Закрыть 30 ежедневных контрактов',
    effect: { xp: { WIL: 0.06 } },
    achievement: 'contracts30',
    track: 'contracts',
    tier: 2,
  },
  attendant: {
    names: { male: 'Непропустивший', female: 'Непропустившая' },
    color: '#fb7185',
    bonus: '+4 Max HP',
    req: 'Серия явки 7 дней',
    effect: { hp: 4 },
    achievement: 'streak7',
    track: 'streak',
    tier: 1,
  },
  attendant_ii: {
    names: { male: 'Железная явка', female: 'Железная явка' },
    color: '#fda4af',
    bonus: '+10 Max HP',
    req: 'Серия явки 21 день',
    effect: { hp: 10 },
    achievement: 'streak21',
    track: 'streak',
    tier: 2,
  },
  slayer: {
    names: { male: 'Охотник дня', female: 'Охотница дня' },
    color: '#ef4444',
    bonus: '+3% к XP Силы',
    req: 'Забрать добычу босса 1 раз',
    effect: { xp: { STR: 0.03 } },
    achievement: 'boss1',
    track: 'boss',
    tier: 1,
  },
  slayer_ii: {
    names: { male: 'Палач дня', female: 'Палач дня' },
    color: '#f87171',
    bonus: '+6% к XP Силы',
    req: 'Забрать добычу босса 7 раз',
    effect: { xp: { STR: 0.06 } },
    achievement: 'boss7',
    track: 'boss',
    tier: 2,
  },
  artisan: {
    names: { male: 'Ремесленник Системы', female: 'Ремесленница Системы' },
    color: '#f59e0b',
    bonus: '+2% XP ко всем статам',
    req: 'Создать 10 предметов',
    effect: { xpAll: 0.02 },
    achievement: 'craft10',
    track: 'craft',
    tier: 1,
  },
  artisan_ii: {
    names: { male: 'Мастер гильдии', female: 'Мастерица гильдии' },
    color: '#fbbf24',
    bonus: '+4% XP ко всем статам',
    req: 'Создать 40 предметов',
    effect: { xpAll: 0.04 },
    achievement: 'craft40',
    track: 'craft',
    tier: 2,
  },
  squatter: {
    names: { male: 'Каменные ноги', female: 'Каменные ноги' },
    color: '#ef4444',
    bonus: '+3% к XP Силы',
    req: 'За 400 приседаний',
    effect: { xp: { STR: 0.03 } },
    achievement: 'legsquats400',
    track: 'legsquats',
    tier: 1,
  },
  squatter_ii: {
    names: { male: 'Опора Системы', female: 'Опора Системы' },
    color: '#f87171',
    bonus: '+6% к XP Силы',
    req: 'За 2 000 приседаний',
    effect: { xp: { STR: 0.06 } },
    achievement: 'legsquats2000',
    track: 'legsquats',
    tier: 2,
  },
  core: {
    names: { male: 'Стальной кор', female: 'Стальной кор' },
    color: '#22c55e',
    bonus: '+3% к XP Выносливости',
    req: 'За 300 повторов пресса',
    effect: { xp: { END: 0.03 } },
    achievement: 'abs300',
    track: 'abs',
    tier: 1,
  },
  core_ii: {
    names: { male: 'Несгибаемый кор', female: 'Несгибаемый кор' },
    color: '#4ade80',
    bonus: '+6% к XP Выносливости',
    req: 'За 1 500 повторов пресса',
    effect: { xp: { END: 0.06 } },
    achievement: 'abs1500',
    track: 'abs',
    tier: 2,
  },
  plank: {
    names: { male: 'Стойкий как скала', female: 'Стойкая как скала' },
    color: '#16a34a',
    bonus: '+3% к XP Выносливости',
    req: 'За 10 минут планки',
    effect: { xp: { END: 0.03 } },
    achievement: 'plank600',
    track: 'plank',
    tier: 1,
  },
  plank_ii: {
    names: { male: 'Живая стена', female: 'Живая стена' },
    color: '#86efac',
    bonus: '+6% к XP Выносливости',
    req: 'За 40 минут планки',
    effect: { xp: { END: 0.06 } },
    achievement: 'plank2400',
    track: 'plank',
    tier: 2,
  },
  jumper: {
    names: { male: 'Прыгун', female: 'Прыгунья' },
    color: '#eab308',
    bonus: '+3% к XP Ловкости',
    req: 'За 30 минут скакалки',
    effect: { xp: { AGI: 0.03 } },
    achievement: 'rope2k',
    track: 'jumprope',
    tier: 1,
  },
  jumper_ii: {
    names: { male: 'Буря скакалки', female: 'Буря скакалки' },
    color: '#fde047',
    bonus: '+6% к XP Ловкости',
    req: 'За 120 минут скакалки',
    effect: { xp: { AGI: 0.06 } },
    achievement: 'rope10k',
    track: 'jumprope',
    tier: 2,
  },
  burpee: {
    names: { male: 'Берпи-охотник', female: 'Берпи-охотница' },
    color: '#f59e0b',
    bonus: '+3% к XP Ловкости',
    req: 'За 100 берпи',
    effect: { xp: { AGI: 0.03 } },
    achievement: 'burpees100',
    track: 'burpees',
    tier: 1,
  },
  burpee_ii: {
    names: { male: 'Буря берпи', female: 'Буря берпи' },
    color: '#fbbf24',
    bonus: '+6% к XP Ловкости',
    req: 'За 400 берпи',
    effect: { xp: { AGI: 0.06 } },
    achievement: 'burpees400',
    track: 'burpees',
    tier: 2,
  },
  leaper: {
    names: { male: 'Прыгун из тени', female: 'Прыгунья из тени' },
    color: '#eab308',
    bonus: '+3% к XP Ловкости',
    req: 'За 200 выпрыгиваний',
    effect: { xp: { AGI: 0.03 } },
    achievement: 'jumps200',
    track: 'jumps',
    tier: 1,
  },
  leaper_ii: {
    names: { male: 'Тень в прыжке', female: 'Тень в прыжке' },
    color: '#facc15',
    bonus: '+6% к XP Ловкости',
    req: 'За 800 выпрыгиваний',
    effect: { xp: { AGI: 0.06 } },
    achievement: 'jumps800',
    track: 'jumps',
    tier: 2,
  },
  flex: {
    names: { male: 'Гибкий клинок', female: 'Гибкий клинок' },
    color: '#a3e635',
    bonus: '+3% к XP Ловкости',
    req: 'За 30 минут растяжки',
    effect: { xp: { AGI: 0.03 } },
    achievement: 'stretch30',
    track: 'stretch',
    tier: 1,
  },
  flex_ii: {
    names: { male: 'Живая лоза', female: 'Живая лоза' },
    color: '#bef264',
    bonus: '+6% к XP Ловкости',
    req: 'За 120 минут растяжки',
    effect: { xp: { AGI: 0.06 } },
    achievement: 'stretch120',
    track: 'stretch',
    tier: 2,
  },
  reader: {
    names: { male: 'Чтец гримуаров', female: 'Чтица гримуаров' },
    color: '#3b82f6',
    bonus: '+3% к XP Интеллекта',
    req: 'За 180 минут чтения',
    effect: { xp: { INT: 0.03 } },
    achievement: 'read180',
    track: 'reading',
    tier: 1,
  },
  reader_ii: {
    names: { male: 'Архивариус страниц', female: 'Архивариус страниц' },
    color: '#93c5fd',
    bonus: '+6% к XP Интеллекта',
    req: 'За 900 минут чтения',
    effect: { xp: { INT: 0.06 } },
    achievement: 'read900',
    track: 'reading',
    tier: 2,
  },
  scholar: {
    names: { male: 'Ученик Системы', female: 'Ученица Системы' },
    color: '#2563eb',
    bonus: '+3% к XP Интеллекта',
    req: 'За 120 минут учёбы',
    effect: { xp: { INT: 0.03 } },
    achievement: 'study120',
    track: 'study',
    tier: 1,
  },
  scholar_ii: {
    names: { male: 'Магистр Системы', female: 'Магистр Системы' },
    color: '#60a5fa',
    bonus: '+6% к XP Интеллекта',
    req: 'За 600 минут учёбы',
    effect: { xp: { INT: 0.06 } },
    achievement: 'study600',
    track: 'study',
    tier: 2,
  },
  artist: {
    names: { male: 'Художник Системы', female: 'Художница Системы' },
    color: '#818cf8',
    bonus: '+3% к XP Интеллекта',
    req: 'За 120 минут рисования',
    effect: { xp: { INT: 0.03 } },
    achievement: 'draw120',
    track: 'drawing',
    tier: 1,
  },
  artist_ii: {
    names: { male: 'Мастер кисти', female: 'Мастерица кисти' },
    color: '#a5b4fc',
    bonus: '+6% к XP Интеллекта',
    req: 'За 600 минут рисования',
    effect: { xp: { INT: 0.06 } },
    achievement: 'draw600',
    track: 'drawing',
    tier: 2,
  },
  monk: {
    names: { male: 'Послушник воли', female: 'Послушница воли' },
    color: '#a855f7',
    bonus: '+3% к XP Воли',
    req: 'За 60 минут медитации',
    effect: { xp: { WIL: 0.03 } },
    achievement: 'med60',
    track: 'meditation',
    tier: 1,
  },
  monk_ii: {
    names: { male: 'Тихая воля', female: 'Тихая воля' },
    color: '#d8b4fe',
    bonus: '+6% к XP Воли',
    req: 'За 300 минут медитации',
    effect: { xp: { WIL: 0.06 } },
    achievement: 'med300',
    track: 'meditation',
    tier: 2,
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
  { id: 'steps20k', name: 'Двадцать тысяч шагов', desc: 'Шаги', progress: (p) => p.totals?.walk_steps ?? 0, goal: 20000, title: 'walker', color: '#2dd4bf', track: 'steps', tier: 1 },
  { id: 'steps100k', name: 'Сто тысяч шагов', desc: 'Шаги', progress: (p) => p.totals?.walk_steps ?? 0, goal: 100000, title: 'walker_ii', color: '#5eead4', track: 'steps', tier: 2 },
  { id: 'contracts7', name: 'Семь контрактов', desc: 'Закрытые контракты', progress: (p) => p.world?.contracts ?? 0, goal: 7, title: 'contractor', color: '#c084fc', track: 'contracts', tier: 1 },
  { id: 'contracts30', name: 'Тридцать контрактов', desc: 'Закрытые контракты', progress: (p) => p.world?.contracts ?? 0, goal: 30, title: 'contractor_ii', color: '#d8b4fe', track: 'contracts', tier: 2 },
  { id: 'streak7', name: 'Неделя явки', desc: 'Рекорд серии', progress: (p) => p.attendance?.best ?? 0, goal: 7, title: 'attendant', color: '#fb7185', track: 'streak', tier: 1 },
  { id: 'streak21', name: 'Три недели явки', desc: 'Рекорд серии', progress: (p) => p.attendance?.best ?? 0, goal: 21, title: 'attendant_ii', color: '#fda4af', track: 'streak', tier: 2 },
  { id: 'boss1', name: 'Первый босс', desc: 'Добыча босса дня', progress: (p) => p.world?.bossClaims ?? 0, goal: 1, title: 'slayer', color: '#ef4444', track: 'boss', tier: 1 },
  { id: 'boss7', name: 'Семь боссов', desc: 'Добыча босса дня', progress: (p) => p.world?.bossClaims ?? 0, goal: 7, title: 'slayer_ii', color: '#f87171', track: 'boss', tier: 2 },
  { id: 'craft10', name: 'Десять изделий', desc: 'Предметы профессий', progress: (p) => p.world?.crafted ?? 0, goal: 10, title: 'artisan', color: '#f59e0b', track: 'craft', tier: 1 },
  { id: 'craft40', name: 'Сорок изделий', desc: 'Предметы профессий', progress: (p) => p.world?.crafted ?? 0, goal: 40, title: 'artisan_ii', color: '#fbbf24', track: 'craft', tier: 2 },
  { id: 'legsquats400', name: 'Четыреста приседаний', exId: 'legsquats', goal: 400, title: 'squatter', color: '#ef4444', track: 'legsquats', tier: 1 },
  { id: 'legsquats2000', name: 'Две тысячи приседаний', exId: 'legsquats', goal: 2000, title: 'squatter_ii', color: '#f87171', track: 'legsquats', tier: 2 },
  { id: 'abs300', name: 'Триста на пресс', exId: 'abs', goal: 300, title: 'core', color: '#22c55e', track: 'abs', tier: 1 },
  { id: 'abs1500', name: 'Полторы тысячи на пресс', exId: 'abs', goal: 1500, title: 'core_ii', color: '#4ade80', track: 'abs', tier: 2 },
  { id: 'plank600', name: 'Десять минут планки', exId: 'plank', goal: 600, title: 'plank', color: '#16a34a', track: 'plank', tier: 1 },
  { id: 'plank2400', name: 'Сорок минут планки', exId: 'plank', goal: 2400, title: 'plank_ii', color: '#86efac', track: 'plank', tier: 2 },
  { id: 'rope2k', name: 'Полчаса скакалки', exId: 'jumprope', goal: 30, title: 'jumper', color: '#eab308', track: 'jumprope', tier: 1 },
  { id: 'rope10k', name: 'Два часа скакалки', exId: 'jumprope', goal: 120, title: 'jumper_ii', color: '#fde047', track: 'jumprope', tier: 2 },
  { id: 'burpees100', name: 'Сотня берпи', exId: 'burpees', goal: 100, title: 'burpee', color: '#f59e0b', track: 'burpees', tier: 1 },
  { id: 'burpees400', name: 'Четыреста берпи', exId: 'burpees', goal: 400, title: 'burpee_ii', color: '#fbbf24', track: 'burpees', tier: 2 },
  { id: 'jumps200', name: 'Двести выпрыгиваний', exId: 'squats', goal: 200, title: 'leaper', color: '#eab308', track: 'jumps', tier: 1 },
  { id: 'jumps800', name: 'Восемьсот выпрыгиваний', exId: 'squats', goal: 800, title: 'leaper_ii', color: '#facc15', track: 'jumps', tier: 2 },
  { id: 'stretch30', name: 'Полчаса растяжки', exId: 'stretching', goal: 30, title: 'flex', color: '#a3e635', track: 'stretch', tier: 1 },
  { id: 'stretch120', name: 'Два часа растяжки', exId: 'stretching', goal: 120, title: 'flex_ii', color: '#bef264', track: 'stretch', tier: 2 },
  { id: 'read180', name: 'Три часа чтения', exId: 'reading', goal: 180, title: 'reader', color: '#3b82f6', track: 'reading', tier: 1 },
  { id: 'read900', name: 'Пятнадцать часов чтения', exId: 'reading', goal: 900, title: 'reader_ii', color: '#93c5fd', track: 'reading', tier: 2 },
  { id: 'study120', name: 'Два часа учёбы', exId: 'study', goal: 120, title: 'scholar', color: '#2563eb', track: 'study', tier: 1 },
  { id: 'study600', name: 'Десять часов учёбы', exId: 'study', goal: 600, title: 'scholar_ii', color: '#60a5fa', track: 'study', tier: 2 },
  { id: 'draw120', name: 'Два часа рисования', exId: 'drawing', goal: 120, title: 'artist', color: '#818cf8', track: 'drawing', tier: 1 },
  { id: 'draw600', name: 'Десять часов рисования', exId: 'drawing', goal: 600, title: 'artist_ii', color: '#a5b4fc', track: 'drawing', tier: 2 },
  { id: 'med60', name: 'Час медитации', exId: 'meditation', goal: 60, title: 'monk', color: '#a855f7', track: 'meditation', tier: 1 },
  { id: 'med300', name: 'Пять часов медитации', exId: 'meditation', goal: 300, title: 'monk_ii', color: '#d8b4fe', track: 'meditation', tier: 2 },
  { id: 'pvpPush1', name: 'Дуэлянт отжиманий', desc: 'Победа в дуэли на отжиманиях', progress: (p) => p.pvpWins?.pushups ?? 0, goal: 1, color: '#22d3ee', tier: 1 },
  { id: 'pvpPush10', name: 'Десять дуэлей на отжиманиях', desc: 'Победы в дуэли на отжиманиях', progress: (p) => p.pvpWins?.pushups ?? 0, goal: 10, color: '#67e8f9', tier: 2 },
  { id: 'pvpPull1', name: 'Дуэлянт турника', desc: 'Победа в дуэли на подтягиваниях', progress: (p) => p.pvpWins?.pullups ?? 0, goal: 1, color: '#f97316', tier: 1 },
  { id: 'pvpPull10', name: 'Десять дуэлей на турнике', desc: 'Победы в дуэли на подтягиваниях', progress: (p) => p.pvpWins?.pullups ?? 0, goal: 10, color: '#fdba74', tier: 2 },
  { id: 'pvpSquat1', name: 'Дуэлянт приседа', desc: 'Победа в дуэли на приседаниях', progress: (p) => p.pvpWins?.legsquats ?? 0, goal: 1, color: '#ef4444', tier: 1 },
  { id: 'pvpSquat10', name: 'Десять дуэлей на приседаниях', desc: 'Победы в дуэли на приседаниях', progress: (p) => p.pvpWins?.legsquats ?? 0, goal: 10, color: '#f87171', tier: 2 },
  { id: 'pvpAbs1', name: 'Дуэлянт пресса', desc: 'Победа в дуэли на пресс', progress: (p) => p.pvpWins?.abs ?? 0, goal: 1, color: '#22c55e', tier: 1 },
  { id: 'pvpAbs10', name: 'Десять дуэлей на пресс', desc: 'Победы в дуэли на пресс', progress: (p) => p.pvpWins?.abs ?? 0, goal: 10, color: '#4ade80', tier: 2 },
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

/** Титул и достижение уровня 2 видны только после уровня 1 той же ветки. */
export function isTierVisible(p, entry) {
  const tier = entry?.tier ?? 1;
  if (!entry?.track || tier <= 1) return true;
  return achievementTrackTier(p, entry.track) >= tier - 1;
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

/** Мс до следующего +1 HP (нужен maxHp снаружи — с бонусами экипировки). */
export function msUntilNextHp(p, maxHpValue, now = Date.now()) {
  if (!p || maxHpValue <= 0) return 0;
  const cur = currentHp(p, maxHpValue);
  if (cur >= maxHpValue) return 0;
  const last = p.lastHpTick ?? now;
  const elapsed = Math.max(0, now - last);
  const mod = elapsed % HP_REGEN_MS;
  if (mod === 0 && elapsed > 0) return 0;
  return HP_REGEN_MS - mod;
}

/** Текущее HP; null/undefined = полный запас. */
export function currentHp(p, maxHpValue) {
  const max = Math.max(1, Math.round(maxHpValue ?? 1));
  if (p?.hp == null) return max;
  return Math.max(0, Math.min(max, Math.round(Number(p.hp) || 0)));
}

export function withHp(p, hp, maxHpValue) {
  const max = Math.max(1, Math.round(maxHpValue ?? 1));
  const next = Math.max(0, Math.min(max, Math.round(Number(hp) || 0)));
  return { ...p, hp: next };
}

export function formatDuration(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}ч ${String(m).padStart(2, '0')}м`;
  return `${m}:${String(r).padStart(2, '0')}`;
}

/** Смена имени: не чаще раза в 7 дней. */
export const NAME_CHANGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export function msUntilNameChange(p, now = Date.now()) {
  const last = Number(p?.nameChangedAt) || 0;
  if (!last) return 0;
  return Math.max(0, last + NAME_CHANGE_COOLDOWN_MS - now);
}

export function canChangeName(p, now = Date.now()) {
  return msUntilNameChange(p, now) <= 0;
}

export function formatNameCooldown(ms) {
  const total = Math.max(0, ms);
  const days = Math.floor(total / (24 * 60 * 60 * 1000));
  const hours = Math.ceil((total % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days >= 1) return hours > 0 ? `${days} дн. ${hours} ч` : `${days} дн.`;
  if (total >= 60 * 60 * 1000) return `${Math.max(1, Math.ceil(total / (60 * 60 * 1000)))} ч`;
  return formatDuration(total);
}

export function renamePlayer(p, rawName, now = Date.now()) {
  const name = String(rawName ?? '').trim();
  if (name.length < 2) return { error: 'Имя слишком короткое (мин. 2 символа)' };
  if (name.length > 24) return { error: 'Имя слишком длинное (макс. 24 символа)' };
  if (name === p.name) return { error: 'Это уже ваше текущее имя' };
  const wait = msUntilNameChange(p, now);
  if (wait > 0) return { error: `Смена имени доступна через ${formatNameCooldown(wait)}` };
  return {
    player: { ...p, name, nameChangedAt: now, updatedAt: now },
    events: [{ type: 'system', text: `Имя изменено: «${name}»` }],
  };
}

/** Смена пола: не чаще раза в 30 дней. */
export const GENDER_CHANGE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

export const GENDER_LABELS = {
  male: 'Мужской',
  female: 'Женский',
};

export function msUntilGenderChange(p, now = Date.now()) {
  const last = Number(p?.genderChangedAt) || 0;
  if (!last) return 0;
  return Math.max(0, last + GENDER_CHANGE_COOLDOWN_MS - now);
}

export function canChangeGender(p, now = Date.now()) {
  return msUntilGenderChange(p, now) <= 0;
}

export function changeGender(p, rawGender, now = Date.now()) {
  const gender = rawGender === 'female' ? 'female' : rawGender === 'male' ? 'male' : '';
  if (!gender) return { error: 'Выберите пол' };
  const current = p?.gender === 'female' ? 'female' : 'male';
  if (gender === current) return { error: 'Это уже текущий пол' };
  const wait = msUntilGenderChange(p, now);
  if (wait > 0) return { error: `Смена пола доступна через ${formatNameCooldown(wait)}` };
  return {
    player: { ...p, gender, genderChangedAt: now, updatedAt: now },
    events: [{ type: 'system', text: `Пол изменён: ${GENDER_LABELS[gender]}` }],
  };
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
  let m = 1 + (activeEffect(p).xp?.[stat] ?? 0) + (activeEffect(p).xpAll ?? 0);
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
  // Промежуточный расчёт может быть дробным; в сейв/синк идёт floorAwardPoints.
  return Math.round(raw * 100) / 100;
};

/** Итоговые очки прокачки — целые ( вниз ), иначе Postgres integer ломает синк. */
export function floorAwardPoints(raw) {
  return Math.max(0, Math.floor(Number(raw) || 0));
}

export function findExercise(stat, id, p = null) {
  const built = EXERCISES[stat]?.find((e) => e.id === id);
  if (built) return built;
  if (stat === 'WIL' && id && p) {
    const q = (p.customQuests ?? []).find((x) => x.id === id);
    if (q) {
      return {
        id: q.id,
        name: q.name,
        unit: 'квест',
        rate: CUSTOM_QUEST_POINTS,
        custom: true,
        desc: q.desc || '',
      };
    }
  }
  return undefined;
}

export const exerciseById = (id, p = null) =>
  Object.values(EXERCISES).flat().find((e) => e.id === id) ??
  (p ? (p.customQuests ?? []).find((q) => q.id === id) : null);

export const exerciseApCost = (ex) => ex.apCost ?? TRAINING_AP_COST;

/** База 1→2 = 50; каждый следующий уровень +10% к предыдущему порогу (50 → 55 → 61…). */
export const STAT_BASE_NEED = 50;
export const STAT_NEED_GROWTH = 1.1;

/** Поинты, нужные чтобы перейти с `level` на `level + 1`. */
export function needForStatLevel(level) {
  const L = Math.max(1, Math.floor(Number(level) || 1));
  return Math.round(STAT_BASE_NEED * STAT_NEED_GROWTH ** (L - 1));
}

/** Минимальные накопленные поинты для отображаемого уровня L. */
export function pointsForStatLevel(level) {
  const L = Math.max(1, Math.floor(Number(level) || 1));
  if (L <= 1) return 0;
  let total = 0;
  for (let lv = 1; lv < L; lv++) total += needForStatLevel(lv);
  return total;
}

export function statLevel(pts) {
  const p = Math.max(0, Number(pts) || 0);
  let level = 1;
  // Защита от бесконечного цикла на огромных значениях.
  while (level < 500 && pointsForStatLevel(level + 1) <= p) level += 1;
  return level;
}

export function statProgress(pts) {
  const level = statLevel(pts);
  const from = pointsForStatLevel(level);
  const need = needForStatLevel(level);
  return { level, cur: Math.max(0, (Number(pts) || 0) - from), need };
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

/** Базовый Max HP без экипировки (END×15 + баффы). Полный Max — playerMaxHp в equipment. */
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

/** Вчерашний dayKey (локальная полночь). */
export function dayKeyYesterday(today = dayKey()) {
  const [y, m, d] = today.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return dayKey(dt);
}

/** Активность храним 7 дней (локально и в публичном weekly_activity). */
export const ACTIVITY_KEEP_MS = 7 * 24 * 60 * 60 * 1000;
const ACTIVITY_LOG_CAP = 200;
const WEEKLY_ACTIVITY_CAP = 150;

export function pruneActivityLog(log, now = Date.now()) {
  const cutoff = now - ACTIVITY_KEEP_MS;
  return (Array.isArray(log) ? log : [])
    .filter((e) => (Number(e?.ts) || 0) >= cutoff)
    .slice(-ACTIVITY_LOG_CAP);
}

/**
 * Публичная лента за неделю для рейтинга (без инвентаря/сейва).
 * Лёгкий JSON ~несколько КБ на игрока.
 */
export function buildWeeklyActivity(p, now = Date.now()) {
  const log = pruneActivityLog(p?.log, now);
  const out = [];
  for (const e of log) {
    if (e.kind === 'steps' || e.exId === 'steps') {
      out.push({
        ts: e.ts,
        date: e.date,
        kind: 'steps',
        name: 'Шаги',
        amount: e.delta != null ? e.delta : e.amount,
        total: e.total ?? e.amount,
        points: Math.floor(Number(e.points) || 0),
        stat: e.points > 0 ? 'END' : undefined,
      });
      continue;
    }
    const ex = findExercise(e.stat, e.exId, p);
    out.push({
      ts: e.ts,
      date: e.date,
      kind: e.custom ? 'quest' : 'train',
      stat: e.stat,
      name: ex?.name ?? e.exId,
      amount: e.amount,
      unit: ex?.unit ?? '',
      points: Math.floor(Number(e.points) || 0),
    });
  }
  return out.slice(-WEEKLY_ACTIVITY_CAP);
}

/* ---------- состояние игрока ---------- */

const EMPTY_INV = {
  copper_ore: 0,
  iron_ore: 0,
  tin_ore: 0,
  wood: 0,
  hardwood: 0,
  resin: 0,
  wild_herbs: 0,
  moonpetal: 0,
  shadowroot: 0,
  glowcap: 0,
  raw_fish: 0,
  river_mussel: 0,
  kelp: 0,
  raw_hide: 0,
  beast_bone: 0,
  mana_dust: 0,
  void_shard: 0,
  magic_ink: 0,
  cheatmeal_scroll: 0,
  focus_elixir: 0,
  recovery_rune: 0,
  health_potion: 0,
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
    lastHpTick: now,
    hp: null,
    lastDailyReset: dayKey(now),
    palium: 0,
    inscriptionXp: 0,
    cookingSkill: 0,
    craftSkills: { smith: 0, leather: 0, tailor: 0, alchemy: 0, jewel: 0 },
    customRecipes: [],
    customQuests: [],
    activeTitle: 'wanderer',
    pvpRating: 1000,
    pvpRatings: { pushups: 1000, pullups: 1000, legsquats: 1000, abs: 1000 },
    pvpWins: { pushups: 0, pullups: 0, legsquats: 0, abs: 0 },
    notifyDaily: false,
    squadClaim: '',
    achievements: [],
    totals: {},
    buffs: {},
    inventory: { ...EMPTY_INV },
    generatedGear: {},
    vendorStock: null,
    equipment: {
      mainHand: null,
      offHand: null,
      head: null,
      neck: null,
      shoulders: null,
      chest: null,
      wrists: null,
      hands: null,
      waist: null,
      legs: null,
      feet: null,
      finger1: null,
      finger2: null,
      trinket1: null,
      trinket2: null,
    },
    nodeCooldowns: {},
    cookCounts: {},
    steps: { date: dayKey(now), today: 0, bank: 0 },
    lastActiveDate: dayKey(now),
    attendance: { streak: 0, best: 0, lastClosed: '', freeWeek: '', milestones: [] },
    daily: null,
    returnOffer: null,
    bossClaimDate: '',
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
  return { ...result, player: checkAchievements(result.player, events), events };
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
    generatedGear: p.generatedGear && typeof p.generatedGear === 'object' ? p.generatedGear : {},
    vendorStock: p.vendorStock?.offers ? p.vendorStock : null,
    equipment: {
      mainHand: null,
      offHand: null,
      head: null,
      neck: null,
      shoulders: null,
      chest: null,
      wrists: null,
      hands: null,
      waist: null,
      legs: null,
      feet: null,
      finger1: null,
      finger2: null,
      trinket1: null,
      trinket2: null,
      ...(p.equipment ?? {}),
    },
    nodeCooldowns: p.nodeCooldowns ?? {},
    cookCounts: p.cookCounts ?? {},
    customRecipes: p.customRecipes ?? [],
    customQuests: Array.isArray(p.customQuests) ? p.customQuests : [],
    cookingSkill: p.cookingSkill ?? 0,
    craftSkills: {
      smith: Math.max(0, Math.floor(Number(p.craftSkills?.smith) || 0)),
      leather: Math.max(0, Math.floor(Number(p.craftSkills?.leather) || 0)),
      tailor: Math.max(0, Math.floor(Number(p.craftSkills?.tailor) || 0)),
      alchemy: Math.max(0, Math.floor(Number(p.craftSkills?.alchemy) || 0)),
      jewel: Math.max(0, Math.floor(Number(p.craftSkills?.jewel) || 0)),
    },
    inscriptionXp: p.inscriptionXp ?? 0,
    lastApTick: p.lastApTick ?? Date.now(),
    lastHpTick: p.lastHpTick ?? Date.now(),
    hp: p.hp == null ? null : Math.max(0, Math.round(Number(p.hp) || 0)),
    lastDailyReset: p.lastDailyReset ?? '',
    steps: p.steps ?? { date: '', today: 0, bank: 0 },
    lastActiveDate: p.lastActiveDate ?? '',
    attendance: {
      streak: Math.max(0, Math.floor(Number(p.attendance?.streak) || 0)),
      best: Math.max(0, Math.floor(Number(p.attendance?.best) || 0)),
      lastClosed: p.attendance?.lastClosed ?? '',
      freeWeek: p.attendance?.freeWeek ?? '',
      milestones: Array.isArray(p.attendance?.milestones) ? p.attendance.milestones : [],
    },
    daily: p.daily?.date ? p.daily : null,
    returnOffer: p.returnOffer?.date ? p.returnOffer : null,
    bossClaimDate: p.bossClaimDate ?? '',
    hideActivity: Boolean(p.hideActivity),
    pvpRating: Math.max(100, Math.floor(Number(p.pvpRating) || 1000)),
    pvpRatings: pvpRatingsOf(p),
    pvpWins: pvpWinsOf(p),
    notifyDaily: Boolean(p.notifyDaily),
    squadClaim: typeof p.squadClaim === 'string' ? p.squadClaim : '',
    radar: p.radar ?? null,
    breach: p.breach?.active ? p.breach : null,
    world: { gathered: 0, cooked: 0, breaches: 0, breachWins: 0, ...(p.world ?? {}) },
    log: pruneActivityLog(Array.isArray(p.log) ? p.log : []),
    palium: migratePalium(p.palium ?? legacyCopper ?? 0, p.version ?? 0),
    energy: {
      strPoints: 0,
      endPoints: 0,
      apRestored: 0,
      maxApGained: 0,
      ...(p.energy ?? {}),
    },
    totals,
    xp: Math.floor(Number(p.xp) || 0),
    statPoints: {
      STR: Math.floor(Number(p.statPoints?.STR) || 0),
      END: Math.floor(Number(p.statPoints?.END) || 0),
      AGI: Math.floor(Number(p.statPoints?.AGI) || 0),
      INT: Math.floor(Number(p.statPoints?.INT) || 0),
      WIL: Math.floor(Number(p.statPoints?.WIL) || 0),
    },
    jumpropeUnit: 'min',
    updatedAt: Number(p.updatedAt) || 0,
    nameChangedAt: Number(p.nameChangedAt) || 0,
    version: 7,
  };
  delete next.copper;
  delete next.dungeon;
  if (p.jumpropeUnit !== 'min' && next.totals?.jumprope) {
    next.totals = { ...next.totals, jumprope: 0 };
  }
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

function addTotals(totals, _stat, values) {
  const next = { ...totals };
  for (const [id, amount] of Object.entries(values ?? {})) {
    const n = Number(amount) || 0;
    if (n > 0) next[id] = (next[id] ?? 0) + n;
  }
  return next;
}

/** Личный квест Воли: название + опциональное описание. */
export function addCustomQuest(p, { name, desc = '' } = {}) {
  const title = String(name ?? '').trim();
  if (!title) return { error: 'Введите название квеста' };
  if (title.length > 64) return { error: 'Название слишком длинное' };
  const note = String(desc ?? '').trim().slice(0, 120);
  const active = (p.customQuests ?? []).filter((q) => !q.archived);
  if (active.length >= 20) return { error: 'Слишком много квестов (макс. 20)' };
  const quest = {
    id: `cq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: title,
    desc: note,
    createdAt: Date.now(),
    archived: false,
    streak: 0,
    maxStreak: 0,
    lastCompletedDate: null,
    blockedDate: null,
  };
  return {
    player: { ...p, customQuests: [...(p.customQuests ?? []), quest] },
    events: [{ type: 'title', text: `Квест Воли: «${title}»` }],
  };
}

export function removeCustomQuest(p, questId) {
  const list = p.customQuests ?? [];
  if (!list.some((q) => q.id === questId)) return { error: 'Квест не найден' };
  return {
    player: {
      ...p,
      customQuests: list.map((q) => (q.id === questId ? { ...q, archived: true } : q)),
    },
    events: [{ type: 'gain', text: 'Квест скрыт из списка' }],
  };
}

export function isCustomQuestBlocked(q, today = dayKey()) {
  return Boolean(q?.blockedDate && q.blockedDate === today);
}

/** Текущий стрик для UI: обнуляется визуально, если пропущен день. */
export function customQuestStreakView(q, today = dayKey()) {
  const maxStreak = Math.max(0, Number(q?.maxStreak) || 0);
  const stored = Math.max(0, Number(q?.streak) || 0);
  const last = q?.lastCompletedDate ?? null;
  const yesterday = dayKeyYesterday(today);
  const doneToday = last === today;
  const blocked = isCustomQuestBlocked(q, today);
  let current = stored;
  if (!doneToday && last !== yesterday) current = 0;
  if (blocked) current = 0;
  return { current, maxStreak: Math.max(maxStreak, stored), doneToday, blocked };
}

/** Срыв: квест красный и неактивен до 00:00, стрик сбрасывается (рекорд сохраняется). */
export function blockCustomQuest(p, questId) {
  const today = dayKey();
  const list = p.customQuests ?? [];
  const quest = list.find((q) => q.id === questId);
  if (!quest || quest.archived) return { error: 'Квест не найден' };
  if (isCustomQuestBlocked(quest, today)) return { error: 'Срыв уже отмечен сегодня' };
  if (quest.lastCompletedDate === today) {
    return { error: 'Сегодня квест уже выполнен — срыв недоступен' };
  }
  const maxStreak = Math.max(Number(quest.maxStreak) || 0, Number(quest.streak) || 0);
  return {
    player: {
      ...p,
      customQuests: list.map((q) =>
        q.id === questId
          ? { ...q, blockedDate: today, streak: 0, maxStreak }
          : q,
      ),
    },
    events: [{ type: 'error', text: `Срыв: «${quest.name}». Квест заблокирован до завтра. Рекорд стрика: ${maxStreak}` }],
  };
}

function withQuestCompletion(p, questId, today) {
  const list = p.customQuests ?? [];
  const quest = list.find((q) => q.id === questId);
  if (!quest) return p;
  const yesterday = dayKeyYesterday(today);
  const prev = Math.max(0, Number(quest.streak) || 0);
  const nextStreak = quest.lastCompletedDate === yesterday ? prev + 1 : 1;
  const maxStreak = Math.max(Number(quest.maxStreak) || 0, nextStreak);
  return {
    ...p,
    customQuests: list.map((q) =>
      q.id === questId
        ? {
            ...q,
            streak: nextStreak,
            maxStreak,
            lastCompletedDate: today,
            blockedDate: q.blockedDate === today ? null : q.blockedDate,
          }
        : q,
    ),
  };
}

/**
 * Итог дуэли. Победа +20 рейтинга, поражение −15, ничья без изменений.
 * @param {object} p
 * @param {{ outcome: 'win' | 'loss' | 'draw', reps?: number }} result
 */
export function applyPvpResult(p, { outcome, reps = 0, exercise = 'pushups' } = {}) {
  const ex = pvpExercise(exercise);
  const count = Math.max(0, Math.floor(Number(reps) || 0));
  const trained = count > 0 ? applyTraining(p, ex.stat, ex.id, count) : null;
  const base = trained && !trained.error ? trained.player : p;
  const events = trained && !trained.error ? [...(trained.events ?? [])] : [];
  const ratings = pvpRatingsOf(base);
  const delta = outcome === 'win' ? 20 : outcome === 'loss' ? -15 : 0;
  const rating = Math.max(100, ratings[ex.id] + delta);
  ratings[ex.id] = rating;
  const wins = pvpWinsOf(base);
  if (outcome === 'win') wins[ex.id] += 1;
  const text = outcome === 'win'
    ? `Дуэль (${ex.name}) выиграна · рейтинг ${rating}`
    : outcome === 'loss'
      ? `Дуэль (${ex.name}) проиграна · рейтинг ${rating}`
      : `Дуэль (${ex.name}): ничья · рейтинг ${rating}`;
  events.push({ type: outcome === 'loss' ? 'error' : 'title', text });
  const player = checkAchievements({ ...base, pvpRating: ratings.pushups, pvpRatings: ratings, pvpWins: wins }, events);
  return {
    player,
    events,
    ...(trained && !trained.error && trained.daily ? { daily: trained.daily } : {}),
  };
}

/** Разрешить одно напоминание в день. */
export function setNotifyDaily(p, on) {
  const next = Boolean(on);
  return {
    player: { ...p, notifyDaily: next },
    events: [{ type: 'system', text: next ? 'Напоминание Системы включено' : 'Напоминание Системы выключено' }],
  };
}

/** Скрыть от других онлайн и записи тренировок. */
export function setHideActivity(p, hidden) {
  const on = Boolean(hidden);
  return {
    player: { ...p, hideActivity: on },
    events: [{ type: 'system', text: on ? 'Активность скрыта от других игроков' : 'Активность снова видна другим' }],
  };
}

export function equipTitle(p, id) {
  if (!TITLES[id] || !isTitleUnlocked(p, id)) return { error: 'Титул ещё не открыт' };
  return {
    player: { ...p, activeTitle: id },
    events: [{ type: 'title', text: `Экипирован «${titleName(id, p.gender)}»: ${TITLES[id].bonus}` }],
  };
}

/** Прокачка: упражнения без траты AP → XP и статы (без Палиума). rateOverride — для снаряда. */
export function applyTraining(p, stat, exId, amount, rateOverride, now = Date.now()) {
  const ex = findExercise(stat, exId, p);
  if (!ex) return { error: 'Неизвестное упражнение' };
  const customQuest = ex.custom ? (p.customQuests ?? []).find((q) => q.id === exId) : null;
  if (ex.custom && (!customQuest || customQuest.archived)) {
    return { error: 'Квест удалён' };
  }
  const today = dayKey();
  if (ex.custom && isCustomQuestBlocked(customQuest, today)) {
    return { error: 'Квест заблокирован сегодня (срыв). Завтра снова доступен' };
  }
  if (ex.custom && customQuest.lastCompletedDate === today) {
    return { error: 'Квест уже выполнен сегодня' };
  }
  if (ex.loadDifficulty && rateOverride == null) return { error: 'Выберите сложность' };
  const qty = ex.custom ? 1 : amount;
  const base = exercisePoints(ex, qty, rateOverride);
  if (base <= 0) return { error: 'Введите количество' };

  const rawPoints = base * xpMultiplier(p, stat, now);
  const points = floorAwardPoints(rawPoints);
  if (points <= 0) return { error: 'Слишком мало для записи (нужно ≥ 1 pt после округления вниз)' };
  const events = [];
  const prevLevel = levelFromXp(p.xp).level;
  const prevStat = statLevel(p.statPoints[stat]);

  let next = {
    ...p,
    xp: Math.floor((p.xp ?? 0) + points),
    statPoints: {
      ...p.statPoints,
      [stat]: Math.floor((p.statPoints[stat] ?? 0) + points),
    },
    totals: addTotals(p.totals, stat, { [exId]: qty }),
    log: pruneActivityLog([
      ...(p.log ?? []),
      {
        ts: now,
        date: today,
        kind: ex.custom ? 'quest' : 'train',
        stat,
        exId,
        amount: qty,
        points,
        rate: rateOverride ?? ex.rate,
        custom: Boolean(ex.custom),
      },
    ], now),
  };

  if (ex.custom) {
    next = withQuestCompletion(next, exId, today);
    const view = customQuestStreakView(
      (next.customQuests ?? []).find((q) => q.id === exId),
      today,
    );
    events.push({
      type: 'title',
      text: `Стрик «${ex.name}»: ${view.current} дн. · рекорд ${view.maxStreak}`,
    });
  }

  const flooredNote =
    rawPoints > points ? ` (из ${Math.round(rawPoints * 10) / 10} ↓)` : '';
  events.push({
    type: 'gain',
    text: `+${points} ${stat} · +${points} XP${flooredNote}${points > base ? ` · бонус` : ''}`,
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
  return {
    player: next,
    events,
    daily: { action: ex.custom ? 'quest' : 'train', amount: points },
  };
}

/** Несколько упражнений за одну галочку. Строка: { stat, id, amount, rate }. */
export function applyTrainingMany(p, rows) {
  const list = (rows ?? []).filter((row) => row?.stat && row?.id && Number(row.amount) > 0);
  if (!list.length) return { error: 'Введите хотя бы одно упражнение' };
  let player = p;
  const events = [];
  let total = 0;
  let applied = 0;
  const base = Date.now();
  list.forEach((row, i) => {
    const res = applyTraining(player, row.stat, row.id, row.amount, row.rate, base + i);
    if (res.error) {
      events.push({ type: 'error', text: res.error });
      return;
    }
    player = res.player;
    events.push(...(res.events ?? []));
    total += res.daily?.amount ?? 0;
    applied += 1;
  });
  if (!applied) return { error: events.find((e) => e.type === 'error')?.text || 'Ничего не записано' };
  return {
    player,
    events,
    daily: total > 0 ? { action: 'train', amount: total } : undefined,
  };
}

/** Несколько упражнений одного стата за одну запись. */
export function applyTrainingBatch(p, stat, rows) {
  return applyTrainingMany(
    p,
    (rows ?? []).map((row) => ({ ...row, stat: row.stat || stat })),
  );
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
