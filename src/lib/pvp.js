import { supabase } from './supabase';

export const PVP_SEARCH_MS = 40_000;
export const PVP_FIGHT_MS = 45_000;
export const PVP_YOU_COLOR = '#22d3ee';
export const PVP_OPP_COLOR = '#fb7185';

/**
 * @param {string} username
 * @param {number} rating
 * @returns {Promise<{ status: 'searching' | 'matched', you?: 'a' | 'b', match?: object, error?: string }>}
 */
export async function pvpPoll(username, rating) {
  const { data, error } = await supabase.rpc('pvp_poll', {
    p_username: String(username || 'Игрок').slice(0, 40),
    p_rating: Math.max(100, Math.round(Number(rating) || 1000)),
  });
  if (error) return { status: 'searching', error: error.message };
  const body = typeof data === 'string' ? JSON.parse(data) : data;
  if (!body || body.error) return { status: 'searching', error: body?.error || 'Пустой ответ' };
  return body;
}

/**
 * @param {string} matchId
 * @param {number} reps
 */
export async function pvpSync(matchId, reps) {
  const { data, error } = await supabase.rpc('pvp_sync', {
    p_match: matchId,
    p_reps: Math.max(0, Math.round(Number(reps) || 0)),
  });
  if (error || data == null) return null;
  return typeof data === 'string' ? JSON.parse(data) : data;
}

export async function pvpCancel() {
  await supabase.rpc('pvp_cancel');
}
