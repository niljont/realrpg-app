import { useState } from 'react';
import { Lock, Mail, Sparkles, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const { signIn, signUp, authError, setAuthError, isConfigured } = useAuth();
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setInfo('');
    setAuthError(null);
    try {
      if (tab === 'login') {
        const res = await signIn(email, password);
        if (res.error) return;
      } else {
        const res = await signUp(email, password, username);
        if (res.needsConfirm) {
          setInfo(res.error.message);
          setTab('login');
          return;
        }
        if (res.error) return;
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="system-bg fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="system-panel modal-in w-full max-w-md p-6">
        <div className="mb-1 text-center font-display text-[11px] tracking-[0.35em] text-neon/80">[ СИСТЕМА ]</div>
        <h1 className="glow-text text-center font-display text-xl text-cyan-100">Авторизация Игрока</h1>
        <p className="mt-2 text-center text-[11px] text-zinc-500">Доступ к Системе только для идентифицированных пользователей</p>
        <div className="mx-auto my-5 h-px w-2/3 bg-gradient-to-r from-transparent via-neon to-transparent" />

        {!isConfigured && (
          <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-center text-[11px] text-amber-300">
            Ключи Supabase не найдены. На Vercel задайте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY, затем Redeploy.
          </div>
        )}

        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-zinc-800 bg-zinc-900/70 p-1">
          {[
            { id: 'login', label: 'Вход' },
            { id: 'register', label: 'Регистрация' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setAuthError(null);
                setInfo('');
              }}
              className={`rounded-lg py-2 text-xs font-bold transition ${
                tab === t.id ? 'bg-neon/15 text-neon shadow-[inset_0_0_0_1px_rgb(34_211_238/0.5)]' : 'text-zinc-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form className="space-y-3" onSubmit={submit}>
          {tab === 'register' && (
            <label className="block">
              <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <UserRound size={12} /> Имя персонажа
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                required
                placeholder="Сон Джин-Ву"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 font-semibold text-zinc-100 outline-none focus:border-neon"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <Mail size={12} /> Email
            </span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="player@system.local"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 font-semibold text-zinc-100 outline-none focus:border-neon"
            />
          </label>

          <label className="block">
            <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <Lock size={12} /> Пароль
            </span>
            <input
              type="password"
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="минимум 6 символов"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 font-semibold text-zinc-100 outline-none focus:border-neon"
            />
          </label>

          {(authError || info) && (
            <div
              className={`rounded-xl border px-3 py-2 text-center text-[11px] ${
                authError ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-neon/40 bg-neon/10 text-neon'
              }`}
            >
              {authError || info}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !isConfigured}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 font-display tracking-wide text-white shadow-[0_0_20px_rgb(8_145_178/0.45)] transition active:scale-[0.98] disabled:opacity-40"
          >
            <Sparkles size={16} />
            {busy ? 'Синхронизация…' : tab === 'login' ? 'Войти в Систему' : 'Создать Игрока'}
          </button>
        </form>
      </div>
    </div>
  );
}
