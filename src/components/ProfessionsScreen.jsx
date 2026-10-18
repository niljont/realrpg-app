import { useEffect, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  Anvil,
  ChefHat,
  ChevronRight,
  FlaskConical,
  Gem,
  Hammer,
  Pencil,
  Scissors,
  Shirt,
  Zap,
} from 'lucide-react';
import Modal from './Modal';
import {
  MASTERY_TIERS,
  masteryXpFactor,
  recipeMastery,
  ITEMS,
} from '../lib/world';
import {
  CRAFT_PROFESSIONS,
  CRAFT_RECIPES,
  craftRank,
  craftSkillOf,
  recipeCostStatus,
} from '../lib/crafting';
import { STAT_META } from '../lib/game';
import {
  GRIP_LABELS,
  ITEM_QUALITY,
  SLOT_LABELS,
  formatGearBonusLines,
  formatWeaponDamageLine,
  qualityColor,
} from '../lib/equipment';

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

const CRAFT_ICONS = {
  smith: Anvil,
  leather: Scissors,
  tailor: Shirt,
  alchemy: FlaskConical,
  jewel: Gem,
};

function CraftResultCard({ item, onClose }) {
  const color = qualityColor(item);
  const quality = ITEM_QUALITY[item.quality]?.label;
  const dmgLine = formatWeaponDamageLine(item);
  const bonusLines = formatGearBonusLines(item);
  const slotLabel = item.grip
    ? GRIP_LABELS[item.grip]
    : item.slot
      ? (SLOT_LABELS[item.slot] ?? SLOT_LABELS[`${item.slot}1`] ?? '')
      : '';

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="system-panel modal-in w-full max-w-sm p-5"
        style={{ borderColor: `${color}88` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 text-center font-display text-[11px] tracking-[0.28em] text-zinc-500">СОЗДАНО</div>
        <div className="flex items-start gap-3">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-3xl"
            style={{ background: `${color}22`, boxShadow: `0 0 16px ${color}44` }}
          >
            {item.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg leading-tight" style={{ color }}>
              {item.name}
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">
              {[quality, item.itemLevel ? `ур. ${item.itemLevel}` : '', slotLabel].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>
        {item.desc && <p className="mt-3 text-sm leading-relaxed text-zinc-300">{item.desc}</p>}
        {dmgLine && <p className="mt-2 text-[12px] text-zinc-100">{dmgLine}</p>}
        {bonusLines.map((line) => (
          <p key={line} className="text-[12px] text-zinc-100">
            {line}
          </p>
        ))}
        {item.reqLevel || item.req ? (
          <div className="mt-2 space-y-0.5">
            {item.reqLevel ? <div className="text-[11px] font-bold text-zinc-300">Требуется уровень {item.reqLevel}</div> : null}
            {Object.entries(item.req ?? {}).map(([stat, need]) => (
              <div key={stat} className="text-[11px] font-bold text-zinc-300">
                Требуется {STAT_META[stat]?.label ?? stat} {need}
              </div>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl py-3 text-sm font-bold text-white"
          style={{ background: color }}
        >
          Забрать
        </button>
      </div>
    </div>
  );
}

function CraftPanel({ player, profession, onCraft }) {
  const [drop, setDrop] = useState(null);
  const skill = craftSkillOf(player, profession.id);
  const recipes = CRAFT_RECIPES.filter((recipe) => recipe.profession === profession.id);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-zinc-900/70 p-3" style={{ borderColor: `${profession.color}55` }}>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-zinc-400">Навык</span>
          <span className="font-display" style={{ color: profession.color }}>
            {skill} · {craftRank(skill)}
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
          {profession.id === 'alchemy'
            ? 'Зелья и камни получаются сразу. Оружие мага случайное: чем выше навык, тем чаще зелёное, синее и фиолетовое. Крафт тратит энергию.'
            : `${profession.blurb} Крафт тратит энергию. Чем выше навык, тем чаще зелёные, синие и фиолетовые вещи вашего уровня.`}
        </p>
      </div>
      {recipes.map((recipe) => {
        const costs = recipeCostStatus(player, recipe);
        const enoughAp = (player.ap ?? 0) >= recipe.ap;
        const enoughMats = costs.every((row) => row.ok);
        return (
          <div key={recipe.id} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
            <div className="font-display text-sm text-zinc-100">{recipe.name}</div>
            <div className="mt-1 text-[11px] text-zinc-500">{recipe.blurb}</div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
              <span
                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-bold ${
                  enoughAp ? 'border-blue-500/30 bg-blue-500/10 text-blue-300' : 'border-red-500/40 text-red-400'
                }`}
              >
                <Zap size={10} /> {recipe.ap} AP
              </span>
              {costs.map((row) => {
                const item = ITEMS[row.id];
                return (
                  <span
                    key={row.id}
                    className={`rounded border px-1.5 py-0.5 font-bold ${
                      row.ok ? 'border-zinc-700 text-zinc-300' : 'border-red-500/40 text-red-400'
                    }`}
                  >
                    {item?.emoji} {item?.name ?? row.id} {row.have}/{row.need}
                  </span>
                );
              })}
            </div>
            <button
              type="button"
              disabled={!enoughAp || !enoughMats}
              onClick={() => {
                const item = onCraft(recipe.id);
                if (item) setDrop(item);
              }}
              className="mt-3 w-full rounded-lg py-2.5 text-xs font-bold text-white disabled:opacity-35"
              style={{ background: profession.color }}
            >
              Создать
            </button>
          </div>
        );
      })}
      {drop && <CraftResultCard item={drop} onClose={() => setDrop(null)} />}
    </div>
  );
}

function professionCraftCount(player, professionId) {
  return CRAFT_RECIPES.filter((recipe) => recipe.profession === professionId).filter((recipe) => {
    if ((player.ap ?? 0) < recipe.ap) return false;
    return recipeCostStatus(player, recipe).every((row) => row.ok);
  }).length;
}

function ProfessionRow({ icon: Icon, title, skillLabel, color, onClick, readyCount = 0 }) {
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
      {readyCount > 0 && (
        <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-[0_0_8px_rgb(16_185_129)]">
          {readyCount}
        </span>
      )}
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
  onCraft,
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
    ...CRAFT_PROFESSIONS.map((profession) => ({
      id: profession.id,
      title: profession.title,
      Icon: CRAFT_ICONS[profession.id] ?? Hammer,
      color: profession.color,
      skillLabel: `Навык ${craftSkillOf(player, profession.id)} · ${craftRank(craftSkillOf(player, profession.id))}`,
    })),
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
              readyCount={p.id === 'cook' ? 0 : professionCraftCount(player, p.id)}
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
          {CRAFT_PROFESSIONS.some((profession) => profession.id === open) && (
            <CraftPanel
              player={player}
              profession={CRAFT_PROFESSIONS.find((profession) => profession.id === open)}
              onCraft={onCraft}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
