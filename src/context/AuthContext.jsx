import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  createPlayerFromProfile,
  fetchProfile,
  storageKeyForUser,
  upsertProfile,
} from '../lib/profileSync';
import { loadPlayer, savePlayer } from '../lib/game';

/** Триггер создаёт профиль почти сразу; делаем пару попыток select. */
async function waitForProfile(userId, attempts = 6, delayMs = 250) {
  for (let i = 0; i < attempts; i++) {
    const row = await fetchProfile(userId);
    if (row) return row;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return null;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const user = session?.user ?? null;

  const refreshProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }
    const row = await fetchProfile(userId);
    setProfile(row);
    return row;
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const row = await fetchProfile(user.id);
        if (!cancelled) setProfile(row);
      } catch (e) {
        console.warn('[СИСТЕМА] Не удалось загрузить профиль', e);
        if (!cancelled) setProfile(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const signIn = useCallback(async (email, password) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setAuthError(error.message === 'Invalid login credentials' ? 'Неверный email или пароль' : error.message);
      return { error };
    }
    try {
      await refreshProfile(data.user.id);
    } catch {
      /* ignore */
    }
    return { data };
  }, [refreshProfile]);

  const signUp = useCallback(async (email, password, username) => {
    setAuthError(null);
    const nick = username.trim();
    if (nick.length < 2) {
      const err = { message: 'Имя персонажа слишком короткое' };
      setAuthError(err.message);
      return { error: err };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: nick,
        },
      },
    });
    if (error) {
      setAuthError(error.message);
      return { error };
    }

    const userId = data.user?.id;
    if (!userId) {
      const msg = 'Проверьте почту для подтверждения аккаунта, затем войдите.';
      setAuthError(msg);
      return { error: { message: msg }, needsConfirm: true };
    }

    // Профиль создаёт триггер handle_new_user — только select.
    try {
      const row = await waitForProfile(userId);
      if (!row) {
        const msg = 'Профиль ещё не создан триггером. Подождите и войдите снова.';
        setAuthError(msg);
        return { error: { message: msg } };
      }
      setProfile(row);
      if (data.session) {
        savePlayer(createPlayerFromProfile(row), storageKeyForUser(userId));
      }
    } catch (e) {
      const msg = e?.message || 'Не удалось загрузить профиль';
      setAuthError(msg);
      return { error: { message: msg } };
    }

    return { data };
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const syncPlayerToCloud = useCallback(
    async (player) => {
      if (!user?.id || !player) return;
      try {
        const row = await upsertProfile(player, user.id);
        setProfile(row);
      } catch (e) {
        console.warn('[СИСТЕМА] Синхронизация профиля не удалась', e);
      }
    },
    [user?.id],
  );

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      authError,
      setAuthError,
      isConfigured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      syncPlayerToCloud,
      storageKey: user?.id ? storageKeyForUser(user.id) : null,
      loadLocalPlayer: () => (user?.id ? loadPlayer(storageKeyForUser(user.id)) : null),
    }),
    [session, user, profile, loading, authError, signIn, signUp, signOut, refreshProfile, syncPlayerToCloud],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
