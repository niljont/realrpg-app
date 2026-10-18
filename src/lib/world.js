import {
  CLOG_HOURS,
  METABOLISM_BONUS,
  METABOLISM_HOURS,
  activeEffect,
  addPalium,
  dayKey,
  formatPalium,
  levelFromXp,
} from './game';
import { GEAR_ITEMS, healPlayer, sellInventoryItem as sellWeaponItem } from './equipment';

/* ---------- предметы ---------- */

const BASE_ITEMS = {
  /* --- добыча / кузня --- */
  copper_ore: {
    id: 'copper_ore',
    name: 'Медная руда',
    emoji: '🪨',
    color: '#b45309',
    desc: 'Сырьё Кузни и продажи',
    category: 'resource',
    sellPrice: 0.008,
  },
  iron_ore: {
    id: 'iron_ore',
    name: 'Железная руда',
    emoji: '⛏️',
    color: '#78716c',
    desc: 'Сырьё Кузни',
    category: 'resource',
    sellPrice: 0.01,
  },
  tin_ore: {
    id: 'tin_ore',
    name: 'Оловянная руда',
    emoji: '🪙',
    color: '#a8a29e',
    desc: 'Сырьё Кузни (сплавы)',
    category: 'resource',
    sellPrice: 0.009,
  },
  /* --- лес / плотницкое --- */
  wood: {
    id: 'wood',
    name: 'Древесина',
    emoji: '🪵',
    color: '#a16207',
    desc: 'Сырьё Плотницкого дела',
    category: 'resource',
    sellPrice: 0.005,
  },
  hardwood: {
    id: 'hardwood',
    name: 'Твёрдая древесина',
    emoji: '🌳',
    color: '#854d0e',
    desc: 'Сырьё Плотницкого дела',
    category: 'resource',
    sellPrice: 0.008,
  },
  resin: {
    id: 'resin',
    name: 'Смола',
    emoji: '🟡',
    color: '#ca8a04',
    desc: 'Сырьё Плотницкого дела и Алхимии',
    category: 'resource',
    sellPrice: 0.006,
  },
  /* --- травы / начертание / алхимия --- */
  wild_herbs: {
    id: 'wild_herbs',
    name: 'Дикие травы',
    emoji: '🌿',
    color: '#22c55e',
    desc: 'Сырьё Начертания и Кулинарии',
    category: 'resource',
    sellPrice: 0.004,
  },
  moonpetal: {
    id: 'moonpetal',
    name: 'Лунный лепесток',
    emoji: '🌙',
    color: '#a5b4fc',
    desc: 'Сырьё Алхимии и Начертания',
    category: 'resource',
    sellPrice: 0.007,
  },
  shadowroot: {
    id: 'shadowroot',
    name: 'Теневой корень',
    emoji: '🌑',
    color: '#6d28d9',
    desc: 'Сырьё Алхимии',
    category: 'resource',
    sellPrice: 0.008,
  },
  glowcap: {
    id: 'glowcap',
    name: 'Светящийся гриб',
    emoji: '🍄',
    color: '#34d399',
    desc: 'Сырьё Алхимии и Кулинарии',
    category: 'resource',
    sellPrice: 0.007,
  },
  /* --- вода / кухня --- */
  raw_fish: {
    id: 'raw_fish',
    name: 'Сырая рыба',
    emoji: '🐟',
    color: '#38bdf8',
    desc: 'Ингредиент Кулинарии',
    category: 'resource',
    sellPrice: 0.006,
  },
  river_mussel: {
    id: 'river_mussel',
    name: 'Речная мидия',
    emoji: '🐚',
    color: '#67e8f9',
    desc: 'Ингредиент Кулинарии',
    category: 'resource',
    sellPrice: 0.007,
  },
  kelp: {
    id: 'kelp',
    name: 'Водоросли',
    emoji: '🌊',
    color: '#14b8a6',
    desc: 'Ингредиент Кулинарии и Алхимии',
    category: 'resource',
    sellPrice: 0.005,
  },
  /* --- охота / кожевничество --- */
  raw_hide: {
    id: 'raw_hide',
    name: 'Сырая шкура',
    emoji: '🦌',
    color: '#d97706',
    desc: 'Сырьё Кожевничества',
    category: 'resource',
    sellPrice: 0.009,
  },
  beast_bone: {
    id: 'beast_bone',
    name: 'Кость зверя',
    emoji: '🦴',
    color: '#e7e5e4',
    desc: 'Сырьё Кожевничества и Кузни',
    category: 'resource',
    sellPrice: 0.007,
  },
  /* --- мистика / чародейство --- */
  mana_dust: {
    id: 'mana_dust',
    name: 'Мана-пыль',
    emoji: '✨',
    color: '#818cf8',
    desc: 'Сырьё Чародейства и Начертания',
    category: 'resource',
    sellPrice: 0.012,
  },
  void_shard: {
    id: 'void_shard',
    name: 'Осколок пустоты',
    emoji: '💠',
    color: '#c084fc',
    desc: 'Редкое сырьё Чародейства',
    category: 'resource',
    sellPrice: 0.02,
  },
  magic_ink: { id: 'magic_ink', name: 'Магические Чернила', emoji: '🖋️', color: '#a855f7', desc: '15 мин языка → +1 чернило', category: 'craft', sellPrice: 0.01 },
  cheatmeal_scroll: {
    id: 'cheatmeal_scroll',
    name: 'Свиток Читмила',
    emoji: '📜',
    color: '#eab308',
    desc: 'Используй из инвентаря: снимает Зашлакованность или готовит защиту на следующий срыв (фастфуд без штрафа).',
    category: 'scroll',
    usable: true,
    sellPrice: 0.2,
  },
  focus_elixir: {
    id: 'focus_elixir',
    name: 'Эликсир Фокуса',
    emoji: '🧪',
    color: '#3b82f6',
    desc: '+10% XP на 2 часа',
    category: 'consumable',
    usable: true,
    sellPrice: 0.08,
  },
  recovery_rune: {
    id: 'recovery_rune',
    name: 'Камень Энергии',
    emoji: '💎',
    color: '#22d3ee',
    desc: 'Восстанавливает 5 AP',
    category: 'consumable',
    usable: true,
    sellPrice: 0.1,
  },
  health_potion: {
    id: 'health_potion',
    name: 'Зелье лечения',
    emoji: '❤️',
    color: '#ef4444',
    desc: 'Восстанавливает 25 HP',
    category: 'consumable',
    usable: true,
    sellPrice: 0.012,
  },
  dish_grilled_fish: { id: 'dish_grilled_fish', name: 'Жареная рыба', emoji: '🍳', color: '#f97316', desc: 'Здоровая еда · Оптимизация метаболизма +15% урон/XP на 8ч', category: 'food', food: 'useful', usable: true, sellPrice: 0.01 },
  dish_herb_fish: { id: 'dish_herb_fish', name: 'Рыба на травах', emoji: '🍲', color: '#f97316', desc: 'Здоровая еда · Оптимизация метаболизма +15% урон/XP на 8ч', category: 'food', food: 'useful', usable: true, sellPrice: 0.012 },
  dish_fish_stew: { id: 'dish_fish_stew', name: 'Уха Системы', emoji: '🍜', color: '#ef4444', desc: 'Здоровая еда · Оптимизация метаболизма +15% урон/XP на 8ч', category: 'food', food: 'useful', usable: true, sellPrice: 0.014 },
  dish_herb_broth: { id: 'dish_herb_broth', name: 'Отвар трав', emoji: '🍵', color: '#22c55e', desc: 'Здоровая еда · Оптимизация метаболизма +15% урон/XP на 8ч', category: 'food', food: 'useful', usable: true, sellPrice: 0.008 },
};

