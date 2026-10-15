import { useEffect, useState } from 'react';
import { LogOut, Pencil, RefreshCw, RotateCcw } from 'lucide-react';
import Modal from './Modal';
import { canChangeName, formatNameCooldown, msUntilNameChange } from '../lib/game';

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

export default function SettingsModal({ player, onClose, onSignOut, onResetAccount, onRename }) {
  const [view, setView] = useState('menu'); // menu | rename | logout | reset1 | reset2
  const [busy, setBusy] = useState(false);
  const [nameDraft, setNameDraft] = useState(player?.name ?? '');
  const [renameError, setRenameError] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (view !== 'menu' && view !== 'rename') return undefined;
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [view]);

  const waitMs = msUntilNameChange(player, now);
  const renameReady = canChangeName(player, now);

  const run = async (fn) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  if (view === 'rename') {
    return (
      <Modal title="Смена имени" onClose={onClose}>
        <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
          Имя можно менять раз в 7 дней. Сейчас: <span className="text-zinc-300">{player?.name}</span>
        </p>
        {!renameReady && (
          <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
            Доступно через {formatNameCooldown(waitMs)}
          </div>
        )}
        <input
          type="text"
          value={nameDraft}
          maxLength={24}
          disabled={!renameReady || busy}
          onChange={(e) => {
            setNameDraft(e.target.value);
            setRenameError('');
          }}
          className="mb-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-zinc-100 outline-none focus:border-neon/50 disabled:opacity-50"
          placeholder="Новое имя"
          autoComplete="nickname"
        />
        {renameError && <p className="mb-3 text-[11px] text-red-400">{renameError}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setRenameError('');
              setView('menu');
            }}
            className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-bold text-zinc-300"
          >
            Назад
          </button>
          <button
            type="button"
            disabled={busy || !renameReady}
            onClick={() =>
              run(async () => {
                const res = await onRename(nameDraft);
                if (res?.error) {
                  setRenameError(res.error);
                  return;
                }
                onClose();
              })
            }
            className="flex-1 rounded-xl border border-neon/40 bg-neon/15 py-3 text-sm font-bold text-neon disabled:opacity-40"
          >
            {busy ? '…' : 'Сохранить'}
          </button>
        </div>
      </Modal>
    );
  }

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
          onClick={() => {
            setNameDraft(player?.name ?? '');
            setRenameError('');
            setView('rename');
          }}
          className="flex w-full items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-3.5 text-left transition active:scale-[0.99]"
        >
          <Pencil size={18} className="shrink-0 text-neon" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-zinc-100">Сменить имя</div>
            <div className="truncate text-[11px] text-zinc-500">
              {renameReady ? `Сейчас: ${player?.name}` : `Через ${formatNameCooldown(waitMs)}`}
            </div>
          </div>
        </button>

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
      </div>
    </Modal>
  );
}
