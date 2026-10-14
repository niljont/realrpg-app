import { useState } from 'react';
import { ChefHat, Feather, Hammer, Scroll, Store, Utensils, X } from 'lucide-react';
import {
  ITEMS,
  INSCRIPTION_BLOCK_MIN,
  INSCRIPTION_XP_PER_BLOCK,
  MASTERY_TIERS,
  SCROLL_HERBS_REQ,
  SCROLL_SKILL_REQ,
  SHOP_BUY,
  SHOP_SELL,
  canAfford,
  formatMoney,
  inkCostForScroll,
  invCount,
  masteryXpFactor,
  recipeMastery,
} from '../lib/world';

function Segmented({ value, onChange, options }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/70 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`flex shrink-0 items-center justify-center gap-1 rounded-lg px-2.5 py-2 text-[10px] font-bold transition ${
            value === o.id ? 'bg-neon/15 text-neon shadow-[inset_0_0_0_1px_rgb(34_211_238/0.5)]' : 'text-zinc-500'
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function RecipeCard({ recipe, onCook }) {
  const cooks = recipe.cooks ?? 0;
  const mastery = recipeMastery(cooks);
  const nextFactor = masteryXpFactor(cooks);
  return (
    <div className="rounded-xl border bg-zinc-900/70 p-3" style={{ borderColor: `${mastery.color}88` }}>
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
          {mastery.label}
        </span>
      </div>
      <button
        onClick={() => onCook(recipe.id)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold text-white"
        style={{ background: mastery.color, boxShadow: `0 0 12px ${mastery.color}55` }}
      >
        <ChefHat size={14} /> Приготовить
      </button>
    </div>
  );
}

function CookingTab({ player, onCook, onAddRecipe }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState('');
  const recipes = player.customRecipes ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] text-zinc-500">
          Навык кулинарии: <b className="text-orange-400">{player.cookingSkill ?? 0}</b>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg border border-neon/40 bg-neon/10 px-3 py-1.5 text-[11px] font-bold text-neon"
        >
          {showForm ? 'Отмена' : '+ Новый рецепт'}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {MASTERY_TIERS.map((t) => (
          <span key={t.id} className="rounded-full border px-2 py-0.5 text-[9px] font-bold" style={{ borderColor: t.color, color: t.color }}>
            {t.min}–{t.max === Infinity ? '∞' : t.max}: {Math.round(t.skill * 100)}%
          </span>
        ))}
      </div>

      {showForm && (
        <form
          className="space-y-2 rounded-xl border border-zinc-700 bg-zinc-950/80 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (onAddRecipe({ name, notes, ingredients })) {
              setName('');
              setNotes('');
              setIngredients('');
              setShowForm(false);
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
          <button type="submit" className="w-full rounded-lg bg-orange-600 py-2.5 text-xs font-bold text-white">
            Сохранить рецепт
          </button>
        </form>
      )}

      {recipes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-8 text-center text-xs text-zinc-600">Пока нет личных рецептов</div>
      ) : (
        recipes.map((r) => <RecipeCard key={r.id} recipe={r} onCook={onCook} />)
      )}
    </div>
  );
}

function InscriptionTab({ player, onStudy, onCraft }) {
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

function canApplyItem(item) {
  if (!item) return false;
  if (item.food === 'useful') return true;
  if (item.usable && item.id !== 'cheatmeal_scroll') return true;
  return false;
}

function applyItem(item, onEat, onUse) {
  if (item.food === 'useful') return onEat(item.id);
  return onUse(item.id);
}

function BagTab({ player, onEat, onUse, onHealthy, onNormal, onFast }) {
  const [selectedId, setSelectedId] = useState(null);
  const owned = Object.values(ITEMS)
    .map((item) => ({ item, count: invCount(player, item.id) }))
    .filter((x) => x.count > 0);
  const selected = selectedId ? ITEMS[selectedId] : null;
  const selectedCount = selected ? invCount(player, selected.id) : 0;
  const applicable = canApplyItem(selected);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2">
        <button onClick={onHealthy} className="rounded-xl border border-orange-500/40 bg-orange-500/10 py-3 text-xs font-bold text-orange-300">
          Здоровая домашняя еда
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onNormal} className="rounded-xl border border-zinc-700 bg-zinc-900/70 py-3 text-xs font-bold text-zinc-300">
            Обычная еда
          </button>
          <button onClick={onFast} className="rounded-xl border border-red-500/40 bg-red-500/10 py-3 text-xs font-bold text-red-300">
            Фастфуд / Срыв
          </button>
        </div>
      </div>

      {owned.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-10 text-center text-xs text-zinc-600">Сумка пуста</div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {owned.map(({ item, count }) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className="relative aspect-square rounded-xl border bg-zinc-900/80 text-2xl transition active:scale-95"
              style={{
                borderColor: selectedId === item.id ? item.color : '#3f3f46',
                boxShadow: selectedId === item.id ? `0 0 12px ${item.color}55` : 'none',
              }}
              aria-label={item.name}
            >
              {item.emoji}
              <span className="absolute right-1 bottom-1 rounded bg-black/70 px-1 font-display text-[10px] tabular-nums text-zinc-100">
                {count}
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && selectedCount > 0 && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={() => setSelectedId(null)}>
          <div
            className="system-panel modal-in w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
            style={{ borderColor: `${selected.color}66` }}
          >
            <div className="mb-3 flex items-start gap-3">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl"
                style={{ background: `${selected.color}22`, boxShadow: `0 0 14px ${selected.color}33` }}
              >
                {selected.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-base" style={{ color: selected.color }}>
                  {selected.name}
                </div>
                <div className="mt-0.5 text-[11px] text-zinc-500">В сумке: ×{selectedCount}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                aria-label="Закрыть"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-zinc-300">{selected.desc}</p>
            <div className="flex gap-2">
              {applicable ? (
                <button
                  type="button"
                  onClick={() => {
                    if (applyItem(selected, onEat, onUse)) setSelectedId(null);
                  }}
                  className="flex-1 rounded-xl py-3 text-sm font-bold text-white"
                  style={{ background: selected.color, boxShadow: `0 0 16px ${selected.color}55` }}
                >
                  Применить
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className={`rounded-xl border border-zinc-700 py-3 text-sm font-bold text-zinc-300 ${applicable ? 'px-4' : 'flex-1'}`}
              >
                {applicable ? <X size={18} className="mx-auto" /> : 'Закрыть'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShopTab({ player, onSell, onBuy }) {
  const [amounts, setAmounts] = useState({});
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-sky-500/40 bg-sky-500/5 p-3 text-center">
        <div className="font-display text-sm text-sky-300">Магазин Системы</div>
        <div className="mt-1 text-xs text-sky-400/90">{formatMoney(player.palium ?? 0)}</div>
      </div>
      <h3 className="font-display text-[11px] tracking-widest text-zinc-400">ПРОДАТЬ</h3>
      {SHOP_SELL.map((s) => {
        const have = invCount(player, s.item);
        const amt = Number(amounts[s.item]) || 1;
        return (
          <div key={s.item} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5">
            <span className="text-xl">{ITEMS[s.item].emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-zinc-100">{s.label}</div>
              <div className="text-[10px] text-zinc-500">
                {formatMoney(s.price)} / шт · есть {have}
              </div>
            </div>
            <input
              type="number"
              min={1}
              value={amounts[s.item] ?? '1'}
              onChange={(e) => setAmounts({ ...amounts, [s.item]: e.target.value })}
              className="w-14 rounded-lg border border-zinc-700 bg-zinc-950 px-1 py-1 text-center text-xs font-bold"
            />
            <button disabled={have < 1} onClick={() => onSell(s.item, amt)} className="rounded-lg bg-sky-700 px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-30">
              Продать
            </button>
          </div>
        );
      })}
      <h3 className="font-display text-[11px] tracking-widest text-zinc-400">КУПИТЬ</h3>
      {SHOP_BUY.map((s) => (
        <div key={s.item} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5">
          <span className="text-xl">{ITEMS[s.item].emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-zinc-100">{s.name}</div>
            <div className="text-[10px] text-zinc-500">{ITEMS[s.item].desc}</div>
          </div>
          <button
            disabled={(player.palium ?? 0) < s.price}
            onClick={() => onBuy(s.item)}
            className="rounded-lg bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-30"
          >
            {formatMoney(s.price)}
          </button>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { id: 'cook', label: 'Кулинария', icon: <ChefHat size={12} /> },
  { id: 'inscribe', label: 'Начертание', icon: <Feather size={12} /> },
  { id: 'bag', label: 'Сумка', icon: <Utensils size={12} /> },
  { id: 'shop', label: 'Магазин', icon: <Store size={12} /> },
];

export default function ProfessionsScreen({
  player,
  onCook,
  onAddRecipe,
  onStudy,
  onCraftScroll,
  onEat,
  onUseItem,
  onHealthyMeal,
  onNormalMeal,
  onFastFood,
  onSell,
  onBuy,
}) {
  const [tab, setTab] = useState('cook');

  return (
    <div className="space-y-4">
      <section className="system-panel space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Hammer size={16} className="text-neon" />
          <h2 className="font-display text-sm tracking-widest text-neon/90">ПРОФЕССИИ</h2>
        </div>
        <Segmented value={tab} onChange={setTab} options={TABS} />
        {tab === 'cook' && <CookingTab player={player} onCook={onCook} onAddRecipe={onAddRecipe} />}
        {tab === 'inscribe' && <InscriptionTab player={player} onStudy={onStudy} onCraft={onCraftScroll} />}
        {tab === 'bag' && (
          <BagTab
            player={player}
            onEat={onEat}
            onUse={onUseItem}
            onHealthy={onHealthyMeal}
            onNormal={onNormalMeal}
            onFast={onFastFood}
          />
        )}
        {tab === 'shop' && <ShopTab player={player} onSell={onSell} onBuy={onBuy} />}
      </section>
    </div>
  );
}
