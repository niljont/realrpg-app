import { useEffect, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  ChefHat,
  ChevronRight,
  Feather,
  Hammer,
  Pencil,
  Scroll,
} from 'lucide-react';
import Modal from './Modal';
import {
  ITEMS,
  INSCRIPTION_BLOCK_MIN,
  INSCRIPTION_XP_PER_BLOCK,
  MASTERY_TIERS,
  SCROLL_HERBS_REQ,
  SCROLL_SKILL_REQ,
  canAfford,
  inkCostForScroll,
  masteryXpFactor,
  recipeMastery,
} from '../lib/world';

function formatSkill(n) {
  const v = Number(n) || 0;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function RecipeForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [ingredients, setIngredients] = useState(initial?.ingredients ?? '');

  useEffect(() => {
    setName(initial?.name ?? '');
    setNotes(initial?.notes ?? '');
    setIngredients(initial?.ingredients ?? '');
  }, [initial?.id, initial?.name, initial?.notes, initial?.ingredients]);

  return (
    <form
      className="space-y-2 rounded-xl border border-zinc-700 bg-zinc-950/80 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (onSubmit({ name, notes, ingredients })) {
          if (!initial) {
            setName('');
            setNotes('');
            setIngredients('');
          }
        }
      }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Название"
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-neon"
        required
      />
      <textarea
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
        placeholder="Ингредиенты"
        rows={2}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-neon"
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Заметки по приготовлению"
        rows={2}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-neon"
      />
      <div className="flex gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg border border-zinc-700 px-3 py-2.5 text-xs font-bold text-zinc-400">
            Отмена
          </button>
        )}
        <button type="submit" className="flex-1 rounded-lg bg-orange-600 py-2.5 text-xs font-bold text-white">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function RecipeCard({ recipe, onCook, onEdit, onArchive, onRestore }) {
  const cooks = recipe.cooks ?? 0;
  const mastery = recipeMastery(cooks);
  const nextFactor = masteryXpFactor(cooks);
  const archived = Boolean(recipe.archived);

  return (
    <div className="rounded-xl border bg-zinc-900/70 p-3" style={{ borderColor: archived ? '#3f3f46' : `${mastery.color}88`, opacity: archived ? 0.75 : 1 }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-display text-sm text-zinc-100">{recipe.name}</div>
          {recipe.ingredients && <div className="mt-1 text-[11px] text-zinc-400">Ингредиенты: {recipe.ingredients}</div>}
          {recipe.notes && <div className="mt-1 text-[11px] text-zinc-500">{recipe.notes}</div>}
          <div className="mt-2 text-[10px] text-zinc-500">
            Приготовлено: {cooks} · след. навык {Math.round(nextFactor * 100)}%
          </div>
        </div>
        <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold" style={{ borderColor: mastery.color, color: mastery.color }}>
          {archived ? 'Архив' : mastery.label}
        </span>
      </div>

      {!archived ? (
        <>
          <button
            onClick={() => onCook(recipe.id)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold text-white"
            style={{ background: mastery.color, boxShadow: `0 0 12px ${mastery.color}55` }}
          >
            <ChefHat size={14} /> Приготовить
          </button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onEdit(recipe)}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-700 py-2 text-[11px] font-bold text-zinc-300"
            >
              <Pencil size={12} /> Изменить
            </button>
            <button
              type="button"
              onClick={() => onArchive(recipe.id)}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-700 py-2 text-[11px] font-bold text-zinc-400"
            >
              <Archive size={12} /> В архив
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => onRestore(recipe.id)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-300"
        >
          <ArchiveRestore size={14} /> Вернуть из архива
        </button>
      )}
    </div>
  );
}

function CookingPanel({ player, onCook, onAddRecipe, onEditRecipe, onArchiveRecipe }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  const recipes = player.customRecipes ?? [];
  const active = recipes.filter((r) => !r.archived);
  const archived = recipes.filter((r) => r.archived);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] text-zinc-500">
          Навык: <b className="text-orange-400">{formatSkill(player.cookingSkill)}</b>
        </div>
        <div className="flex gap-1.5">
          {archived.length > 0 && (
            <button
              type="button"
              onClick={() => setShowArchive((v) => !v)}
              className="rounded-lg border border-zinc-700 px-2.5 py-1.5 text-[11px] font-bold text-zinc-400"
            >
              {showArchive ? 'Книга' : `Архив (${archived.length})`}
            </button>
          )}
          {!showArchive && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setShowForm((v) => !v);
              }}
              className="rounded-lg border border-neon/40 bg-neon/10 px-3 py-1.5 text-[11px] font-bold text-neon"
            >
              {showForm && !editing ? 'Отмена' : '+ Рецепт'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {MASTERY_TIERS.map((t) => (
          <span key={t.id} className="rounded-full border px-2 py-0.5 text-[9px] font-bold" style={{ borderColor: t.color, color: t.color }}>
            {t.min}–{t.max === Infinity ? '∞' : t.max}: {Math.round(t.skill * 100)}%
          </span>
        ))}
      </div>

      {editing && (
        <RecipeForm
          initial={editing}
          submitLabel="Сохранить изменения"
          onCancel={() => setEditing(null)}
          onSubmit={(data) => {
            if (onEditRecipe(editing.id, data)) {
              setEditing(null);
              return true;
            }
            return false;
          }}
        />
      )}

      {showForm && !editing && (
        <RecipeForm
          submitLabel="Сохранить рецепт"
          onCancel={() => setShowForm(false)}
          onSubmit={(data) => {
            if (onAddRecipe(data)) {
              setShowForm(false);
              return true;
            }
            return false;
          }}
        />
      )}

      {showArchive ? (
        archived.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 py-8 text-center text-xs text-zinc-600">Архив пуст</div>
        ) : (
          archived.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              onCook={onCook}
              onEdit={setEditing}
              onArchive={(id) => onArchiveRecipe(id, true)}
              onRestore={(id) => onArchiveRecipe(id, false)}
            />
          ))
        )
      ) : active.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-8 text-center text-xs text-zinc-600">Пока нет личных рецептов</div>
      ) : (
        active.map((r) => (
          <RecipeCard
            key={r.id}
            recipe={r}
            onCook={onCook}
            onEdit={(rec) => {
              setShowForm(false);
              setEditing(rec);
            }}
            onArchive={(id) => onArchiveRecipe(id, true)}
            onRestore={(id) => onArchiveRecipe(id, false)}
          />
        ))
      )}
    </div>
  );
}

