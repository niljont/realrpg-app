import { useState } from 'react';
import { LogOut, RefreshCw, RotateCcw } from 'lucide-react';
import Modal from './Modal';
import { getSupabaseHost } from '../lib/supabase';

const BUILD =
  typeof __APP_BUILD__ !== 'undefined' ? __APP_BUILD__ : 'dev';

async function clearAppCacheAndReload() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        regs.map(async (reg) => {
          reg.active?.postMessage({ type: 'CLEAR_CACHES' });
          await reg.unregister();
        }),
      );
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
  const url = new URL(window.location.href);
  url.searchParams.set('_r', String(Date.now()));
  window.location.replace(url.toString());
}

export default function SettingsModal({ onClose, onSignOut, onResetAccount }) {
  const [view, setView] = useState('menu'); // menu | logout | reset1 | reset2
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  if (view === 'logout') {
    return (
      <Modal title="Выход" onClose={onClose}>
        <p className="mb-4 text-sm leading-relaxed text-zinc-300">
          Выйти из аккаунта? Прогресс сохранён в облаке — при следующем входе вернётесь к нему.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setView('menu')}
            className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-bold text-zinc-300"
          >
            Отмена
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(async () => onSignOut())}
            className="flex-1 rounded-xl border border-red-500/40 bg-red-500/15 py-3 text-sm font-bold text-red-300"
          >
            {busy ? '…' : 'Выйти'}
          </button>
        </div>
      </Modal>
    );
  }

  if (view === 'reset1') {
    return (
      <Modal title="Обнуление" onClose={onClose}>
        <p className="mb-2 text-sm font-bold text-amber-300">Предупреждение 1 из 2</p>
        <p className="mb-4 text-sm leading-relaxed text-zinc-300">
          Сбросить весь прогресс этого аккаунта? Уровень, статы, инвентарь, рецепты, мир и достижения будут стёрты.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView('menu')}
            className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-bold text-zinc-300"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => setView('reset2')}
            className="flex-1 rounded-xl border border-amber-500/40 bg-amber-500/15 py-3 text-sm font-bold text-amber-300"
          >
            Продолжить
          </button>
        </div>
      </Modal>
    );
  }

  if (view === 'reset2') {
    return (
      <Modal title="Обнуление" onClose={onClose}>
        <p className="mb-2 text-sm font-bold text-red-400">Предупреждение 2 из 2</p>
        <p className="mb-4 text-sm leading-relaxed text-zinc-300">
          Действие необратимо. Облачный сейв тоже будет перезаписан пустым профилем. Точно обнулить аккаунт?
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setView('menu')}
            className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-bold text-zinc-300"
          >
            Отмена
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(async () => {
                await onResetAccount();
                onClose();
              })
            }
            className="flex-1 rounded-xl border border-red-500/50 bg-red-600/80 py-3 text-sm font-bold text-white"
          >
            {busy ? '…' : 'Обнулить'}
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Настройки" onClose={onClose}>
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setView('logout')}
          className="flex w-full items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-3.5 text-left transition active:scale-[0.99]"
        >
          <LogOut size={18} className="shrink-0 text-zinc-400" />
          <div>
            <div className="text-sm font-bold text-zinc-100">Выйти из аккаунта</div>
            <div className="text-[11px] text-zinc-500">Потребуется подтверждение</div>
          </div>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => run(clearAppCacheAndReload)}
          className="flex w-full items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-500/5 px-4 py-3.5 text-left transition active:scale-[0.99]"
        >
          <RefreshCw size={18} className={`shrink-0 text-sky-400 ${busy ? 'animate-spin' : ''}`} />
          <div>
            <div className="text-sm font-bold text-sky-300">Обновить приложение</div>
            <div className="text-[11px] text-zinc-500">Сброс кэша PWA · если рейтинг «залип»</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setView('reset1')}
          className="flex w-full items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3.5 text-left transition active:scale-[0.99]"
        >
          <RotateCcw size={18} className="shrink-0 text-red-400" />
          <div>
            <div className="text-sm font-bold text-red-300">Обнулить аккаунт</div>
            <div className="text-[11px] text-zinc-500">Два предупреждения · прогресс будет стёрт</div>
          </div>
        </button>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2.5 text-[10px] leading-relaxed text-zinc-500">
          <div>
            Сборка: <span className="text-zinc-400">{BUILD}</span>
          </div>
          <div className="mt-0.5 break-all">
            БД: <span className="text-zinc-400">{getSupabaseHost()}</span>
          </div>
          <div className="mt-1 text-zinc-600">
            На телефоне и на ПК хост БД должен совпадать. Если нет — проверь Vercel env.
          </div>
        </div>
      </div>
    </Modal>
  );
}