export const ITEMS = { ...BASE_ITEMS, ...GEAR_ITEMS };

export const emptyInventory = () => Object.fromEntries(Object.keys(ITEMS).map((id) => [id, 0]));

export const invCount = (p, id) => p.inventory?.[id] ?? 0;

export function listInventory(player) {
  const inv = player?.inventory ?? {};
  const rows = [];
  for (const [id, raw] of Object.entries(inv)) {
    const count = Number(raw) || 0;
    if (count <= 0) continue;
    const item = ITEMS[id] ?? player?.generatedGear?.[id];
    if (item) rows.push({ item, count });
  }
  return rows;
}

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

const MS_15 = 15 * 60 * 1000;
const MS_30 = 30 * 60 * 1000;
const MS_45 = 45 * 60 * 1000;

/** Категории сбора: стабильный id (для КД), пул названий мест + таблица дропа. */
export const WORLD_NODES = [
  {
    id: 'copper_vein',
    emoji: '🪨',
    color: '#b45309',
    apCost: 2,
    cooldownMs: MS_30,
    sites: [
      { name: 'Медная рудная жила', blurb: 'Жила мерцает тусклым металлом' },
      { name: 'Заброшенный карьер', blurb: 'Стены иссечены кирками давно ушедших охотников' },
      { name: 'Скалистый уступ', blurb: 'В трещинах блестит руда под полуденным солнцем' },
      { name: 'Шахта Гулкого эха', blurb: 'Каждый удар отдаётся гулом в глубине' },
      { name: 'Железная осыпь', blurb: 'Красноватая пыль оседает на перчатках' },
      { name: 'Оловянный разлом', blurb: 'Мягкий металл легко отделяется от породы' },
    ],
    lootTable: [
      { item: 'copper_ore', min: 1, max: 2, weight: 50 },
      { item: 'iron_ore', min: 1, max: 2, weight: 35 },
      { item: 'tin_ore', min: 1, max: 1, weight: 15 },
    ],
    bonus: { chance: 0.1, item: 'mana_dust', min: 1, max: 1 },
  },
  {
    id: 'ancient_forest',
    emoji: '🌲',
    color: '#15803d',
    apCost: 2,
    cooldownMs: MS_30,
    sites: [
      { name: 'Вековой лес', blurb: 'Сучья и стволы, полные смолы' },
      { name: 'Туманная роща', blurb: 'Стволы скрыты пеленой — слышен только треск коры' },
      { name: 'Бурелом у кромки', blurb: 'Буря уже сделала половину работы' },
      { name: 'Сосновый хребет', blurb: 'Хвоя хрустит под ногами, смола липнет к топору' },
      { name: 'Дубовая чаща', blurb: 'Тяжёлые стволы не сдаются без боя' },
      { name: 'Пепельный лес', blurb: 'Чёрные стволы хранят тепло старого пожара' },
    ],
    lootTable: [
      { item: 'wood', min: 1, max: 3, weight: 55 },
      { item: 'hardwood', min: 1, max: 2, weight: 30 },
      { item: 'resin', min: 1, max: 2, weight: 15 },
    ],
  },
  {
    id: 'herb_bush',
    emoji: '🌿',
    color: '#22c55e',
    apCost: 1,
    cooldownMs: MS_15,
    sites: [
      { name: 'Куст целебных трав', blurb: 'Аромат, от которого кружится голова' },
      { name: 'Лунная поляна', blurb: 'Лепестки светятся слабым серебристым светом' },
      { name: 'Тенистый овраг', blurb: 'Корни тянутся к тёмной влаге' },
      { name: 'Грибной косогор', blurb: 'Шляпки мерцают, будто живые угольки' },
      { name: 'Аптекарский склон', blurb: 'Здесь когда-то собирали зелья ученики' },
      { name: 'Роса на мху', blurb: 'Мелкие ростки прячутся между камней' },
    ],
    lootTable: [
      { item: 'wild_herbs', min: 1, max: 2, weight: 45 },
      { item: 'moonpetal', min: 1, max: 2, weight: 25 },
      { item: 'shadowroot', min: 1, max: 1, weight: 15 },
      { item: 'glowcap', min: 1, max: 2, weight: 15 },
    ],
  },
  {
    id: 'boiling_pool',
    emoji: '🐟',
    color: '#0ea5e9',
    apCost: 1,
    cooldownMs: MS_15,
    sites: [
      { name: 'Бурлящая заводь', blurb: 'Вода кипит — рыба сама прыгает в руки' },
      { name: 'Тихая заводь', blurb: 'Гладь воды отражает небо, пока не дёрнется поплавок' },
      { name: 'Каменистый берег', blurb: 'Между валунами прячутся мидии и водоросли' },
      { name: 'Устье туманной реки', blurb: 'Течение несёт добычу прямо к сети' },
      { name: 'Солёная лагуна', blurb: 'Воздух пахнет йодом и рыбьей чешуёй' },
      { name: 'Мост Старого дока', blurb: 'Под сваями плещется жирная добыча' },
    ],
    lootTable: [
      { item: 'raw_fish', min: 1, max: 2, weight: 55 },
      { item: 'river_mussel', min: 1, max: 2, weight: 25 },
      { item: 'kelp', min: 1, max: 2, weight: 20 },
    ],
  },
  {
    id: 'hunting_trail',
    emoji: '🦌',
    color: '#d97706',
    apCost: 2,
    cooldownMs: MS_30,
    sites: [
      { name: 'Звериная тропа', blurb: 'Свежие следы ведут в чащу' },
      { name: 'Охотничий перевал', blurb: 'Ветер несёт запах шкуры и крови' },
      { name: 'Логово у скал', blurb: 'Кости и клочья шерсти у входа' },
      { name: 'Сумеречная опушка', blurb: 'Звери выходят на водопой на закате' },
      { name: 'Костяной яр', blurb: 'Здесь охотились задолго до Системы' },
    ],
    lootTable: [
      { item: 'raw_hide', min: 1, max: 2, weight: 60 },
      { item: 'beast_bone', min: 1, max: 2, weight: 40 },
    ],
  },
  {
    id: 'rift_outcrop',
    emoji: '💠',
    color: '#818cf8',
    apCost: 3,
    cooldownMs: MS_45,
    sites: [
      { name: 'Разлом маны', blurb: 'Воздух искрит — пыль оседает на ладонях' },
      { name: 'Кристальный утёс', blurb: 'Грани режут свет на фиолетовые осколки' },
      { name: 'Пустотный карман', blurb: 'Звук пропадает, остаётся только гул Системы' },
      { name: 'Обсидиановый шрам', blurb: 'Земля когда-то треснула от чужого портала' },
      { name: 'Сияющая расселина', blurb: 'Мана стекает по стенам, как роса' },
    ],
    lootTable: [
      { item: 'mana_dust', min: 1, max: 2, weight: 75 },
      { item: 'void_shard', min: 1, max: 1, weight: 25 },
    ],
  },
];

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Название и описание точки на сегодня (меняются каждый день). */
export function pickNodeSite(node, now = Date.now()) {
  const sites = node.sites;
  if (!sites?.length) {
    return { name: node.name ?? 'Точка сбора', blurb: node.blurb ?? '' };
  }
  const idx = hashStr(`${dayKey(now)}:${node.id}`) % sites.length;
  return sites[idx];
}

