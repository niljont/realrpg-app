import {
  createPlayer,
  getStats,
  hydratePlayer,
  levelFromXp,
  pointsForStatLevel,
  xpForNext,
} from './game';
import { supabase } from './supabase';

export { pointsForStatLevel } from './game';

/** Колонки профиля без тяжёлого save_data (лидерборд / лёгкий refresh). */
export const PROFILE_PUBLIC_COLS =
  'id,username,level,current_exp,exp_to_next,strength,endurance,agility,intelligence,willpower,current_ap,max_ap,gold,total_reps,breach_wins,active_title,gender,updated_at';

const OPTIONAL_PROFILE_COLS = ['save_data', 'breach_wins', 'active_title', 'gender'];

export function totalRepsFromPlayer(p) {
  const totals = p?.totals ?? {};
  return Object.values(totals).reduce((s, v) => s + (Number(v) || 0), 0);
}

/** Палиум (тысячные) → целое gold в profiles. */
export function paliumToGold(palium) {
  return Math.max(0, Math.round((Number(palium) || 0) * 1000));
}

export function goldToPalium(gold) {
  return Math.round((Number(gold) || 0)) / 1000;
}

/** Полный сейв для колонки save_data (jsonb). */
export function playerToSaveData(player) {
  if (!player) return null;
  const save = { ...player };
  // Не раздуваем облако бесконечным логом.
  if (Array.isArray(save.log) && save.log.length > 200) {
    save.log = save.log.slice(-200);
  }
  return save;
}

/** Локальный игрок → строка public.profiles */
export function playerToProfileRow(player, userId) {
  const stats = getStats(player);
  const { level, xp, need } = levelFromXp(Math.floor(Number(player.xp) || 0));
  const int = (n, fallback = 0) => Math.max(0, Math.floor(Number(n) || fallback));
  return {
    id: userId,
    username: player.name,
    level: int(level, 1) || 1,
    current_exp: int(xp),
    exp_to_next: int(need, 1) || 1,
    strength: int(stats.STR, 1) || 1,
    endurance: int(stats.END, 1) || 1,
    agility: int(stats.AGI, 1) || 1,
    intelligence: int(stats.INT, 1) || 1,
    willpower: int(stats.WIL, 1) || 1,
    current_ap: int(player.ap),
    max_ap: Math.max(1, int(player.maxAp, 1)),
    gold: paliumToGold(player.palium),
    total_reps: int(totalRepsFromPlayer(player)),
    breach_wins: int(player.world?.breachWins),
    active_title: player.activeTitle || 'wanderer',
    gender: player.gender === 'female' ? 'female' : 'male',
    save_data: playerToSaveData(player),
    updated_at: new Date().toISOString(),
  };
}

/** Применить поля профиля к локальному игроку (статы/AP/уровень). */
export function applyProfileToPlayer(player, profile) {
  if (!profile) return player;
  let xp = player.xp ?? 0;
  const targetLevel = Math.max(1, profile.level ?? 1);
  const { level: curLevel } = levelFromXp(xp);
  if (curLevel < targetLevel || (profile.current_exp != null && curLevel === targetLevel)) {
    xp = 0;
    for (let l = 1; l < targetLevel; l++) xp += xpForNext(l);
    xp += Math.max(0, profile.current_exp ?? 0);
  }

  return {
    ...player,
    name: profile.username || player.name,
    gender: profile.gender === 'female' || profile.gender === 'male' ? profile.gender : player.gender,
    activeTitle: profile.active_title || player.activeTitle,
    xp,
    ap: profile.current_ap ?? player.ap,
    maxAp: profile.max_ap ?? player.maxAp,
    palium: profile.gold != null ? goldToPalium(profile.gold) : player.palium,
    statPoints: {
      STR: pointsForStatLevel(profile.strength ?? 1),
      END: pointsForStatLevel(profile.endurance ?? 1),
      AGI: pointsForStatLevel(profile.agility ?? 1),
      INT: pointsForStatLevel(profile.intelligence ?? 1),
      WIL: pointsForStatLevel(profile.willpower ?? 1),
    },
  };
}

export function createPlayerFromProfile(profile, gender = 'male') {
  const base = createPlayer(profile?.username || 'Игрок', gender);
  return applyProfileToPlayer(base, profile);
}

/** Выбрать локальный / облачный сейв (новее по updatedAt). */
export function resolvePlayerBootstrap(local, cloud, fallbackName = 'Игрок') {
  const cloudSave =
    cloud?.save_data && typeof cloud.save_data === 'object' ? hydratePlayer(cloud.save_data) : null;

  let next;
  if (local && cloudSave) {
    const localTs = Number(local.updatedAt) || 0;
    const cloudTs = Number(cloudSave.updatedAt) || Date.parse(cloud.updated_at || '') || 0;
    next = cloudTs >= localTs ? cloudSave : local;
  } else {
    next =
      local ||
      cloudSave ||
      (cloud ? createPlayerFromProfile(cloud) : createPlayer(fallbackName, 'male'));
  }

  if (cloud?.username) next = { ...next, name: cloud.username };
  return next;
}

