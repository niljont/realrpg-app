import { bagFreeSlots } from './equipment';
import { addPalium, checkAchievements, dayKey, formatPalium, levelFromXp } from './game';
import { rollGeneratedItem } from './loot';
import { supabase } from './supabase';

const TASK_POOL = [
  { id: 'train', title: 'Тренировка', detail: 'Запиши любой подход', goal: 1 },
  { id: 'quest', title: 'Квест Воли', detail: 'Выполни личный квест', goal: 1 },
  { id: 'steps', title: 'Шаги', detail: '3 000 шагов за сегодня', goal: 3000 },
  { id: 'gather', title: 'Сбор', detail: 'Собери ресурс в мире', goal: 1 },
  { id: 'breach', title: 'Брешь', detail: 'Закрой брешь победой', goal: 1 },
  { id: 'craft', title: 'Ремесло', detail: 'Создай предмет', goal: 1 },
];

const MILESTONES = [3, 7, 14];
const BOSS_HP = 450;
const BOSS_NAMES = ['Страж порога', 'Железный колосс', 'Теневой зверь', 'Рой аномалии', 'Костяной великан', 'Пепельный титан'];

function hashStr(key) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function daysBetween(from, to) {
  if (!from || !to) return 999;
  const [ay, am, ad] = from.split('-').map(Number);
  const [by, bm, bd] = to.split('-').map(Number);
  const a = Date.UTC(ay, am - 1, ad);
  const b = Date.UTC(by, bm - 1, bd);
  return Math.round((b - a) / 86400000);
}

export function weekKey(today) {
  const [y, m, d] = today.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const mondayOffset = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - mondayOffset);
  return dayKey(dt);
}

function pickTasks(seed) {
  const pool = [...TASK_POOL];
  let h = hashStr(seed);
  const out = [];
  while (out.length < 3 && pool.length) {
    const index = h % pool.length;
    const [task] = pool.splice(index, 1);
    out.push({ ...task, progress: 0, done: false });
    h = Math.imul(h ^ 0x9e3779b9, 16777619) >>> 0;
  }
  return out;
}

export function emptyAttendance() {
  return { streak: 0, best: 0, lastClosed: '', freeWeek: '', milestones: [] };
}

export const BOSS_REASONS = {
  train: 'Тренировка',
  quest: 'Квест Воли',
  steps: 'Шаги',
  gather: 'Сбор',
  breach: 'Брешь',
  craft: 'Ремесло',
};

export function bossReasonLabel(reason) {
  return BOSS_REASONS[reason] || 'Удар';
}

function bossTitle(day) {
  return BOSS_NAMES[hashStr(`boss|${day}`) % BOSS_NAMES.length];
}

export function bossDamageFor(action, amount) {
  const n = Math.max(0, Number(amount) || 0);
  if (action === 'train' || action === 'quest') return Math.min(120, Math.max(8, Math.round(n)));
  if (action === 'steps') return Math.min(80, Math.round(n / 80));
  if (action === 'gather') return 25;
  if (action === 'breach') return 70;
  if (action === 'craft') return 20;
  return 0;
}

export function ensureDaily(p, now = Date.now()) {
  if (!p) return { player: p, changed: false, events: [] };
  const today = dayKey(now);
  let next = p;
  let changed = false;
  const events = [];

  if (!next.lastActiveDate) {
    next = { ...next, lastActiveDate: today };
    changed = true;
  }

  if (next.daily?.date !== today) {
    const tasks = pickTasks(`${today}:${next.createdAt ?? next.name ?? ''}`);
    const stepsToday = next.steps?.date === today ? next.steps.today ?? 0 : 0;
    next = {
      ...next,
      daily: {
        date: today,
        claimed: false,
        tasks: tasks.map((task) => {
          if (task.id !== 'steps' || stepsToday <= 0) return task;
          const progress = stepsToday;
          return { ...task, progress, done: progress >= task.goal };
        }),
      },
    };
    changed = true;
  }

  const gap = daysBetween(next.lastActiveDate, today);
  if (gap >= 2 && next.returnOffer?.date !== today) {
    next = { ...next, returnOffer: { date: today, gap, done: false, claimed: false } };
    events.push({ type: 'title', text: `Система заметила отсутствие (${gap} дн.). На статусе ждёт лёгкое дело.` });
    changed = true;
  }

  return { player: next, changed, events };
}

function touchActive(p, today) {
  return { ...p, lastActiveDate: today };
}

