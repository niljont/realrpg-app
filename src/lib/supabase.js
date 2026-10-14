import { createClient } from '@supabase/supabase-js';

function readEnv(name) {
  const vite = typeof import.meta !== 'undefined' ? import.meta.env?.[name] : undefined;
  const node =
    typeof process !== 'undefined' && process.env ? process.env[name] : undefined;
  return vite || node || '';
}

export function getSupabaseConfig() {
  const url =
    readEnv('VITE_SUPABASE_URL') ||
    readEnv('NEXT_PUBLIC_SUPABASE_URL') ||
    readEnv('SUPABASE_URL');
  const anonKey =
    readEnv('VITE_SUPABASE_ANON_KEY') ||
    readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    readEnv('SUPABASE_ANON_KEY');
  return { url: String(url || '').trim(), anonKey: String(anonKey || '').trim() };
}

const { url, anonKey } = getSupabaseConfig();

if (!url || !anonKey) {
  console.warn('[СИСТЕМА] Supabase URL/ANON KEY не заданы в .env.local');
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const isSupabaseConfigured = Boolean(url && anonKey);
