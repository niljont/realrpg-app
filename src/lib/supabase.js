import { createClient } from '@supabase/supabase-js';

/**
 * Vite подставляет только СТАТИЧЕСКИЕ обращения:
 * import.meta.env.VITE_SUPABASE_URL — ок
 * import.meta.env[name] — в проде будет undefined
 */
function getSupabaseConfig() {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : {};
  const proc = typeof process !== 'undefined' && process.env ? process.env : {};

  const url = String(
    env.VITE_SUPABASE_URL ||
      env.NEXT_PUBLIC_SUPABASE_URL ||
      proc.VITE_SUPABASE_URL ||
      proc.NEXT_PUBLIC_SUPABASE_URL ||
      '',
  ).trim();

  const anonKey = String(
    env.VITE_SUPABASE_ANON_KEY ||
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      proc.VITE_SUPABASE_ANON_KEY ||
      proc.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      '',
  ).trim();

  return { url, anonKey };
}

const { url, anonKey } = getSupabaseConfig();

if (!url || !anonKey) {
  console.warn('[СИСТЕМА] Supabase URL/ANON KEY не заданы (Vercel Environment Variables / .env.local)');
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const isSupabaseConfigured = Boolean(url && anonKey);

/** Хост проекта (без ключей) — чтобы сверить локалку и прод. */
export function getSupabaseHost() {
  try {
    return url ? new URL(url).host : 'не задан';
  } catch {
    return 'не задан';
  }
}
