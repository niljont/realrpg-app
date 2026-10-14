import { X } from 'lucide-react';

export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="system-panel modal-in mx-3 mb-[max(env(safe-area-inset-bottom),12px)] max-h-[88vh] w-full max-w-md overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded border border-neon/50 px-1.5 py-0.5 font-display text-[10px] tracking-widest text-neon">
              SYSTEM
            </span>
            <h2 className="font-display text-base text-zinc-100">{title}</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100" aria-label="Закрыть">
              <X size={18} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