function markTasks(tasks, action, total) {
  const keys = action === 'quest' ? ['quest', 'train'] : [action];
  return (tasks ?? []).map((task) => {
    if (task.done || !keys.includes(task.id)) return task;
    if (task.id === 'steps') {
      const progress = Math.max(task.progress ?? 0, total ?? 0);
      return { ...task, progress, done: progress >= task.goal };
    }
    return { ...task, progress: 1, done: true };
  });
}

export function applyDailyProgress(p, payload, now = Date.now()) {
  const ensured = ensureDaily(p, now).player;
  const today = dayKey(now);
  const action = payload?.action;
  if (!action) return { player: ensured, events: [], bossDamage: 0 };

  let next = touchActive(ensured, today);
  next = {
    ...next,
    daily: {
      ...next.daily,
      tasks: markTasks(next.daily?.tasks, action, payload.total ?? payload.amount),
    },
  };

  if (next.returnOffer?.date === today && !next.returnOffer.claimed && !next.returnOffer.done) {
    const easyTrain = action === 'train' || action === 'quest';
    const easySteps = action === 'steps' && (payload.total ?? 0) >= 1000;
    if (easyTrain || easySteps) next = { ...next, returnOffer: { ...next.returnOffer, done: true } };
  }

  return { player: next, events: [], bossDamage: bossDamageFor(action, payload.amount) };
}

