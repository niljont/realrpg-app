import {
  CLOG_HOURS,
  METABOLISM_BONUS,
  METABOLISM_HOURS,
  activeEffect,
  addPalium,
  formatPalium,
  levelFromXp,
} from './game';

/* ---------- предметы ---------- */

export const ITEMS = {
  copper_ore: { id: 'copper_ore', name: 'Медная руда', emoji: '🪨', color: '#b45309', desc: 'Продаётся гоблину', category: 'resource' },
  wood: { id: 'wood', name: 'Древесина', emoji: '🪵', color: '#a16207', desc: 'Продаётся гоблину / крафт', category: 'resource' },
  wild_herbs: { id: 'wild_herbs', name: 'Дикие травы', emoji: '🌿', color: '#22c55e', desc: 'Сырьё Начертания и кухни', category: 'resource' },
  raw_fish: { id: 'raw_fish', name: 'Сырая рыба', emoji: '🐟', color: '#38bdf8', desc: 'Ингредиент Кулинарии', category: 'resource' },
  magic_ink: { id: 'magic_ink', name: 'Магические Чернила', emoji: '🖋️', color: '#a855f7', desc: '15 мин языка → +1 чернило', category: 'craft' },
  cheatmeal_scroll: { id: 'cheatmeal_scroll', name: 'Свиток Читмила', emoji: '📜', color: '#eab308', desc: 'Сжигает штраф за фастфуд', category: 'scroll', usable: true },
  focus_elixir: { id: 'focus_elixir', name: 'Эликсир Фокуса', emoji: '🧪', color: '#3b82f6', desc: '+10% XP на 2 часа', category: 'consumable', usable: true },
  recovery_rune: { id: 'recovery_rune', name: 'Руна Восстановления', emoji: '🔷', color: '#22d3ee', desc: 'Восстанавливает 5 AP', category: 'consumable', usable: true },
  dish_grilled_fish: { id: 'dish_grilled_fish', name: 'Жареная рыба', emoji: '🍳', color: '#f97316', desc: 'Здоровая еда · Оптимизация метаболизма +15% урон/XP на 8ч', category: 'food', food: 'useful', usable: true },
  dish_herb_fish: { id: 'dish_herb_fish', name: 'Рыба на травах', emoji: '🍲', color: '#f97316', desc: 'Здоровая еда · Оптимизация метаболизма +15% урон/XP на 8ч', category: 'food', food: 'useful', usable: true },
  dish_fish_stew: { id: 'dish_fish_stew', name: 'Уха Системы', emoji: '🍜', color: '#ef4444', desc: 'Здоровая еда · Оптимизация метаболизма +15% урон/XP на 8ч', category: 'food', food: 'useful', usable: true },
  dish_herb_broth: { id: 'dish_herb_broth', name: 'Отвар трав', emoji: '🍵', color: '#22c55e', desc: 'Здоровая еда · Оптимизация метаболизма +15% урон/XP на 8ч', category: 'food', food: 'useful', usable: true },
};

export const emptyInventory = () => Object.fromEntries(Object.keys(ITEMS).map((id) => [id, 0]));

export const invCount = (p, id) => p.inventory?.[id] ?? 0;

export function canAfford(p, cost) {
  return Object.entries(cost).every(([id, n]) => invCount(p, id) >= n);
}

function spendItems(inv, cost) {
  const next = { ...inv };
  for (const [id, n] of Object.entries(cost)) next[id] = Math.max(0, (next[id] ?? 0) - n);
  return next;
}

function addItem(inv, item, amount) {
  return { ...inv, [item]: (inv[item] ?? 0) + amount };
}

export function formatMoney(n) {
  return `${formatPalium(n)} Палиум`;
}

/** Округление до тысячных (центы Палиума). */
const p3 = (n) => Math.round(n * 1000) / 1000;

/* ---------- точки мира ---------- */

