import { damageMultiplier, dayKey, formatPalium, getStats, maxHp, statMultiplier } from './game';
import { ITEMS, emptyInventory } from './world';

/* ---------- ранги брешей ---------- */

export const BREACH_RANKS = {
  F: {
    id: 'F',
    label: 'F-ранг',
    color: '#22c55e',
    ap: 2,
    enemies: 10,
    hpMul: 0.85,
    atkMul: 0.8,
    palium: [0.012, 0.022],
    bonusChance: 0.15,
    bonus: 0.008,
  },
  E: {
    id: 'E',
    label: 'E-ранг',
    color: '#3b82f6',
    ap: 3,
    enemies: 12,
    hpMul: 1.15,
    atkMul: 1.05,
    palium: [0.02, 0.038],
    bonusChance: 0.22,
    bonus: 0.012,
  },
  D: {
    id: 'D',
    label: 'D-ранг',
    color: '#a855f7',
    ap: 4,
    enemies: 15,
    hpMul: 1.55,
    atkMul: 1.35,
    palium: [0.035, 0.07],
    bonusChance: 0.35,
    bonus: 0.022,
  },
};

export const MIN_BREACH_ENEMIES = 10;
/** 1 км = 1000 шагов; дистанция на радаре до 10 км. */
export const STEPS_PER_KM = 1000;
export const MAX_BREACH_DISTANCE_KM = 10;
export const MIN_BREACH_DISTANCE_KM = 0.5;

export function stepsForDistance(km) {
  return Math.max(0, Math.round(Number(km) * STEPS_PER_KM));
}

const RANK_WEIGHTS = [
  { rank: 'F', w: 50 },
  { rank: 'E', w: 35 },
  { rank: 'D', w: 15 },
];

const NAME_PREFIX = [
  'Теневая',
  'Пепельная',
  'Кровавая',
  'Пустотная',
  'Ледяная',
  'Искажённая',
  'Шёпотная',
  'Ржавая',
  'Зеркальная',
  'Гнилая',
];
const NAME_SUFFIX = [
  'Брешь',
  'Трещина',
  'Скважина',
  'Врата',
  'Пропасть',
  'Щель',
  'Аномалия',
  'Сингулярность',
];
const ENEMY_NAMES = [
  { name: 'Теневой ползун', emoji: '🕷️' },
  { name: 'Осколок Воли', emoji: '💠' },
  { name: 'Голодный страж', emoji: '👺' },
  { name: 'Пепельный волк', emoji: '🐺' },
  { name: 'Шёпот Бездны', emoji: '👻' },
  { name: 'Ржавый голем', emoji: '🤖' },
  { name: 'Клык Пустоты', emoji: '🦷' },
  { name: 'Искажённый охотник', emoji: '🗡️' },
  { name: 'Пепельная личинка', emoji: '🐛' },
  { name: 'Сторож Трещины', emoji: '👁️' },
  { name: 'Костяной вестник', emoji: '💀' },
  { name: 'Туманный клинок', emoji: '⚔️' },
  { name: 'Гнилой страж', emoji: '🧟' },
  { name: 'Искра Сингулярности', emoji: '✨' },
  { name: 'Хозяин Бреши', emoji: '👹', boss: true },
];

export const RADAR_REFRESH_MS = 60 * 60 * 1000;
export const RADAR_BREACH_COUNT = 5;
export const RADAR_VERSION = 2;

