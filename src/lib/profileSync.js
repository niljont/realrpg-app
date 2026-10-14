import { createPlayer, getStats, levelFromXp, xpForNext } from './game';
import { supabase } from './supabase';

/** Минимальные очки стата для отображаемого уровня L. */
export function pointsForStatLevel(level) {
  const L = Math.max(1, Math.floor(Number(level) || 1));
  return 50 * (L - 1) ** 2;
}

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

/** Локальный игрок → строка public.profiles */
export function playerToProfileRow(player, userId) {
  const stats = getStats(player);
  const { level, xp, need } = levelFromXp(player.xp ?? 0);
  return {
    id: userId,
    username: player.name,
    level,
    current_exp: xp,
    exp_to_next: need,
    strength: stats.STR,
    endurance: stats.END,
    agility: stats.AGI,
    intelligence: stats.INT,
    willpower: stats.WIL,
    current_ap: player.ap,
    max_ap: player.maxAp,
    gold: paliumToGold(player.palium),
    total_reps: Math.round(totalRepsFromPlayer(player)),
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
    // Собираем XP до нужного уровня + current_exp
    xp = 0;
    for (let l = 1; l < targetLevel; l++) xp += xpForNext(l);
    xp += Math.max(0, profile.current_exp ?? 0);
  }

  return {
    ...player,
    name: profile.username || player.name,
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

export async function fetchProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfile(player, userId) {
  const row = playerToProfileRow(player, userId);
  const { data, error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' }).select().maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchLeaderboard(limit = 50) {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, username, level, current_exp, strength, endurance, agility, intelligence, willpower, current_ap, max_ap, gold, total_reps, updated_at',
    )
    .order('level', { ascending: false })
    .order('current_exp', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export function storageKeyForUser(userId) {
  return `system.player.v1.${userId}`;
}