export const WORLD_NODES = [
  { id: 'copper_vein', name: 'Медная рудная жила', emoji: '🪨', color: '#b45309', apCost: 2, cooldownMs: 30 * 60 * 1000, loot: { item: 'copper_ore', min: 1, max: 2 }, blurb: 'Жила мерцает тусклым металлом' },
  { id: 'ancient_forest', name: 'Вековой лес', emoji: '🌲', color: '#15803d', apCost: 2, cooldownMs: 30 * 60 * 1000, loot: { item: 'wood', min: 1, max: 3 }, blurb: 'Сучья и стволы, полные смолы' },
  { id: 'herb_bush', name: 'Куст целебных трав', emoji: '🌿', color: '#22c55e', apCost: 1, cooldownMs: 15 * 60 * 1000, loot: { item: 'wild_herbs', min: 1, max: 2 }, blurb: 'Аромат, от которого кружится голова' },
  { id: 'boiling_pool', name: 'Бурлящая заводь', emoji: '🐟', color: '#0ea5e9', apCost: 1, cooldownMs: 15 * 60 * 1000, loot: { item: 'raw_fish', min: 1, max: 2 }, blurb: 'Вода кипит — рыба сама прыгает в руки' },
];

export function nodeCooldownLeft(p, nodeId, now = Date.now()) {
  return Math.max(0, (p.nodeCooldowns?.[nodeId] ?? 0) - now);
}

export function formatCooldown(ms) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : `0:${String(r).padStart(2, '0')}`;
}

function rollLoot(loot) {
  return { item: loot.item, amount: loot.min + Math.floor(Math.random() * (loot.max - loot.min + 1)) };
}

export function gatherNode(p, nodeId) {
  const node = WORLD_NODES.find((n) => n.id === nodeId);
  if (!node) return { error: 'Точка не найдена' };
  const now = Date.now();
  const left = nodeCooldownLeft(p, nodeId, now);
  if (left > 0) return { error: `Точка восстанавливается · ${formatCooldown(left)}` };
  if (p.ap < node.apCost) return { error: 'Недостаточно энергии! Выполните силовую тренировку через [+]' };

  const drop = rollLoot(node.loot);
  return {
    player: {
      ...p,
      ap: p.ap - node.apCost,
      inventory: addItem(p.inventory ?? emptyInventory(), drop.item, drop.amount),
      nodeCooldowns: { ...(p.nodeCooldowns ?? {}), [nodeId]: now + node.cooldownMs },
      world: { ...(p.world ?? {}), gathered: (p.world?.gathered ?? 0) + 1 },
    },
    events: [{ type: 'gain', text: `+${drop.amount} ${ITEMS[drop.item].name}` }],
  };
}

/* ---------- кулинария (личные рецепты + WoW-угасание) ---------- */

// По числу приготовлений: 1–3 оранж 100%, 4–7 жёлт 50%, 8–12 зел 25%, 13+ сер 0%.
export const MASTERY_TIERS = [
  { id: 'orange', label: 'Оранжевый', color: '#f97316', min: 1, max: 3, skill: 1 },
  { id: 'yellow', label: 'Жёлтый', color: '#eab308', min: 4, max: 7, skill: 0.5 },
  { id: 'green', label: 'Зелёный', color: '#22c55e', min: 8, max: 12, skill: 0.25 },
  { id: 'gray', label: 'Серый', color: '#71717a', min: 13, max: Infinity, skill: 0 },
];

export function recipeMastery(cooks = 0) {
  const n = Math.max(1, cooks); // 0 приготовлений → отображаем как следующий оранжевый
  if (cooks === 0) return { ...MASTERY_TIERS[0], skill: 1 };
  return MASTERY_TIERS.find((t) => n >= t.min && n <= t.max) ?? MASTERY_TIERS[0];
}

export function masteryXpFactor(cooks = 0) {
  // Шанс/доля навыка за СЛЕДУЮЩЕЕ приготовление (cooks = уже сделано)
  const next = cooks + 1;
  if (next <= 3) return 1;
  if (next <= 7) return 0.5;
  if (next <= 12) return 0.25;
  return 0;
}

export const COOKING_SKILL_BASE = 1; // +1 навык на оранжевом; дальше угасает по WoW