export async function fetchProfile(userId, { withSave = false } = {}) {
  const cols = withSave ? `${PROFILE_PUBLIC_COLS},save_data` : PROFILE_PUBLIC_COLS;
  let { data, error } = await supabase.from('profiles').select(cols).eq('id', userId).maybeSingle();

  // Старая схема без save_data / breach_wins — откатываемся к select *.
  if (error && /save_data|breach_wins|column/i.test(error.message || '')) {
    ({ data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle());
  }
  if (error) throw error;
  return data;
}

function stripOptionalCol(row, selectCols, col) {
  const nextRow = { ...row };
  delete nextRow[col];
  const nextSelect = selectCols
    .split(',')
    .map((c) => c.trim())
    .filter((c) => c && c !== col)
    .join(',');
  return { row: nextRow, selectCols: nextSelect };
}

async function upsertRow(row) {
  let current = { ...row };
  let selectCols = PROFILE_PUBLIC_COLS;

  for (let attempt = 0; attempt < 8; attempt++) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(current, { onConflict: 'id' })
      .select(selectCols)
      .maybeSingle();

    if (!error) return data;

    const msg = error.message || '';
    const missing = OPTIONAL_PROFILE_COLS.find((col) => new RegExp(col, 'i').test(msg));
    if (missing && (missing in current || selectCols.includes(missing))) {
      if (missing === 'save_data') {
        console.warn(
          '[СИСТЕМА] Колонка save_data отсутствует. Выполни SQL: alter table public.profiles add column if not exists save_data jsonb;',
        );
      }
      ({ row: current, selectCols } = stripOptionalCol(current, selectCols, missing));
      continue;
    }
    if (/column|does not exist|schema cache/i.test(msg)) {
      const { data: d2, error: e2 } = await supabase
        .from('profiles')
        .upsert(current, { onConflict: 'id' })
        .select('*')
        .maybeSingle();
      if (e2) throw e2;
      return d2;
    }
    throw error;
  }
  throw new Error('Не удалось сохранить профиль');
}

export async function upsertProfile(player, userId) {
  const row = playerToProfileRow(player, userId);
  return upsertRow(row);
}

export async function fetchLeaderboard(limit = 100) {
  let cols = PROFILE_PUBLIC_COLS;
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data, error } = await supabase.from('profiles').select(cols).limit(limit);
    if (!error) return data ?? [];

    const msg = error.message || '';
    const missing = OPTIONAL_PROFILE_COLS.filter((c) => c !== 'save_data').find((col) =>
      new RegExp(col, 'i').test(msg),
    );
    if (missing) {
      cols = cols
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c && c !== missing)
        .join(',');
      continue;
    }
    if (/column|does not exist|schema cache/i.test(msg)) {
      const fallback =
        'id,username,level,current_exp,exp_to_next,strength,endurance,agility,intelligence,willpower,current_ap,max_ap,gold,total_reps,updated_at';
      const { data: d2, error: e2 } = await supabase.from('profiles').select(fallback).limit(limit);
      if (e2) throw e2;
      return d2 ?? [];
    }
    throw error;
  }
  return [];
}

export function powerScore(row) {
  return (row.strength ?? 0) + (row.endurance ?? 0) + (row.agility ?? 0) + (row.intelligence ?? 0) + (row.willpower ?? 0);
}

export function sortLeaderboard(rows, mode) {
  const list = [...(rows ?? [])];
  const by = (fn) =>
    list.sort(
      (a, b) =>
        fn(b) - fn(a) || (b.level ?? 0) - (a.level ?? 0) || String(a.username).localeCompare(String(b.username)),
    );
  switch (mode) {
    case 'STR':
      return by((r) => r.strength ?? 0);
    case 'END':
      return by((r) => r.endurance ?? 0);
    case 'AGI':
      return by((r) => r.agility ?? 0);
    case 'INT':
      return by((r) => r.intelligence ?? 0);
    case 'WIL':
      return by((r) => r.willpower ?? 0);
    case 'level':
      return by((r) => (r.level ?? 0) * 100000 + (r.current_exp ?? 0));
    case 'breaches':
      return by((r) => r.breach_wins ?? 0);
    case 'rich':
      return by((r) => r.gold ?? 0);
    case 'overall':
    default:
      return by((r) => powerScore(r));
  }
}

export function storageKeyForUser(userId) {
  return `system.player.v1.${userId}`;
}