export function hourKey(now = Date.now()) {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}`;
}

export function msUntilRadarRefresh(now = Date.now()) {
  const d = new Date(now);
  const next = new Date(d);
  next.setMinutes(0, 0, 0);
  next.setHours(d.getHours() + 1);
  return next.getTime() - now;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashHour(key) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickRank(rng) {
  const total = RANK_WEIGHTS.reduce((s, x) => s + x.w, 0);
  let roll = rng() * total;
  for (const row of RANK_WEIGHTS) {
    roll -= row.w;
    if (roll <= 0) return row.rank;
  }
  return 'F';
}

function breachName(rng) {
  const a = NAME_PREFIX[Math.floor(rng() * NAME_PREFIX.length)];
  const b = NAME_SUFFIX[Math.floor(rng() * NAME_SUFFIX.length)];
  return `${a} ${b}`;
}

export function generateRadar(now = Date.now()) {
  const key = hourKey(now);
  const rng = mulberry32(hashHour(key));
  const breaches = [];
  const span = MAX_BREACH_DISTANCE_KM - MIN_BREACH_DISTANCE_KM;
  for (let i = 0; i < RADAR_BREACH_COUNT; i++) {
    const rank = pickRank(rng);
    const def = BREACH_RANKS[rank];
    const angle = rng() * Math.PI * 2;
    // Случайная дистанция 0.5–10.0 км с шагом 0.1
    const dist = Math.round((MIN_BREACH_DISTANCE_KM + rng() * span) * 10) / 10;
    const stepsCost = stepsForDistance(dist);
    const radarR = 0.12 + (dist / MAX_BREACH_DISTANCE_KM) * 0.78;
    breaches.push({
      id: `br_${key}_${i}`,
      name: breachName(rng),
      rank,
      stepsCost,
      apCost: def.ap,
      angle,
      distanceKm: dist,
      x: Math.cos(angle) * radarR,
      y: Math.sin(angle) * radarR,
      traveled: false,
    });
  }
  return { version: RADAR_VERSION, hourKey: key, generatedAt: now, breaches };
}

/** Обновляет радар, если прошёл час или сменилась схема. */
export function ensureRadar(p, now = Date.now()) {
  const key = hourKey(now);
  const cur = p.radar;
  if (
    cur?.version === RADAR_VERSION &&
    cur?.hourKey === key &&
    Array.isArray(cur.breaches) &&
    cur.breaches.length
  ) {
    return { player: p, changed: false };
  }
  return {
    player: { ...p, radar: generateRadar(now) },
    changed: true,
  };
}

/* ---------- банк шагов ---------- */

export function emptySteps() {
  return { date: '', today: 0, bank: 0 };
}

/** Синхронизирует дневной ввод: при смене даты today обнуляется, bank сохраняется. */
export function syncStepsDay(p, now = Date.now()) {
  const today = dayKey(now);
  const steps = { ...emptySteps(), ...(p.steps ?? {}) };
  if (steps.date === today) return { player: { ...p, steps }, changed: false };
  return {
    player: { ...p, steps: { date: today, today: 0, bank: Math.max(0, steps.bank ?? 0) } },
    changed: true,
  };
}

/**
 * Записать шаги за сегодня.
 * Разница с предыдущим вводом добавляется (или вычитается) из банка.
 */
export function setTodaySteps(p, raw) {
  const value = Math.max(0, Math.floor(Number(raw) || 0));
  const synced = syncStepsDay(p).player;
  const prev = synced.steps.today ?? 0;
  const delta = value - prev;
  const bank = Math.max(0, (synced.steps.bank ?? 0) + delta);
  return {
    player: {
      ...synced,
      steps: { ...synced.steps, today: value, bank },
    },
    events: [{ type: 'gain', text: `Шаги за сегодня: ${value.toLocaleString('ru-RU')} · банк ${bank.toLocaleString('ru-RU')}` }],
  };
}

/* ---------- переход / вход ---------- */

export function travelToBreach(p, breachId) {
  const ensured = ensureRadar(syncStepsDay(p).player).player;
  const list = ensured.radar?.breaches ?? [];
  const idx = list.findIndex((b) => b.id === breachId);
  if (idx < 0) return { error: 'Брешь не обнаружена на радаре' };
  const breach = list[idx];
  if (breach.traveled) return { error: 'Переход уже совершён' };
  if ((ensured.steps?.bank ?? 0) < breach.stepsCost) {
    return { error: `Недостаточно шагов. Нужно ${breach.stepsCost.toLocaleString('ru-RU')}` };
  }

  const nextBreaches = list.map((b, i) => (i === idx ? { ...b, traveled: true } : b));
  return {
    player: {
      ...ensured,
      steps: { ...ensured.steps, bank: ensured.steps.bank - breach.stepsCost },
      radar: { ...ensured.radar, breaches: nextBreaches },
    },
    events: [
      {
        type: 'energy',
        text: `Переход к «${breach.name}» (−${breach.stepsCost.toLocaleString('ru-RU')} шагов)`,
      },
    ],
  };
}

function combatStats(p) {
  const raw = getStats(p);
  const m = statMultiplier(p);
  if (m >= 1) return raw;
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Math.max(1, Math.round(v * m))]));
}

function rollPalium([a, b]) {
  return Math.round((a + Math.random() * (b - a)) * 1000) / 1000;
}

function addPalium(a, b) {
  return Math.round(((a ?? 0) + (b ?? 0)) * 1000) / 1000;
}

function makeEnemy(rank, stats, index, total, forced) {
  const def = BREACH_RANKS[rank] ?? BREACH_RANKS.F;
  const isBoss = index >= total - 1;
  const pool = isBoss ? ENEMY_NAMES.filter((e) => e.boss) : ENEMY_NAMES.filter((e) => !e.boss);
  const tpl = forced ?? pool[Math.floor(Math.random() * pool.length)] ?? ENEMY_NAMES[0];
  const scale = 0.7 + (index / Math.max(1, total - 1)) * 0.55;
  const bossMul = isBoss ? 1.45 : 1;
  const hp = Math.max(10, Math.round((8 + stats.END * 4 * def.hpMul) * scale * bossMul));
  const atk = Math.max(2, Math.round((2 + stats.STR * 0.3 + stats.END * 0.22 * def.atkMul) * scale * bossMul));
  return {
    name: tpl.name,
    emoji: tpl.emoji,
    boss: Boolean(isBoss || tpl.boss),
    rank,
    hp,
    maxHp: hp,
    atk,
    palium: isBoss ? def.palium.map((v) => Math.round(v * 2.2 * 1000) / 1000) : def.palium,
    bonusChance: isBoss ? Math.min(0.85, def.bonusChance + 0.25) : def.bonusChance,
    bonus: isBoss ? def.bonus * 2 : def.bonus,
  };
}

function buildEnemyWave(rank, stats) {
  const def = BREACH_RANKS[rank] ?? BREACH_RANKS.F;
  const total = Math.max(MIN_BREACH_ENEMIES, def.enemies ?? MIN_BREACH_ENEMIES);
  return Array.from({ length: total }, (_, i) => makeEnemy(rank, stats, i, total));
}

function collectKillLoot(session, enemy) {
  let gain = rollPalium(enemy.palium);
  if (Math.random() < enemy.bonusChance) gain = addPalium(gain, enemy.bonus);
  session.lootPalium = addPalium(session.lootPalium, gain);
  session.log.push(`[СИСТЕМА] ${enemy.name} нейтрализован. Начисление: +${formatPalium(gain)} Палиум.`);

  const lootChance = enemy.boss ? 0.35 : session.rank === 'D' ? 0.12 : session.rank === 'E' ? 0.08 : 0.05;
  if (Math.random() < lootChance) {
    session.lootItems.cheatmeal_scroll = (session.lootItems.cheatmeal_scroll ?? 0) + 1;
    session.log.push('[СИСТЕМА] Обнаружен артефакт: Свиток Читмила.');
  }
  if (enemy.boss && session.rank === 'D' && Math.random() < 0.22) {
    session.lootItems.focus_elixir = (session.lootItems.focus_elixir ?? 0) + 1;
    session.log.push('[СИСТЕМА] Обнаружен артефакт: Эликсир Фокуса.');
  }
  if (Math.random() < (enemy.boss ? 0.2 : 0.06)) {
    session.lootItems.recovery_rune = (session.lootItems.recovery_rune ?? 0) + 1;
    session.log.push('[СИСТЕМА] Обнаружен артефакт: Руна Восстановления.');
  }
  return gain;
}

export function enterBreach(p, breachId) {
  if (p.breach?.active) return { error: 'Вы уже внутри Бреши' };

  const ensured = ensureRadar(syncStepsDay(p).player).player;
  const breach = (ensured.radar?.breaches ?? []).find((b) => b.id === breachId);
  if (!breach) return { error: 'Брешь исчезла с радара' };
  if (!breach.traveled) return { error: 'Сначала совершите переход' };
  if (ensured.ap < breach.apCost) {
    return { error: `Недостаточно AP. Нужно ${breach.apCost}` };
  }

  const stats = combatStats(ensured);
  const hp = Math.max(1, Math.round(maxHp(ensured) * statMultiplier(ensured)));
  const enemies = buildEnemyWave(breach.rank, stats);
  const first = enemies[0];
  const session = {
    active: true,
    breachId: breach.id,
    name: breach.name,
    rank: breach.rank,
    room: 0,
    enemies,
    enemy: first,
    playerHp: hp,
    playerMaxHp: hp,
    turn: 0,
    lootPalium: 0,
    lootItems: {},
    log: [
      `[СИСТЕМА] Синхронизация с «${breach.name}» (${BREACH_RANKS[breach.rank].label})…`,
      `[СИСТЕМА] Обнаружено угроз: ${enemies.length}. Зачистка обязательна.`,
      `[СИСТЕМА] Цель 1/${enemies.length}: ${first.emoji} ${first.name} · HP ${first.hp}`,
      `[СИСТЕМА] Параметры Игрока: Сила ${stats.STR} · Ловкость ${stats.AGI} · Выносливость ${stats.END}`,
    ],
  };

  return {
    player: {
      ...ensured,
      ap: ensured.ap - breach.apCost,
      breach: session,
      // Брешь снимается с радара при входе — после выхода уже не вернётся.
      radar: {
        ...ensured.radar,
        breaches: ensured.radar.breaches.filter((b) => b.id !== breachId),
      },
    },
    events: [{ type: 'energy', text: `−${breach.apCost} AP · Вход в Брешь «${breach.name}» (${enemies.length} врагов)` }],
  };
}

function dodgeChance(agi) {
  return Math.min(0.45, 0.08 + agi * 0.035);
}

export function breachAttack(p) {
  const s = p.breach;
  if (!s?.active) return { error: 'Вы не в Бреши' };

  const stats = combatStats(p);
  const enemies = (s.enemies ?? [s.enemy]).map((e, i) => (i === (s.room ?? 0) ? { ...e } : { ...e }));
  const room = s.room ?? 0;
  const session = {
    ...s,
    enemies,
    enemy: enemies[room],
    lootItems: { ...s.lootItems },
    log: [...s.log],
    turn: s.turn + 1,
    room,
  };

  const strDmg = Math.max(
    1,
    Math.floor((3 + stats.STR * 2.5 + Math.floor(Math.random() * (2 + stats.STR))) * damageMultiplier(p)),
  );
  session.enemy.hp = Math.max(0, session.enemy.hp - strDmg);
  enemies[room] = session.enemy;
  session.log.push(`[ХОД ${session.turn}] Атака нанесла ${strDmg} урона на основе Силы.`);

  if (session.enemy.hp <= 0) {
    const gain = collectKillLoot(session, session.enemy);
    const events = [{ type: 'gain', text: `${session.enemy.name} повержен · +${formatPalium(gain)} Палиум` }];

    if (session.room >= enemies.length - 1) {
      session.log.push(`[СИСТЕМА] Все ${enemies.length} угроз нейтрализованы. Брешь стабилизирована.`);
      return finishBreach({ ...p, breach: session }, { keepLoot: true, cleared: true }, events);
    }

    session.room += 1;
    session.enemy = enemies[session.room];
    const tag = session.enemy.boss ? ' · ХОЗЯИН' : '';
    session.log.push(
      `[СИСТЕМА] Следующая цель ${session.room + 1}/${enemies.length}${tag}: ${session.enemy.emoji} ${session.enemy.name}`,
    );
    return { player: { ...p, breach: session }, events };
  }

  const dodge = Math.random() < dodgeChance(stats.AGI);
  if (dodge) {
    session.log.push(`[ХОД ${session.turn}] Уклонение на основе Ловкости. Урон врага = 0.`);
  } else {
    const edmg = Math.max(1, session.enemy.atk + Math.floor(Math.random() * 3) - 1);
    session.playerHp = Math.max(0, session.playerHp - edmg);
    session.log.push(`[ХОД ${session.turn}] ${session.enemy.name} наносит ${edmg} урона.`);
  }

  if (session.playerHp <= 0) {
    session.log.push('[СИСТЕМА] Критическая ошибка. Сознание Игрока отключено. Лут утерян.');
    return finishBreach({ ...p, breach: { ...session, lootPalium: 0, lootItems: {} } }, { keepLoot: false, cleared: false }, [
      { type: 'error', text: 'Поражение в Бреши. Лут потерян.' },
    ]);
  }

  return { player: { ...p, breach: session }, events: [] };
}

/** Выход: забираете уже полученный лут, Брешь закрывается. */
export function breachFlee(p) {
  if (!p.breach?.active) return { error: 'Вы не в Бреши' };
  const session = {
    ...p.breach,
    log: [...p.breach.log, '[СИСТЕМА] Экстренный выход. Накопленный лут сохранён. Брешь закрыта.'],
  };
  return finishBreach({ ...p, breach: session }, { keepLoot: true, cleared: false }, [
    {
      type: 'gain',
      text: `Выход из Бреши · лут сохранён (+${formatPalium(session.lootPalium)} Палиум)`,
    },
  ]);
}

function finishBreach(p, { keepLoot, cleared }, events) {
  const session = p.breach;
  let inv = { ...(p.inventory ?? emptyInventory()) };
  const lootPalium = keepLoot ? session.lootPalium : 0;
  const lootItems = keepLoot ? session.lootItems : {};

  for (const [id, n] of Object.entries(lootItems)) {
    inv[id] = (inv[id] ?? 0) + n;
    const item = ITEMS[id];
    events.push({ type: 'title', text: `Лут: ${item?.name ?? id} ×${n}` });
  }

  const next = {
    ...p,
    palium: addPalium(p.palium, lootPalium),
    inventory: inv,
    breach: null,
    world: {
      ...(p.world ?? {}),
      breaches: (p.world?.breaches ?? 0) + 1,
      breachWins: (p.world?.breachWins ?? 0) + (cleared ? 1 : 0),
    },
  };

  if (cleared) {
    events.push({ type: 'level', text: `Брешь «${session.name}» закрыта! +${formatPalium(lootPalium)} Палиум` });
  } else if (keepLoot) {
    events.push({ type: 'energy', text: `Брешь «${session.name}» закрыта после выхода` });
  }

  return { player: next, events };
}

export function formatSteps(n) {
  return Math.max(0, Math.floor(n || 0)).toLocaleString('ru-RU');
}