export function addCustomRecipe(p, { name, notes, ingredients }) {
  const title = (name || '').trim();
  if (title.length < 2) return { error: 'Введите название рецепта' };
  const recipe = {
    id: `cr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: title,
    notes: (notes || '').trim(),
    ingredients: (ingredients || '').trim(),
    cooks: 0,
    createdAt: Date.now(),
  };
  return {
    player: { ...p, customRecipes: [...(p.customRecipes ?? []), recipe] },
    events: [{ type: 'title', text: `Рецепт «${recipe.name}» добавлен в книгу` }],
  };
}

export function cookCustomRecipe(p, recipeId) {
  const list = p.customRecipes ?? [];
  const idx = list.findIndex((r) => r.id === recipeId);
  if (idx < 0) return { error: 'Рецепт не найден' };
  const recipe = list[idx];
  const factor = masteryXpFactor(recipe.cooks);
  const skillGain = Math.round(COOKING_SKILL_BASE * factor * 100) / 100;
  const xpGain = Math.max(0, Math.round(12 * factor));
  const events = [];
  const prevLevel = levelFromXp(p.xp).level;

  const updated = { ...recipe, cooks: recipe.cooks + 1 };
  const nextRecipes = [...list];
  nextRecipes[idx] = updated;

  let next = {
    ...p,
    customRecipes: nextRecipes,
    cookingSkill: (p.cookingSkill ?? 0) + skillGain,
    xp: p.xp + xpGain,
    totals: { ...p.totals, meals: (p.totals.meals ?? 0) + 1 },
    world: { ...(p.world ?? {}), cooked: (p.world?.cooked ?? 0) + 1 },
  };

  const tier = recipeMastery(updated.cooks);
  if (factor > 0) {
    events.push({
      type: 'gain',
      text: `«${recipe.name}» · +${skillGain} навык кулинарии · +${xpGain} XP (${tier.label})`,
    });
  } else {
    events.push({ type: 'gain', text: `«${recipe.name}» приготовлено · серый рецепт, навык не растёт` });
  }

  const newLevel = levelFromXp(next.xp).level;
  if (newLevel > prevLevel) {
    next = { ...next, ap: next.maxAp };
    events.push({ type: 'level', text: `УРОВЕНЬ ПОВЫШЕН: ${newLevel}!` });
  }

  return { player: next, events };
}

/** @deprecated старые системные рецепты */
export const RECIPES = [];
export function cookRecipe(p, recipeId) {
  return cookCustomRecipe(p, recipeId);
}

/* ---------- начертание ---------- */

export const INK_PER_BLOCK = 1;
export const INSCRIPTION_BLOCK_MIN = 15;
export const INSCRIPTION_XP_PER_BLOCK = 10;
export const SCROLL_SKILL_REQ = 75;
export const SCROLL_HERBS_REQ = 3;

export const inkCostForScroll = (p) => Math.max(1, 10 - (activeEffect(p).inkDiscount ?? 0));

export function studyLanguage(p, minutes) {
  const mins = Number(minutes) || 0;
  if (mins < INSCRIPTION_BLOCK_MIN) return { error: `Минимум ${INSCRIPTION_BLOCK_MIN} минут за сессию` };

  const blocks = Math.floor(mins / INSCRIPTION_BLOCK_MIN);
  const usedMins = blocks * INSCRIPTION_BLOCK_MIN;
  let ink = blocks * INK_PER_BLOCK;
  let inscXp = blocks * INSCRIPTION_XP_PER_BLOCK;

  // Эликсир фокуса усиливает набор навыка
  if ((p.buffs?.focusUntil ?? 0) > Date.now()) {
    inscXp = Math.round(inscXp * 1.25);
    ink += Math.floor(blocks / 2); // бонусные чернила
  }

  const events = [
    { type: 'gain', text: `Начертание: +${inscXp} навыка · +${ink} ${ITEMS.magic_ink.name} (${usedMins} мин)` },
  ];

  return {
    player: {
      ...p,
      inscriptionXp: (p.inscriptionXp ?? 0) + inscXp,
      inventory: addItem(p.inventory ?? emptyInventory(), 'magic_ink', ink),
      totals: { ...p.totals, languages: (p.totals.languages ?? 0) + usedMins },
      world: { ...(p.world ?? {}), studied: (p.world?.studied ?? 0) + usedMins },
    },
    events,
  };
}

export function craftCheatmealScroll(p) {
  const skill = p.inscriptionXp ?? 0;
  if (skill < SCROLL_SKILL_REQ) return { error: `Нужен навык Начертания ${SCROLL_SKILL_REQ} (сейчас ${skill})` };

  const inkNeed = inkCostForScroll(p);
  const cost = { wild_herbs: SCROLL_HERBS_REQ, magic_ink: inkNeed };
  if (!canAfford(p, cost)) {
    return { error: `Нужно: ${SCROLL_HERBS_REQ} трав + ${inkNeed} чернил${inkNeed < 10 ? ' (скидка Хранителя)' : ''}` };
  }

  return {
    player: {
      ...p,
      inventory: addItem(spendItems(p.inventory ?? emptyInventory(), cost), 'cheatmeal_scroll', 1),
      world: { ...(p.world ?? {}), scrollsCrafted: (p.world?.scrollsCrafted ?? 0) + 1 },
    },
    events: [{ type: 'title', text: `Свиток Читмила создан (−${SCROLL_HERBS_REQ} трав, −${inkNeed} чернил)` }],
  };
}

/* ---------- диета / использование предметов ---------- */

export const FOOD_COMA_HOURS = 4;

export function logHealthyMeal(p) {
  const now = Date.now();
  return {
    player: {
      ...p,
      buffs: {
        ...p.buffs,
        metabolismUntil: now + METABOLISM_HOURS * 3600000,
        clogUntil: 0,
        foodComaUntil: 0,
      },
      world: { ...(p.world ?? {}), usefulMeals: (p.world?.usefulMeals ?? 0) + 1 },
    },
    events: [
      {
        type: 'energy',
        text: `Оптимизация метаболизма! +${METABOLISM_BONUS * 100}% к урону и XP на ${METABOLISM_HOURS}ч`,
      },
    ],
  };
}

export function logNormalMeal(p) {
  return {
    player: {
      ...p,
      world: { ...(p.world ?? {}), normalMeals: (p.world?.normalMeals ?? 0) + 1 },
    },
    events: [{ type: 'gain', text: 'Обычная еда · без эффектов' }],
  };
}

export function logFastFood(p) {
  const now = Date.now();
  const hasScroll = invCount(p, 'cheatmeal_scroll') > 0;
  if (hasScroll) {
    return {
      player: {
        ...p,
        inventory: spendItems(p.inventory ?? emptyInventory(), { cheatmeal_scroll: 1 }),
        world: { ...(p.world ?? {}), fastFood: (p.world?.fastFood ?? 0) + 1, scrollsUsed: (p.world?.scrollsUsed ?? 0) + 1 },
      },
      events: [{ type: 'title', text: 'Фастфуд / Срыв: Свиток Читмила сгорел — без штрафа' }],
    };
  }
  return {
    player: {
      ...p,
      buffs: {
        ...p.buffs,
        clogUntil: now + CLOG_HOURS * 3600000,
        foodComaUntil: now + CLOG_HOURS * 3600000,
        metabolismUntil: 0,
      },
      world: { ...(p.world ?? {}), fastFood: (p.world?.fastFood ?? 0) + 1 },
    },
    events: [
      {
        type: 'error',
        text: `Зашлакованность ядра! −10% к статам на ${CLOG_HOURS}ч`,
      },
    ],
  };
}

export function eatDish(p, itemId) {
  const item = ITEMS[itemId];
  if (!item || item.food !== 'useful') return { error: 'Это не полезная еда' };
  if (invCount(p, itemId) < 1) return { error: 'Нет блюда в инвентаре' };
  const base = logHealthyMeal({
    ...p,
    inventory: spendItems(p.inventory ?? emptyInventory(), { [itemId]: 1 }),
  });
  return {
    player: base.player,
    events: [{ type: 'energy', text: `«${item.name}»: Оптимизация метаболизма +${METABOLISM_BONUS * 100}% урон/XP на ${METABOLISM_HOURS}ч` }],
  };
}

export function useInventoryItem(p, itemId) {
  if (ITEMS[itemId]?.food === 'useful') return eatDish(p, itemId);
  if (itemId === 'focus_elixir') {
    if (invCount(p, itemId) < 1) return { error: 'Нет эликсира' };
    return {
      player: {
        ...p,
        inventory: spendItems(p.inventory ?? emptyInventory(), { focus_elixir: 1 }),
        buffs: { ...p.buffs, focusUntil: Date.now() + 2 * 3600000 },
      },
      events: [{ type: 'energy', text: 'Эликсир Фокуса: +10% XP и бонус к Начертанию на 2ч' }],
    };
  }
  if (itemId === 'recovery_rune') {
    if (invCount(p, itemId) < 1) return { error: 'Нет руны' };
    const gain = Math.min(5, p.maxAp - p.ap);
    if (gain <= 0) return { error: 'Энергия уже полная' };
    return {
      player: {
        ...p,
        ap: p.ap + gain,
        inventory: spendItems(p.inventory ?? emptyInventory(), { recovery_rune: 1 }),
      },
      events: [{ type: 'energy', text: `Руна Восстановления: +${gain} AP` }],
    };
  }
  if (itemId === 'cheatmeal_scroll') return { error: 'Свиток срабатывает при записи фастфуда' };
  return { error: 'Предмет нельзя использовать' };
}

/* ---------- магазин гоблина ---------- */

// Цены отталкиваются от дропа ~0.017 с моба (≈1 «цент» = 0.001).
export const SHOP_SELL = [
  { item: 'copper_ore', price: 0.008, label: 'Медная руда' },
  { item: 'wood', price: 0.005, label: 'Древесина' },
];

export const SHOP_BUY = [
  { item: 'cheatmeal_scroll', price: 0.8, name: 'Свиток Читмила', priceLabel: '0.800 Палиум' },
  { item: 'focus_elixir', price: 0.25, name: 'Эликсир Фокуса', priceLabel: '0.250 Палиум' },
  { item: 'recovery_rune', price: 0.35, name: 'Руна Восстановления', priceLabel: '0.350 Палиум' },
];

export function sellToGoblin(p, itemId, amount = 1) {
  const offer = SHOP_SELL.find((s) => s.item === itemId);
  if (!offer) return { error: 'Гоблин это не покупает' };
  const n = Math.max(1, Math.floor(Number(amount) || 0));
  if (invCount(p, itemId) < n) return { error: 'Недостаточно ресурсов' };
  const gain = p3(offer.price * n);
  return {
    player: {
      ...p,
      palium: addPalium(p.palium, gain),
      inventory: spendItems(p.inventory ?? emptyInventory(), { [itemId]: n }),
      world: { ...(p.world ?? {}), sold: (p.world?.sold ?? 0) + n },
    },
    events: [{ type: 'gain', text: `Гоблин купил ${n}× ${ITEMS[itemId].name} за ${formatMoney(gain)}` }],
  };
}

export function buyFromGoblin(p, itemId) {
  const offer = SHOP_BUY.find((s) => s.item === itemId);
  if (!offer) return { error: 'Нет в ассортименте' };
  if ((p.palium ?? 0) + 1e-9 < offer.price) {
    return { error: `Нужно ${offer.priceLabel} (у вас ${formatMoney(p.palium)})` };
  }
  return {
    player: {
      ...p,
      palium: addPalium(p.palium, -offer.price),
      inventory: addItem(p.inventory ?? emptyInventory(), itemId, 1),
      world: { ...(p.world ?? {}), bought: (p.world?.bought ?? 0) + 1 },
    },
    events: [{ type: 'title', text: `Куплено: ${offer.name} (−${offer.priceLabel})` }],
  };
}