export function nodeLootPreview(node) {
  const table = node.lootTable?.length ? node.lootTable : node.loot ? [node.loot] : [];
  return table.map((row) => ITEMS[row.item]).filter(Boolean);
}

export function nodeCooldownLeft(p, nodeId, now = Date.now()) {
  return Math.max(0, (p.nodeCooldowns?.[nodeId] ?? 0) - now);
}

export function formatCooldown(ms) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : `0:${String(r).padStart(2, '0')}`;
}

function rollAmount(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickWeighted(table) {
  const total = table.reduce((s, row) => s + (row.weight ?? 1), 0);
  let roll = Math.random() * total;
  for (const row of table) {
    roll -= row.weight ?? 1;
    if (roll <= 0) return row;
  }
  return table[table.length - 1];
}

function rollLootTable(node) {
  const table = node.lootTable?.length ? node.lootTable : node.loot ? [{ ...node.loot, weight: 1 }] : [];
  if (!table.length) return [];
  const primary = pickWeighted(table);
  const drops = [{ item: primary.item, amount: rollAmount(primary.min, primary.max) }];
  if (node.bonus && Math.random() < (node.bonus.chance ?? 0)) {
    drops.push({
      item: node.bonus.item,
      amount: rollAmount(node.bonus.min ?? 1, node.bonus.max ?? 1),
    });
  }
  return drops;
}

export function gatherNode(p, nodeId) {
  const node = WORLD_NODES.find((n) => n.id === nodeId);
  if (!node) return { error: 'Точка не найдена' };
  const now = Date.now();
  const left = nodeCooldownLeft(p, nodeId, now);
  if (left > 0) return { error: `Точка восстанавливается · ${formatCooldown(left)}` };
  if (p.ap < node.apCost) return { error: 'Недостаточно энергии! Выполните силовую тренировку через [+]' };

  const site = pickNodeSite(node, now);
  const drops = rollLootTable(node);
  let inv = p.inventory ?? emptyInventory();
  for (const drop of drops) inv = addItem(inv, drop.item, drop.amount);

  const lootText = drops.map((d) => `+${d.amount} ${ITEMS[d.item]?.name ?? d.item}`).join(', ');

  return {
    player: {
      ...p,
      ap: p.ap - node.apCost,
      inventory: inv,
      nodeCooldowns: { ...(p.nodeCooldowns ?? {}), [nodeId]: now + node.cooldownMs },
      world: { ...(p.world ?? {}), gathered: (p.world?.gathered ?? 0) + 1 },
    },
    events: [{ type: 'gain', text: `${site.name}: ${lootText}` }],
    daily: { action: 'gather', amount: 1 },
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
    archived: false,
    createdAt: Date.now(),
  };
  return {
    player: { ...p, customRecipes: [...(p.customRecipes ?? []), recipe] },
    events: [{ type: 'title', text: `Рецепт «${recipe.name}» добавлен в книгу` }],
  };
}

export function editCustomRecipe(p, recipeId, { name, notes, ingredients }) {
  const list = p.customRecipes ?? [];
  const idx = list.findIndex((r) => r.id === recipeId);
  if (idx < 0) return { error: 'Рецепт не найден' };
  const title = (name || '').trim();
  if (title.length < 2) return { error: 'Введите название рецепта' };
  const prev = list[idx];
  const updated = {
    ...prev,
    name: title,
    notes: (notes || '').trim(),
    ingredients: (ingredients || '').trim(),
    updatedAt: Date.now(),
  };
  const nextRecipes = [...list];
  nextRecipes[idx] = updated;
  return {
    player: { ...p, customRecipes: nextRecipes },
    events: [{ type: 'title', text: `Рецепт «${updated.name}» обновлён` }],
  };
}

export function archiveCustomRecipe(p, recipeId, archived = true) {
  const list = p.customRecipes ?? [];
  const idx = list.findIndex((r) => r.id === recipeId);
  if (idx < 0) return { error: 'Рецепт не найден' };
  const prev = list[idx];
  const updated = { ...prev, archived: Boolean(archived) };
  const nextRecipes = [...list];
  nextRecipes[idx] = updated;
  return {
    player: { ...p, customRecipes: nextRecipes },
    events: [
      {
        type: 'gain',
        text: archived ? `«${prev.name}» отправлен в архив` : `«${prev.name}» возвращён из архива`,
      },
    ],
  };
}

export function cookCustomRecipe(p, recipeId) {
  const list = p.customRecipes ?? [];
  const idx = list.findIndex((r) => r.id === recipeId);
  if (idx < 0) return { error: 'Рецепт не найден' };
  const recipe = list[idx];
  if (recipe.archived) return { error: 'Рецепт в архиве — сначала верните его' };
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
  const protectedByScroll = Boolean(p.buffs?.cheatmealReady);
  if (protectedByScroll) {
    const { cheatmealReady: _ready, ...restBuffs } = p.buffs ?? {};
    return {
      player: {
        ...p,
        buffs: restBuffs,
        world: {
          ...(p.world ?? {}),
          fastFood: (p.world?.fastFood ?? 0) + 1,
          scrollsUsed: (p.world?.scrollsUsed ?? 0) + 1,
        },
      },
      events: [{ type: 'title', text: 'Фастфуд / Срыв: защита Свитка Читмила — без штрафа' }],
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
      events: [{ type: 'energy', text: `Камень Энергии: +${gain} AP` }],
    };
  }
  if (itemId === 'health_potion') {
    if (invCount(p, itemId) < 1) return { error: 'Нет зелья' };
    const healed = healPlayer(p, 25);
    if (healed.error) return healed;
    return {
      player: {
        ...healed.player,
        inventory: spendItems(healed.player.inventory ?? emptyInventory(), { health_potion: 1 }),
      },
      events: [{ type: 'energy', text: `Зелье лечения: +${healed.gain} HP` }],
    };
  }
  if (itemId === 'cheatmeal_scroll') {
    if (invCount(p, itemId) < 1) return { error: 'Нет свитка' };
    const now = Date.now();
    const clogged = (p.buffs?.clogUntil ?? 0) > now || (p.buffs?.foodComaUntil ?? 0) > now;
    if (clogged) {
      return {
        player: {
          ...p,
          inventory: spendItems(p.inventory ?? emptyInventory(), { cheatmeal_scroll: 1 }),
          buffs: {
            ...p.buffs,
            clogUntil: 0,
            foodComaUntil: 0,
            cheatmealReady: false,
          },
          world: { ...(p.world ?? {}), scrollsUsed: (p.world?.scrollsUsed ?? 0) + 1 },
        },
        events: [{ type: 'title', text: 'Свиток Читмила: Зашлакованность снята' }],
      };
    }
    if (p.buffs?.cheatmealReady) {
      return { error: 'Защита свитка уже активна — запиши срыв, чтобы её потратить' };
    }
    return {
      player: {
        ...p,
        inventory: spendItems(p.inventory ?? emptyInventory(), { cheatmeal_scroll: 1 }),
        buffs: { ...p.buffs, cheatmealReady: true },
      },
      events: [{ type: 'title', text: 'Свиток Читмила активирован: следующий срыв без штрафа' }],
    };
  }
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
  { item: 'recovery_rune', price: 0.35, name: 'Камень Энергии', priceLabel: '0.350 Палиум' },
  { item: 'health_potion', price: 0.04, name: 'Зелье лечения', priceLabel: '0.040 Палиум' },
];

export function sellToGoblin(p, itemId, amount = 1) {
  const weaponSell = sellWeaponItem(p, itemId, amount);
  if (weaponSell.error !== 'not_weapon') return weaponSell;

  const item = ITEMS[itemId];
  const unit = item?.sellPrice ?? SHOP_SELL.find((s) => s.item === itemId)?.price;
  if (unit == null) return { error: 'Этот предмет нельзя продать' };
  const n = Math.max(1, Math.floor(Number(amount) || 0));
  if (invCount(p, itemId) < n) return { error: 'Недостаточно предметов' };
  const gain = p3(unit * n);
  return {
    player: {
      ...p,
      palium: addPalium(p.palium, gain),
      inventory: spendItems(p.inventory ?? emptyInventory(), { [itemId]: n }),
      world: { ...(p.world ?? {}), sold: (p.world?.sold ?? 0) + n },
    },
    events: [{ type: 'gain', text: `Продано: ${n}× ${item.name} за ${formatMoney(gain)}` }],
  };
}

export function buyFromGoblin(p, itemId) {
  const offer = SHOP_BUY.find((s) => s.item === itemId);
  if (!offer) return { error: 'Нет в ассортименте' };
  if ((p.palium ?? 0) + 1e-9 < offer.price) {
    return { error: `Нужно ${offer.priceLabel} (у вас ${formatMoney(p.palium)})` };
  }
  const have = invCount(p, itemId) > 0;
  const used = Object.values(p.inventory ?? {}).filter((n) => Number(n) > 0).length;
  if (!have && used >= 32) return { error: 'Инвентарь полон' };
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
