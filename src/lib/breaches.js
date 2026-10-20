import {
  checkAchievements,
  dayKey,
  floorAwardPoints,
  formatPalium,
  getStats,
  levelFromXp,
  pruneActivityLog,
  statLevel,
  withHp,
  xpMultiplier,
  statMultiplier,
} from './game';
import {
  COMBAT_AP_MAX,
  attackApCost,
  getGearBonuses,
  getPlayerHp,
  mitigateIncoming,
  playerMaxHp,
  rollPlayerAttack,
} from './equipment';
import { ITEMS, emptyInventory } from './world';

/* ---------- ранги брешей ---------- */

export const BREACH_RANKS = {
  F: {
    id: 'F',
    label: 'F-ранг',
    color: '#22c55e',
    ap: 2,
    enemies: 10,
    /** Множители абсолютной силы (не от статов игрока). */
    hpMul: 1.35,
    atkMul: 1.45,
    palium: [0.012, 0.022],
    bonusChance: 0.15,
    bonus: 0.008,
    /** Примерный уровень врагов (для подсказки на радаре). */
    levelMin: 3,
    levelMax: 18,
  },
  E: {
    id: 'E',
    label: 'E-ранг',
    color: '#3b82f6',
    ap: 3,
    enemies: 12,
    hpMul: 1.7,
    atkMul: 1.7,
    palium: [0.02, 0.038],
    bonusChance: 0.22,
    bonus: 0.012,
    levelMin: 14,
    levelMax: 32,
  },
  D: {
    id: 'D',
    label: 'D-ранг',
    color: '#a855f7',
    ap: 4,
    enemies: 15,
    hpMul: 2.15,
    atkMul: 2.0,
    palium: [0.035, 0.07],
    bonusChance: 0.35,
    bonus: 0.022,
    levelMin: 28,
    levelMax: 50,
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
/** v3: персональный радар (сид от игрока), а не общий на всех. */
export const RADAR_VERSION = 3;

export function rankLevelHint(rank) {
  const def = BREACH_RANKS[rank] ?? BREACH_RANKS.F;
  return `Ур. врагов ~${def.levelMin}–${def.levelMax}`;
}

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

function hashStr(key) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Стабильный персональный кусок сида (не сбрасывается сменой имени). */
export function playerRadarSeed(p) {
  const created = p?.createdAt ?? 0;
  const gender = p?.gender ?? 'x';
  return hashStr(`radar|${created}|${gender}`);
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

export function generateRadar(now = Date.now(), p = null) {
  const key = hourKey(now);
  const personal = playerRadarSeed(p);
  const rng = mulberry32(hashStr(`${key}:${personal}`));
  const breaches = [];
  const span = MAX_BREACH_DISTANCE_KM - MIN_BREACH_DISTANCE_KM;
  const tag = personal.toString(36);
  for (let i = 0; i < RADAR_BREACH_COUNT; i++) {
    const rank = pickRank(rng);
    const def = BREACH_RANKS[rank];
    const angle = rng() * Math.PI * 2;
    // Случайная дистанция 0.5–10.0 км с шагом 0.1
    const dist = Math.round((MIN_BREACH_DISTANCE_KM + rng() * span) * 10) / 10;
    const stepsCost = stepsForDistance(dist);
    const radarR = 0.12 + (dist / MAX_BREACH_DISTANCE_KM) * 0.78;
    breaches.push({
      id: `br_${key}_${tag}_${i}`,
      name: breachName(rng),
      rank,
      levelMin: def.levelMin,
      levelMax: def.levelMax,
      stepsCost,
      apCost: def.ap,
      angle,
      distanceKm: dist,
      x: Math.cos(angle) * radarR,
      y: Math.sin(angle) * radarR,
      traveled: false,
    });
  }
  return {
    version: RADAR_VERSION,
    hourKey: key,
    playerSeed: personal,
    generatedAt: now,
    breaches,
  };
}

/** Обновляет радар, если прошёл час, сменилась схема или игрок. */
export function ensureRadar(p, now = Date.now()) {
  const key = hourKey(now);
  const personal = playerRadarSeed(p);
  const cur = p.radar;
  if (
    cur?.version === RADAR_VERSION &&
    cur?.hourKey === key &&
    cur?.playerSeed === personal &&
    Array.isArray(cur.breaches) &&
    cur.breaches.length
  ) {
    return { player: p, changed: false };
  }
  return {
    player: { ...p, radar: generateRadar(now, p) },
    changed: true,
  };
}

/* ---------- банк шагов ---------- */

/** 1000 шагов = 5 END. */
export const STEPS_PER_END_BLOCK = 1000;
export const END_PER_STEPS_BLOCK = 5;

export function emptySteps() {
  return { date: '', today: 0, bank: 0, credited: 0 };
}

/** Синхронизирует дневной ввод: при смене даты today/credited обнуляются, bank сохраняется. */
export function syncStepsDay(p, now = Date.now()) {
  const today = dayKey(now);
  const steps = { ...emptySteps(), ...(p.steps ?? {}) };
  if (steps.date === today) {
    return {
      player: { ...p, steps: { ...steps, credited: Math.max(0, steps.credited ?? 0) } },
      changed: false,
    };
  }
  return {
    player: {
      ...p,
      steps: { date: today, today: 0, bank: Math.max(0, steps.bank ?? 0), credited: 0 },
    },
    changed: true,
  };
}

/** Сколько END даст запись нового значения шагов (без изменения игрока). */
export function previewStepsEnd(p, rawToday) {
  const value = Math.max(0, Math.floor(Number(rawToday) || 0));
  const synced = syncStepsDay(p).player;
  const credited = Math.max(0, synced.steps.credited ?? 0);
  const prevToday = synced.steps.today ?? 0;
  const delta = value - prevToday;
  const newlyCredited = Math.max(0, value - credited);
  const base = (newlyCredited / STEPS_PER_END_BLOCK) * END_PER_STEPS_BLOCK;
  const points = floorAwardPoints(base * xpMultiplier(synced, 'END'));
  return {
    value,
    delta,
    newlyCredited,
    points,
    credited,
  };
}

/**
 * Записать шаги за сегодня.
 * Разница с предыдущим вводом → банк; новые шаги сверх уже засчитанных → END (+ XP).
 */
export function setTodaySteps(p, raw) {
  const value = Math.max(0, Math.floor(Number(raw) || 0));
  const synced = syncStepsDay(p).player;
  const prev = synced.steps.today ?? 0;
  const delta = value - prev;
  const bank = Math.max(0, (synced.steps.bank ?? 0) + delta);
  const credited = Math.max(0, synced.steps.credited ?? 0);
  const newlyCredited = Math.max(0, value - credited);
  const now = Date.now();
  const today = dayKey(now);

  const base = (newlyCredited / STEPS_PER_END_BLOCK) * END_PER_STEPS_BLOCK;
  const points = newlyCredited > 0 ? floorAwardPoints(base * xpMultiplier(synced, 'END', now)) : 0;

  const events = [];
  const prevLevel = levelFromXp(synced.xp).level;
  const prevStat = statLevel(synced.statPoints?.END);

  let next = {
    ...synced,
    steps: {
      ...synced.steps,
      today: value,
      bank,
      credited: credited + newlyCredited,
    },
  };

  if (points > 0) {
    next = {
      ...next,
      xp: Math.floor((next.xp ?? 0) + points),
      statPoints: {
        ...next.statPoints,
        END: Math.floor((next.statPoints?.END ?? 0) + points),
      },
      totals: {
        ...(next.totals ?? {}),
        walk_steps: (next.totals?.walk_steps ?? 0) + newlyCredited,
      },
    };
  }

  if (delta !== 0 || points > 0) {
    next = {
      ...next,
      log: pruneActivityLog(
        [
          ...(next.log ?? []),
          {
            ts: now,
            date: today,
            kind: 'steps',
            exId: 'steps',
            amount: value,
            total: value,
            delta,
            points,
            newlyCredited,
            stat: points > 0 ? 'END' : undefined,
          },
        ],
        now,
      ),
    };
  }

  const stepTxt = `Шаги за сегодня: ${value.toLocaleString('ru-RU')} · банк ${bank.toLocaleString('ru-RU')}`;
  if (points > 0) {
    events.push({
      type: 'gain',
      text: `${stepTxt} · +${newlyCredited.toLocaleString('ru-RU')} шагов → +${points} END`,
    });
  } else if (delta !== 0) {
    events.push({ type: 'gain', text: stepTxt });
  } else {
    return { player: next, events: [] };
  }

  const newStat = statLevel(next.statPoints.END);
  if (points > 0 && newStat > prevStat) {
    events.push({ type: 'stat', text: `Выносливость повышена: ${prevStat} → ${newStat}` });
  }
  const newLevel = levelFromXp(next.xp).level;
  if (points > 0 && newLevel > prevLevel) {
    next = { ...next, ap: next.maxAp };
    events.push({ type: 'level', text: `УРОВЕНЬ ПОВЫШЕН: ${newLevel}! Энергия восстановлена` });
  }

  next = checkAchievements(next, events);
  return {
    player: next,
    events,
    daily: { action: 'steps', amount: Math.max(0, newlyCredited), total: value },
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

/** Уровень угрозы слота в волне (от levelMin к levelMax). Не зависит от игрока. */
function enemyLevelForSlot(rank, index, total) {
  const def = BREACH_RANKS[rank] ?? BREACH_RANKS.F;
  const t = total <= 1 ? 0 : index / (total - 1);
  return def.levelMin + t * (def.levelMax - def.levelMin);
}

/**
 * Враги с абсолютной силой по рангу.
 * Стартовый фулл-сет + STR2 должен проходить F с риском (хилы/блок/отступление), а не фармить на автопилоте.
 */
function makeEnemy(rank, index, total, forced) {
  const def = BREACH_RANKS[rank] ?? BREACH_RANKS.F;
  const isBoss = index >= total - 1;
  const pool = isBoss ? ENEMY_NAMES.filter((e) => e.boss) : ENEMY_NAMES.filter((e) => !e.boss);
  const tpl = forced ?? pool[Math.floor(Math.random() * pool.length)] ?? ENEMY_NAMES[0];
  const level = Math.round(enemyLevelForSlot(rank, index, total));
  // Средние мобы волны чуть жирнее ранних; босс заметно жёстче.
  const waveMul = 1 + (total <= 1 ? 0 : index / (total - 1)) * 0.35;
  const bossMul = isBoss ? 1.85 : 1;
  const hp = Math.max(36, Math.round((30 + level * 6.8) * def.hpMul * waveMul * bossMul));
  const atk = Math.max(8, Math.round((7 + level * 1.45) * def.atkMul * waveMul * bossMul));
  return {
    name: tpl.name,
    emoji: tpl.emoji,
    boss: Boolean(isBoss || tpl.boss),
    rank,
    level,
    hp,
    maxHp: hp,
    atk,
    palium: isBoss ? def.palium.map((v) => Math.round(v * 2.2 * 1000) / 1000) : def.palium,
    bonusChance: isBoss ? Math.min(0.85, def.bonusChance + 0.25) : def.bonusChance,
    bonus: isBoss ? def.bonus * 2 : def.bonus,
  };
}

function buildEnemyWave(rank) {
  const def = BREACH_RANKS[rank] ?? BREACH_RANKS.F;
  const total = Math.max(MIN_BREACH_ENEMIES, def.enemies ?? MIN_BREACH_ENEMIES);
  return Array.from({ length: total }, (_, i) => makeEnemy(rank, i, total));
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

function makeEnemyIntent(enemy) {
  const roll = Math.random();
  if (roll < 0.55) {
    const damage = Math.max(3, enemy.atk + Math.floor(Math.random() * 4) - 1);
    return { type: 'attack', label: 'Атака', icon: '⚔️', damage };
  }
  if (roll < 0.8) {
    const armor = Math.max(2, Math.round(2 + (enemy.level ?? 1) * 0.45));
    return { type: 'defend', label: 'Защита', icon: '🛡️', armor };
  }
  const damage = Math.max(4, Math.round(enemy.atk * 1.4 + 2));
  return { type: 'special', label: 'Спецприём', icon: '⚡', damage };
}

function cloneSession(s) {
  const room = s.room ?? 0;
  const enemies = (s.enemies ?? [s.enemy]).map((e, i) => (i === room ? { ...e } : { ...e }));
  return {
    ...s,
    enemies,
    enemy: enemies[room],
    lootItems: { ...(s.lootItems ?? {}) },
    log: [...(s.log ?? [])],
    room,
  };
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
  const gear = getGearBonuses(ensured);
  const max = playerMaxHp(ensured);
  const cur = getPlayerHp(ensured);
  if (cur <= 0) return { error: 'Слишком мало HP для входа в Брешь' };
  const enemies = buildEnemyWave(breach.rank);
  const first = enemies[0];
  const intent = makeEnemyIntent(first);
  const session = {
    active: true,
    tactical: true,
    breachId: breach.id,
    name: breach.name,
    rank: breach.rank,
    room: 0,
    enemies,
    enemy: first,
    playerHp: cur,
    playerMaxHp: max,
    playerShield: gear.startShield ?? 0,
    playerMaxShield: gear.startShield ?? 0,
    combatAp: COMBAT_AP_MAX,
    turn: 1,
    phase: 'player',
    enemyIntent: intent,
    enemyArmorBuff: 0,
    defendAbsorb: 0,
    stanceReduce: 0,
    trinketUsed: false,
    ui: 'fight',
    lootPalium: 0,
    lootItems: {},
    log: [
      `[СИСТЕМА] Синхронизация с «${breach.name}» (${BREACH_RANKS[breach.rank].label})…`,
      `[СИСТЕМА] Тактический режим. Combat AP: ${COMBAT_AP_MAX} за ход (глобальная энергия не тратится).`,
      `[СИСТЕМА] Цель 1/${enemies.length}: ${first.emoji} ${first.name} · Ур.${first.level} · HP ${first.hp}`,
      `[СИСТЕМА] Намерение врага: ${intent.icon} ${intent.label}${intent.damage != null ? ` (${intent.damage})` : ''}${intent.armor != null ? ` (+${intent.armor} броня)` : ''}`,
      `[СИСТЕМА] Игрок: HP ${cur}/${max} · STR ${stats.STR} · AGI ${stats.AGI} · END ${stats.END} · INT ${stats.INT} · Броня ${gear.armor} · Щит ${gear.startShield}`,
    ],
  };

  return {
    player: {
      ...withHp(ensured, cur, max),
      ap: ensured.ap - breach.apCost,
      breach: session,
      radar: {
        ...ensured.radar,
        breaches: ensured.radar.breaches.filter((b) => b.id !== breachId),
      },
    },
    events: [{ type: 'energy', text: `−${breach.apCost} AP · Вход в Брешь «${breach.name}»` }],
  };
}

function applyPlayerDamageToEnemy(session, dmg) {
  const armor = session.enemyArmorBuff ?? 0;
  const dealt = Math.max(1, dmg - armor);
  session.enemy.hp = Math.max(0, session.enemy.hp - dealt);
  session.enemies[session.room] = session.enemy;
  return dealt;
}

function onEnemyDefeated(p, session) {
  const gain = collectKillLoot(session, session.enemy);
  session.log.push(`[СИСТЕМА] ${session.enemy.name} повержен.`);
  session.ui = 'victory';
  session.victory = {
    name: session.enemy.name,
    gain,
    final: session.room >= session.enemies.length - 1,
  };
  session.phase = 'victory';
  session.defendAbsorb = 0;
  session.stanceReduce = 0;
  const max = playerMaxHp(p);
  return {
    player: { ...withHp(p, session.playerHp, max), breach: session },
    events: [{ type: 'gain', text: `${session.enemy.name} повержен · +${formatPalium(gain)} Палиум` }],
  };
}

/** Атака оружием (тратит Combat AP). */
export function breachCombatStrike(p) {
  const s = p.breach;
  if (!s?.active) return { error: 'Вы не в Бреши' };
  if (s.ui === 'victory') return { error: 'Сначала заберите победу' };
  if (s.phase !== 'player') return { error: 'Сейчас ход врага' };

  const cost = attackApCost(p);
  if ((s.combatAp ?? 0) < cost) return { error: `Нужно ${cost} Combat AP` };

  const session = cloneSession(s);
  session.combatAp -= cost;
  const attack = rollPlayerAttack(p);
  let dmg = attack.dmg;
  const dealt = applyPlayerDamageToEnemy(session, dmg);
  const kind = attack.magic ? 'маг. урон' : 'урон';
  session.log.push(
    `[ХОД ${session.turn}] −${cost} AP · ${attack.label}: ${dealt} ${kind}${attack.crit ? ' · КРИТ' : ''}${session.enemyArmorBuff ? ` (броня врага −${session.enemyArmorBuff})` : ''}.`,
  );

  if (session.enemy.hp <= 0) return onEnemyDefeated(p, session);
  const max = playerMaxHp(p);
  return { player: { ...withHp(p, session.playerHp, max), breach: session }, events: [] };
}

/** Блок щитом / защитная стойка (1 Combat AP). */
export function breachCombatDefend(p) {
  const s = p.breach;
  if (!s?.active) return { error: 'Вы не в Бреши' };
  if (s.ui === 'victory') return { error: 'Сначала заберите победу' };
  if (s.phase !== 'player') return { error: 'Сейчас ход врага' };
  if ((s.combatAp ?? 0) < 1) return { error: 'Нужно 1 Combat AP' };

  const session = cloneSession(s);
  session.combatAp -= 1;
  const gear = getGearBonuses(p);
  const stats = combatStats(p);

  if (gear.hasShield) {
    session.defendAbsorb = (stats.END ?? 1) * 2 + (gear.shieldArmor ?? 0);
    session.stanceReduce = 0;
    session.log.push(`[ХОД ${session.turn}] Блок щитом: поглощение ${session.defendAbsorb}.`);
  } else {
    session.stanceReduce = 0.25;
    session.defendAbsorb = 0;
    session.log.push(`[ХОД ${session.turn}] Защитная стойка: −25% входящего урона.`);
  }
  return { player: { ...p, breach: session }, events: [] };
}

/** Аксессуар «Глаз аномалии» — раз в бой. */
export function breachCombatTrinket(p) {
  const s = p.breach;
  if (!s?.active) return { error: 'Вы не в Бреши' };
  if (s.trinketUsed) return { error: 'Аксессуар уже использован в этом бою' };
  const gear = getGearBonuses(p);
  if (!gear.trinketShield) return { error: 'Нет подходящего аксессуара' };

  const session = cloneSession(s);
  session.trinketUsed = true;
  session.playerShield = (session.playerShield ?? 0) + gear.trinketShield;
  session.playerMaxShield = Math.max(session.playerMaxShield ?? 0, session.playerShield);
  session.log.push(`[ХОД ${session.turn}] Глаз аномалии: +${gear.trinketShield} щита.`);
  return { player: { ...p, breach: session }, events: [{ type: 'energy', text: `+${gear.trinketShield} щита` }] };
}

function resolveEnemyTurn(p, session) {
  const intent = session.enemyIntent ?? makeEnemyIntent(session.enemy);
  const gear = getGearBonuses(p);
  const stats = combatStats(p);

  if (intent.type === 'defend') {
    session.enemyArmorBuff = intent.armor ?? 0;
    session.log.push(`[ВРАГ] ${session.enemy.name}: ${intent.icon} Защита (+${session.enemyArmorBuff} броня до вашего удара).`);
  } else {
    session.enemyArmorBuff = 0;
    let raw = intent.damage ?? session.enemy.atk;
    const dodgeChance = Math.min(0.55, 0.04 + stats.AGI * 0.022 + (gear.dodgeChance ?? 0));
    if (Math.random() < dodgeChance) {
      session.log.push(`[ВРАГ] ${session.enemy.name}: ${intent.icon} ${intent.label} — уклонение!`);
    } else {
      let absorb = session.defendAbsorb ?? 0;
      const mit = mitigateIncoming(p, raw, { stanceReduce: session.stanceReduce ?? 0, absorb });
      absorb = mit.absorbLeft;
      let dmg = mit.damage;
      // сначала щит
      if ((session.playerShield ?? 0) > 0 && dmg > 0) {
        const sh = Math.min(session.playerShield, dmg);
        session.playerShield -= sh;
        dmg -= sh;
        session.log.push(`[ВРАГ] Щит поглотил ${sh}.`);
      }
      session.playerHp = Math.max(0, session.playerHp - dmg);
      session.defendAbsorb = 0;
      session.log.push(
        `[ВРАГ] ${session.enemy.name}: ${intent.icon} ${intent.label} → ${dmg} урона (броня игрока ${mit.armor}${session.stanceReduce ? ', стойка' : ''}).`,
      );
    }
  }

  session.stanceReduce = 0;
  session.defendAbsorb = 0;
  session.enemyIntent = makeEnemyIntent(session.enemy);
  session.combatAp = COMBAT_AP_MAX;
  session.turn += 1;
  session.phase = 'player';
  session.log.push(
    `[СИСТЕМА] Ход ${session.turn}. Combat AP: ${COMBAT_AP_MAX}. Намерение: ${session.enemyIntent.icon} ${session.enemyIntent.label}${session.enemyIntent.damage != null ? ` (${session.enemyIntent.damage})` : ''}`,
  );
}

/** Конец хода игрока → ход врага. */
export function breachCombatEndTurn(p) {
  const s = p.breach;
  if (!s?.active) return { error: 'Вы не в Бреши' };
  if (s.ui === 'victory') return { error: 'Сначала заберите победу' };

  const session = cloneSession(s);
  session.log.push(`[ХОД ${session.turn}] Конец хода.`);
  resolveEnemyTurn(p, session);

  if (session.playerHp <= 0) {
    const keptPalium = Math.round(((Number(session.lootPalium) || 0) / 2) * 1000) / 1000;
    const keptItems = {};
    for (const [id, n] of Object.entries(session.lootItems ?? {})) {
      const keep = Math.ceil(Math.max(0, Number(n) || 0) / 2);
      if (keep > 0) keptItems[id] = keep;
    }
    session.log.push('[СИСТЕМА] Критическая ошибка. Половина лута утеряна.');
    return finishBreach(
      { ...p, breach: { ...session, lootPalium: keptPalium, lootItems: keptItems, playerHp: 0 } },
      { keepLoot: true, cleared: false, defeated: true },
      [
        {
          type: 'error',
          text: `Поражение в Бреши. Сохранена половина лута · ${formatPalium(keptPalium)} Палиум. HP: 1`,
        },
      ],
    );
  }
  const max = playerMaxHp(p);
  return { player: { ...withHp(p, session.playerHp, max), breach: session }, events: [] };
}

/** После окна победы: следующий враг или выход с лутом. */
export function breachCombatContinue(p) {
  const s = p.breach;
  if (!s?.active || s.ui !== 'victory') return { error: 'Нет победы для продолжения' };
  const session = cloneSession(s);
  const final = session.victory?.final;

  if (final) {
    session.log.push(`[СИСТЕМА] Все ${session.enemies.length} угроз нейтрализованы.`);
    return finishBreach({ ...p, breach: session }, { keepLoot: true, cleared: true }, [
      { type: 'level', text: `Брешь «${session.name}» зачищена!` },
    ]);
  }

  session.room += 1;
  session.enemy = session.enemies[session.room];
  session.enemyIntent = makeEnemyIntent(session.enemy);
  session.enemyArmorBuff = 0;
  session.ui = 'fight';
  session.phase = 'player';
  session.victory = null;
  session.combatAp = COMBAT_AP_MAX;
  session.defendAbsorb = 0;
  session.stanceReduce = 0;
  session.log.push(
    `[СИСТЕМА] Следующая цель ${session.room + 1}/${session.enemies.length}: ${session.enemy.emoji} ${session.enemy.name} · Ур.${session.enemy.level}`,
  );
  session.log.push(
    `[СИСТЕМА] Намерение: ${session.enemyIntent.icon} ${session.enemyIntent.label}${session.enemyIntent.damage != null ? ` (${session.enemyIntent.damage})` : ''}`,
  );
  return { player: { ...p, breach: session }, events: [] };
}

/** Совместимость: старая кнопка «Атаковать». */
export function breachAttack(p) {
  return breachCombatStrike(p);
}

/** Выход: забираете уже полученный лут, Брешь закрывается. */
export function breachFlee(p) {
  if (!p.breach?.active) return { error: 'Вы не в Бреши' };
  const session = {
    ...p.breach,
    log: [...p.breach.log, '[СИСТЕМА] Экстренный выход. Накопленный лут сохранён. Брешь закрыта.'],
  };
  const max = playerMaxHp(p);
  const hpLeft = Math.max(0, session.playerHp ?? 0);
  return finishBreach({ ...p, breach: session }, { keepLoot: true, cleared: false, defeated: false }, [
    {
      type: 'gain',
      text: `Выход из Бреши · HP ${hpLeft}/${max} · лут +${formatPalium(session.lootPalium)} Палиум`,
    },
  ]);
}

function finishBreach(p, { keepLoot, cleared, defeated = false }, events) {
  const session = p.breach;
  let inv = { ...(p.inventory ?? emptyInventory()) };
  const lootPalium = keepLoot ? session.lootPalium : 0;
  const lootItems = keepLoot ? session.lootItems : {};
  const max = playerMaxHp(p);

  for (const [id, n] of Object.entries(lootItems)) {
    inv[id] = (inv[id] ?? 0) + n;
    const item = ITEMS[id];
    events.push({ type: 'title', text: `Лут: ${item?.name ?? id} ×${n}` });
  }

  // Смерть → 1 HP в статусе; иначе сохраняем HP из боя.
  const outHp = defeated ? 1 : Math.max(1, Math.min(max, Math.round(session.playerHp ?? max)));

  const next = withHp(
    {
      ...p,
      palium: addPalium(p.palium, lootPalium),
      inventory: inv,
      breach: null,
      lastHpTick: Date.now(),
      world: {
        ...(p.world ?? {}),
        breaches: (p.world?.breaches ?? 0) + 1,
        breachWins: (p.world?.breachWins ?? 0) + (cleared ? 1 : 0),
      },
    },
    outHp,
    max,
  );

  if (cleared) {
    events.push({
      type: 'level',
      text: `Брешь «${session.name}» закрыта! HP ${outHp}/${max} · +${formatPalium(lootPalium)} Палиум`,
    });
  } else if (defeated) {
    events.push({ type: 'error', text: `Статус: HP ${outHp}/${max}` });
  } else if (keepLoot) {
    events.push({ type: 'energy', text: `Брешь «${session.name}» закрыта · HP ${outHp}/${max}` });
  }

  const breachReward = cleared
    ? {
        name: session.name,
        palium: lootPalium,
        items: Object.entries(lootItems).map(([id, count]) => ({
          id,
          count,
          name: ITEMS[id]?.name ?? id,
          emoji: ITEMS[id]?.emoji ?? '📦',
        })),
      }
    : null;

  return {
    player: next,
    events,
    ...(breachReward ? { breachReward } : {}),
    ...(cleared ? { daily: { action: 'breach', amount: 1 } } : {}),
  };
}

export function formatSteps(n) {
  return Math.max(0, Math.floor(n || 0)).toLocaleString('ru-RU');
}
