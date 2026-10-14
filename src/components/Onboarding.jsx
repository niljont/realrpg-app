import { useState } from 'react';
import { Mars, Venus, Sparkles } from 'lucide-react';

const GENDERS = [
  { id: 'male', label: 'Мужской', title: 'Странник', Icon: Mars, color: '#22d3ee' },
  { id: 'female', label: 'Женский', title: 'Странница', Icon: Venus, color: '#e879f9' },
];

export default function Onboarding({ onAwaken }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState(null);
  const ready = name.trim().length >= 2 && gender;

  return (
    <div className="system-bg fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        className="system-panel modal-in w-full max-w-md p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) onAwaken(name, gender);
        }}
      >
        <div className="mb-1 text-center font-display text-[11px] tracking-[0.35em] text-neon/80">[ УВЕДОМЛЕНИЕ ]</div>
        <h1 className="glow-text text-center font-display text-xl leading-snug text-cyan-100">
          Врата Системы открыты.
          <br />
          Идентифицируйте себя, Игрок
        </h1>
        <div className="mx-auto my-5 h-px w-2/3 bg-gradient-to-r from-transparent via-neon to-transparent" />

        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Nickname</label>
        <input
          autoFocus
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
          placeholder="Сон Джин-Ву"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-lg font-semibold text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-neon focus:shadow-[0_0_16px_rgb(34_211_238/0.35)]"
        />

        <label className="mt-5 mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Пол</label>
        <div className="grid grid-cols-2 gap-3">
          {GENDERS.map(({ id, label, title, Icon, color }) => {
            const active = gender === id;
            return (
              <button
                type="button"
                key={id}
                onClick={() => setGender(id)}
                className="flex flex-col items-center gap-2 rounded-xl border bg-zinc-900/70 px-3 py-4 transition active:scale-95"
                style={{
                  borderColor: active ? color : '#3f3f46',
                  boxShadow: active ? `0 0 18px ${color}66, inset 0 0 14px ${color}22` : 'none',
                }}
              >
                <Icon size={36} color={active ? color : '#71717a'} style={{ filter: active ? `drop-shadow(0 0 6px ${color})` : 'none' }} />
                <span className="font-display text-sm" style={{ color: active ? color : '#a1a1aa' }}>
                  {label}
                </span>
                <span className="text-[11px] text-zinc-500">Титул: {title}</span>
              </button>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={!ready}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-3.5 font-display text-base tracking-wider text-white shadow-[0_0_24px_rgb(34_211_238/0.45)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
        >
          <Sparkles size={18} /> Пробуждение
        </button>
        <p className="mt-3 text-center text-[11px] text-zinc-500">Уровень 1 · Все характеристики = 1 · Энергия 10 / 10 AP</p>
      </form>
    </div>
  );
}