function giveChest(p, { palium, rareChance = 0, uncommonChance = 0.35 }) {
  const events = [];
  let player = { ...p, palium: addPalium(p.palium, palium) };
  events.push({ type: 'gain', text: `+${formatPalium(palium)} Палиум` });
  if (bagFreeSlots(player) < 1) {
    events.push({ type: 'title', text: 'Сундук не открыт: нет места в сумке' });
    return { player, events };
  }
  const roll = Math.random();
  const quality = roll < rareChance ? 'rare' : roll < rareChance + uncommonChance ? 'uncommon' : 'common';
  const level = Math.max(1, levelFromXp(player.xp ?? 0).level);
  const item = rollGeneratedItem(Math.random, level, quality);
  if (!item) return { player, events };
  item.id = `gen_c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  item.desc = `${item.desc} Награда Системы.`;
  player = {
    ...player,
    inventory: { ...(player.inventory ?? {}), [item.id]: 1 },
    generatedGear: { ...(player.generatedGear ?? {}), [item.id]: item },
  };
  events.push({ type: 'title', text: `Сундук: ${item.name}` });
  return { player, events };
}

export function contractReady(p) {
  const tasks = p?.daily?.tasks ?? [];
  return tasks.length > 0 && tasks.every((task) => task.done) && !p.daily.claimed;
}

export function claimContract(p, now = Date.now()) {
  const today = dayKey(now);
  const ensured = ensureDaily(p, now).player;
  if (ensured.daily?.date !== today) return { error: 'Контракт ещё обновляется' };
  if (!contractReady(ensured)) return { error: 'Контракт ещё не закрыт' };

  const prev = { ...emptyAttendance(), ...(ensured.attendance ?? {}) };
  const yesterdayGap = daysBetween(prev.lastClosed, today);
  let streak = 1;
  let freeWeek = prev.freeWeek || '';
  let usedFree = false;
  let milestones = [];
  if (prev.lastClosed === today) {
    streak = prev.streak || 1;
    milestones = prev.milestones ?? [];
  } else if (yesterdayGap === 1) {
    streak = (prev.streak || 0) + 1;
    milestones = prev.milestones ?? [];
  } else if (yesterdayGap === 2 && freeWeek !== weekKey(today)) {
    streak = (prev.streak || 0) + 1;
    freeWeek = weekKey(today);
    usedFree = true;
    milestones = prev.milestones ?? [];
  }

  const best = Math.max(prev.best || 0, streak);
  const attendance = { streak, best, lastClosed: today, freeWeek, milestones: [...milestones] };
  let player = {
    ...ensured,
    daily: { ...ensured.daily, claimed: true },
    attendance,
    lastActiveDate: today,
    world: { ...(ensured.world ?? {}), contracts: (ensured.world?.contracts ?? 0) + 1 },
  };
  const events = [{ type: 'title', text: usedFree ? `Серия явки: ${streak} дн. Свободный день сохранён.` : `Серия явки: ${streak} дн.` }];

  const chest = giveChest(player, { palium: 0.08, uncommonChance: 0.4 });
  player = chest.player;
  events.push(...chest.events);

  for (const mark of MILESTONES) {
    if (streak >= mark && !attendance.milestones.includes(mark)) {
      attendance.milestones.push(mark);
      const bonus = giveChest(player, {
        palium: mark === 14 ? 0.2 : mark === 7 ? 0.12 : 0.06,
        uncommonChance: mark >= 7 ? 0.7 : 0.45,
        rareChance: mark === 14 ? 0.25 : 0,
      });
      player = bonus.player;
      events.push({ type: 'title', text: `Награда серии: ${mark} дней` }, ...bonus.events);
    }
  }

  player = { ...player, attendance };
  const sealed = checkAchievements(player, events);
  return { player: sealed, events };
}

export function claimReturn(p, now = Date.now()) {
  const today = dayKey(now);
  const offer = p?.returnOffer;
  if (!offer || offer.date !== today) return { error: 'Сейчас нет дела на возвращение' };
  if (offer.claimed) return { error: 'Награда уже получена' };
  if (!offer.done) return { error: 'Сначала тренировка или 1 000 шагов' };
  const chest = giveChest(p, { palium: 0.06, uncommonChance: 0.35 });
  const events = [{ type: 'title', text: 'Возвращение принято' }, ...chest.events];
  const player = { ...chest.player, returnOffer: { ...offer, claimed: true } };
  return { player: checkAchievements(player, events), events };
}

export function claimBossReward(p, boss, now = Date.now()) {
  const today = dayKey(now);
  if (!boss || boss.day !== today) return { error: 'Босс дня ещё не загружен' };
  if ((boss.hp ?? 1) > 0) return { error: 'Босс ещё жив' };
  if ((boss.mine ?? 0) <= 0) return { error: 'Нужен хотя бы один удар по боссу' };
  if (p?.bossClaimDate === today) return { error: 'Награда босса уже получена' };
  const chest = giveChest(p, { palium: 0.1, uncommonChance: 0.6, rareChance: 0.15 });
  const events = [{ type: 'title', text: `Босс дня пал: ${boss.name}` }, ...chest.events];
  const player = {
    ...chest.player,
    bossClaimDate: today,
    world: { ...(chest.player.world ?? {}), bossClaims: (p.world?.bossClaims ?? 0) + 1 },
  };
  return { player: checkAchievements(player, events), events };
}

function localBoss(day, damage, reason = 'train', username = 'Игрок') {
  const key = 'system.dailyBoss.v1';
  let state = null;
  try {
    state = JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    state = null;
  }
  if (!state || state.day !== day || state.maxHp === 1600) {
    state = { day, name: bossTitle(day), maxHp: BOSS_HP, hp: BOSS_HP, strikes: 0, mine: 0, fighters: 0, shared: false, log: [] };
  }
  const room = Math.max(0, 500 - (state.mine ?? 0));
  const dmg = Math.min(150, Math.max(0, Math.round(damage) || 0), room);
  if (dmg > 0 && state.hp > 0) {
    state = {
      ...state,
      hp: Math.max(0, state.hp - dmg),
      strikes: (state.strikes ?? 0) + 1,
      mine: (state.mine ?? 0) + dmg,
      fighters: 1,
      log: [
        { id: `${Date.now()}`, username, damage: dmg, reason, createdAt: new Date().toISOString() },
        ...(state.log ?? []),
      ].slice(0, 50),
    };
  }
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  return state;
}

export async function strikeDailyBoss(day, damage = 0, reason = 'train', username = 'Игрок') {
  const fallback = (message) => ({
    ...localBoss(day, damage, reason, username),
    shared: false,
    error: message || 'Не удалось связаться с общим боссом',
  });
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) return fallback('Нет входа в аккаунт');

    const { data, error } = await supabase.rpc('strike_daily_boss', {
      p_day: day,
      p_damage: Math.max(0, Math.round(Number(damage) || 0)),
      p_reason: String(reason || 'train'),
      p_username: String(username || 'Игрок').slice(0, 40),
    });
    if (error || data == null) return fallback(error?.message || error?.details || 'Пустой ответ босса');

    const body = typeof data === 'string' ? JSON.parse(data) : data;
    if (body?.error) return fallback(String(body.error));
    return {
      day: body.day,
      name: body.name,
      maxHp: body.maxHp,
      hp: body.hp,
      strikes: body.strikes,
      fighters: body.fighters ?? 0,
      mine: body.mine ?? 0,
      shared: true,
      error: '',
      log: Array.isArray(body.log) ? body.log : [],
    };
  } catch (err) {
    return fallback(err?.message || 'Сеть недоступна');
  }
}