function InscriptionPanel({ player, onStudy, onCraft }) {
  const [mins, setMins] = useState('15');
  const skill = player.inscriptionXp ?? 0;
  const inkNeed = inkCostForScroll(player);
  const canCraft = skill >= SCROLL_SKILL_REQ && canAfford(player, { wild_herbs: SCROLL_HERBS_REQ, magic_ink: inkNeed });
  const blocks = Math.floor((Number(mins) || 0) / INSCRIPTION_BLOCK_MIN);

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-zinc-500">
        Каждые {INSCRIPTION_BLOCK_MIN} мин → +{INSCRIPTION_XP_PER_BLOCK} навыка и +1 {ITEMS.magic_ink.name}.
      </p>
      <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Навык Начертания</span>
          <span className="font-display text-violet-300">
            {skill} / {SCROLL_SKILL_REQ}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full bg-violet-500" style={{ width: `${Math.min(100, (skill / SCROLL_SKILL_REQ) * 100)}%` }} />
        </div>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          min={INSCRIPTION_BLOCK_MIN}
          step={INSCRIPTION_BLOCK_MIN}
          value={mins}
          onChange={(e) => setMins(e.target.value)}
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 font-bold text-violet-300 outline-none"
        />
        <button
          disabled={blocks < 1}
          onClick={() => onStudy(mins) && setMins('15')}
          className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-30"
        >
          Изучить
        </button>
      </div>
      <div className="rounded-xl border border-amber-500/30 bg-zinc-900/70 p-3">
        <div className="flex items-center gap-2 font-display text-sm text-amber-300">
          <Scroll size={16} /> Свиток Читмила
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">
          {SCROLL_HERBS_REQ} трав + {inkNeed} чернил{inkNeed < 10 ? ' (Хранитель −2)' : ''} + навык ≥ {SCROLL_SKILL_REQ}
        </p>
        <button disabled={!canCraft} onClick={onCraft} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 py-2.5 text-xs font-bold text-white disabled:opacity-30">
          <Feather size={14} /> Создать свиток
        </button>
      </div>
    </div>
  );
}

function ProfessionRow({ icon: Icon, title, skillLabel, color, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border bg-zinc-900/70 px-3 py-3 text-left transition active:scale-[0.99]"
      style={{ borderColor: `${color}55` }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}18`, color, boxShadow: `0 0 12px ${color}33` }}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-sm text-zinc-100">{title}</div>
        <div className="mt-0.5 text-[11px] font-bold" style={{ color }}>
          {skillLabel}
        </div>
      </div>
      <ChevronRight size={18} className="shrink-0 text-zinc-600" />
    </button>
  );
}

export default function ProfessionsScreen({
  player,
  onCook,
  onAddRecipe,
  onEditRecipe,
  onArchiveRecipe,
  onStudy,
  onCraftScroll,
}) {
  const [open, setOpen] = useState(null);
  const activeRecipes = (player.customRecipes ?? []).filter((r) => !r.archived).length;

  const professions = [
    {
      id: 'cook',
      title: 'Кулинария',
      Icon: ChefHat,
      color: '#f97316',
      skillLabel: `Ур. навыка ${formatSkill(player.cookingSkill)} · рецептов ${activeRecipes}`,
    },
    {
      id: 'inscribe',
      title: 'Начертание',
      Icon: Feather,
      color: '#a855f7',
      skillLabel: `Ур. навыка ${player.inscriptionXp ?? 0}`,
    },
  ];

  const current = professions.find((p) => p.id === open);

  return (
    <div className="space-y-4">
      <section className="system-panel space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Hammer size={16} className="text-neon" />
          <h2 className="font-display text-sm tracking-widest text-neon/90">ПРОФЕССИИ</h2>
        </div>
        <p className="text-[11px] text-zinc-500">Выберите профессию, чтобы открыть её окно.</p>
        <div className="space-y-2">
          {professions.map((p) => (
            <ProfessionRow
              key={p.id}
              icon={p.Icon}
              title={p.title}
              skillLabel={p.skillLabel}
              color={p.color}
              onClick={() => setOpen(p.id)}
            />
          ))}
        </div>
      </section>

      {current && (
        <Modal title={current.title} onClose={() => setOpen(null)}>
          {open === 'cook' && (
            <CookingPanel
              player={player}
              onCook={onCook}
              onAddRecipe={onAddRecipe}
              onEditRecipe={onEditRecipe}
              onArchiveRecipe={onArchiveRecipe}
            />
          )}
          {open === 'inscribe' && <InscriptionPanel player={player} onStudy={onStudy} onCraft={onCraftScroll} />}
        </Modal>
      )}
    </div>
  );
}
