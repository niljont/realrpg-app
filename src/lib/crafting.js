import { bagFreeSlots } from './equipment';
import { levelFromXp } from './game';
import { rollGeneratedItem } from './loot';
import { ITEMS, canAfford, invCount } from './world';

export const CRAFT_PROFESSIONS = [
  {
    id: 'smith',
    title: 'Кузнечное дело',
    color: '#f59e0b',
    blurb: 'Оружие, щиты и латы из руды.',
  },
  {
    id: 'leather',
    title: 'Кожевничество',
    color: '#d97706',
    blurb: 'Кожаная броня из шкур.',
  },
  {
    id: 'tailor',
    title: 'Портняжное дело',
    color: '#a78bfa',
    blurb: 'Тканевые одеяния из трав и водорослей.',
  },
  {
    id: 'alchemy',
    title: 'Алхимия',
    color: '#34d399',
    blurb: 'Зелья, камни энергии и оружие мага.',
  },
  {
    id: 'jewel',
    title: 'Ювелирное дело',
    color: '#22d3ee',
    blurb: 'Кольца, амулеты и талисманы для любого пути.',
  },
];

export const CRAFT_RECIPES = [
  {
    id: 'smith_blade',
    profession: 'smith',
    name: 'Клинок воина',
    blurb: 'Меч, топор, булава или двуручное оружие',
    ap: 3,
    cost: { copper_ore: 2, iron_ore: 1 },
    match: (bp) => bp.arch === 'warrior' && bp.kind === 'weapon' && bp.dmg,
  },
  {
    id: 'smith_shield',
    profession: 'smith',
    name: 'Щит',
    blurb: 'Щит воина или стража',
    ap: 2,
    cost: { iron_ore: 2, tin_ore: 1 },
    match: (bp) => (bp.arch === 'warrior' || bp.arch === 'warden') && bp.grip === 'offHand',
  },
  {
    id: 'smith_plate',
    profession: 'smith',
    name: 'Латный доспех',
    blurb: 'Случайная часть тяжёлого сета',
    ap: 2,
    cost: { iron_ore: 2, copper_ore: 1 },
    match: (bp) => bp.arch === 'warrior' && bp.kind === 'armor',
  },
  {
    id: 'smith_warden',
    profession: 'smith',
    name: 'Доспех стража',
    blurb: 'Случайная часть сета на выносливость',
    ap: 2,
    cost: { iron_ore: 1, beast_bone: 2 },
    match: (bp) => bp.arch === 'warden' && bp.kind === 'armor',
  },
  {
    id: 'smith_rogue',
    profession: 'smith',
    name: 'Клинок ловкача',
    blurb: 'Кинжал, короткий меч или копьё',
    ap: 3,
    cost: { iron_ore: 2, copper_ore: 1 },
    match: (bp) => bp.arch === 'rogue' && bp.kind === 'weapon' && bp.dmg && bp.noun !== 'лук',
  },
  {
    id: 'smith_bow',
    profession: 'smith',
    name: 'Охотничий лук',
    blurb: 'Древко, тетива и металлическая оковка',
    ap: 3,
    cost: { wood: 2, resin: 1 },
    match: (bp) => bp.noun === 'лук',
  },
  {
    id: 'leather_armor',
    profession: 'leather',
    name: 'Кожаный доспех',
    blurb: 'Случайная часть кожаного сета',
    ap: 2,
    cost: { raw_hide: 2, beast_bone: 1 },
    match: (bp) => bp.arch === 'rogue' && bp.kind === 'armor',
  },
  {
    id: 'leather_stitched',
    profession: 'leather',
    name: 'Прошитая кожа',
    blurb: 'Тот же сет, смола вместо кости',
    ap: 2,
    cost: { raw_hide: 2, resin: 1 },
    match: (bp) => bp.arch === 'rogue' && bp.kind === 'armor',
  },
  {
    id: 'tailor_cloth',
    profession: 'tailor',
    name: 'Одеяние мага',
    blurb: 'Случайная часть тканевого сета',
    ap: 2,
    cost: { wild_herbs: 2, moonpetal: 1 },
    match: (bp) => bp.arch === 'mage' && bp.kind === 'armor',
  },
  {
    id: 'tailor_kelp',
    profession: 'tailor',
    name: 'Накидка из водорослей',
    blurb: 'Тот же тканевый сет, другое сырьё',
    ap: 2,
    cost: { kelp: 2, wild_herbs: 1 },
    match: (bp) => bp.arch === 'mage' && bp.kind === 'armor',
  },
  {
    id: 'alch_hp',
    profession: 'alchemy',
    name: 'Зелье лечения',
    blurb: 'Восстанавливает 25 HP',
    ap: 2,
    cost: { wild_herbs: 2, shadowroot: 1 },
    product: 'health_potion',
  },
  {
    id: 'alch_rune',
    profession: 'alchemy',
    name: 'Камень энергии',
    blurb: 'Восстанавливает 5 AP',
    ap: 2,
    cost: { mana_dust: 1, resin: 1 },
    product: 'recovery_rune',
  },
  {
    id: 'alch_focus',
    profession: 'alchemy',
    name: 'Эликсир фокуса',
    blurb: '+10% XP на 2 часа',
    ap: 2,
    cost: { moonpetal: 1, glowcap: 1 },
    product: 'focus_elixir',
  },
  {
    id: 'alch_weapon',
    profession: 'alchemy',
    name: 'Оружие мага',
    blurb: 'Посох, жезл или сфера',
    ap: 3,
    cost: { glowcap: 1, mana_dust: 1 },
    match: (bp) => bp.arch === 'mage' && bp.kind === 'weapon',
  },
  {
    id: 'alch_void',
    profession: 'alchemy',
    name: 'Пустотный фокус',
    blurb: 'Оружие мага. Редкость не ниже зелёной',
    ap: 3,
    minQuality: 'uncommon',
    cost: { void_shard: 1, mana_dust: 1 },
    match: (bp) => bp.arch === 'mage' && bp.kind === 'weapon',
  },
  {
    id: 'jewel_warrior',
    profession: 'jewel',
    name: 'Украшение воина',
    blurb: 'Кольцо, амулет или талисман силы',
    ap: 2,
    cost: { copper_ore: 2, tin_ore: 1 },
    match: (bp) => bp.arch === 'warrior' && bp.kind === 'accessory',
  },
  {
    id: 'jewel_rogue',
    profession: 'jewel',
    name: 'Украшение ловкача',
    blurb: 'Кольцо, амулет или талисман ловкости',
    ap: 2,
    cost: { tin_ore: 1, resin: 1 },
    match: (bp) => bp.arch === 'rogue' && bp.kind === 'accessory',
  },
  {
    id: 'jewel_mage',
    profession: 'jewel',
    name: 'Украшение мага',
    blurb: 'Кольцо, амулет или талисман интеллекта',
    ap: 2,
    cost: { mana_dust: 1, moonpetal: 1 },
    match: (bp) => bp.arch === 'mage' && bp.kind === 'accessory',
  },
  {
    id: 'jewel_warden',
    profession: 'jewel',
    name: 'Украшение стража',
    blurb: 'Кольцо, амулет или талисман выносливости',
    ap: 2,
    cost: { copper_ore: 1, tin_ore: 1 },
    match: (bp) => bp.arch === 'warden' && bp.kind === 'accessory',
  },
  {
    id: 'jewel_void',
    profession: 'jewel',
    name: 'Пустотная оправа',
    blurb: 'Бижутерия любого пути. Редкость не ниже зелёной',
    ap: 2,
    minQuality: 'uncommon',
    cost: { void_shard: 1, mana_dust: 1 },
    match: (bp) => bp.kind === 'accessory',
  },
];

const QUALITY_ORDER = ['common', 'uncommon', 'rare', 'epic'];

export function emptyCraftSkills() {
  return { smith: 0, leather: 0, tailor: 0, alchemy: 0, jewel: 0 };
}

export function craftSkillOf(p, professionId) {
  return Math.max(0, Math.floor(Number(p?.craftSkills?.[professionId]) || 0));
}

export function craftRank(skill) {
  if (skill >= 25) return 'Мастер';
  if (skill >= 12) return 'Подмастерье';
  if (skill >= 4) return 'Ученик';
  return 'Новичок';
}

/** Чем выше навык, тем чаще зелёные, синие и фиолетовые. */
export function craftQualityWeights(skill) {
  const s = Math.min(30, Math.max(0, skill));
  return [
    ['common', Math.max(280, 820 - s * 16)],
    ['uncommon', 150 + s * 8],
    ['rare', 24 + s * 5],
    ['epic', 6 + Math.floor(s * 1.1)],
  ];
}

function pickWeighted(rows) {
  const total = rows.reduce((sum, row) => sum + row[1], 0);
  let roll = Math.random() * total;
  for (const row of rows) {
    roll -= row[1];
    if (roll <= 0) return row[0];
  }
  return rows[rows.length - 1][0];
}

function raiseQuality(quality, minQuality) {
  if (!minQuality) return quality;
  return QUALITY_ORDER.indexOf(quality) < QUALITY_ORDER.indexOf(minQuality) ? minQuality : quality;
}

function spendCost(inv, cost) {
  const next = { ...inv };
  for (const [id, n] of Object.entries(cost)) next[id] = Math.max(0, (next[id] ?? 0) - n);
  return next;
}

export function recipeCostStatus(p, recipe) {
  return Object.entries(recipe.cost).map(([id, need]) => ({
    id,
    need,
    have: invCount(p, id),
    ok: invCount(p, id) >= need,
  }));
}

export function craftRecipe(p, recipeId) {
  const recipe = CRAFT_RECIPES.find((row) => row.id === recipeId);
  if (!recipe) return { error: 'Рецепт не найден' };
  const profession = CRAFT_PROFESSIONS.find((row) => row.id === recipe.profession);
  if ((p.ap ?? 0) < recipe.ap) {
    return { error: 'Недостаточно энергии! Выполните силовую тренировку через [+]' };
  }
  if (!canAfford(p, recipe.cost)) return { error: 'Не хватает ресурсов' };

  const skill = craftSkillOf(p, recipe.profession);
  const nextSkills = { ...emptyCraftSkills(), ...(p.craftSkills ?? {}), [recipe.profession]: skill + 1 };
  const spent = spendCost(p.inventory ?? {}, recipe.cost);

  if (recipe.product) {
    const have = invCount(p, recipe.product);
    if (have <= 0 && bagFreeSlots(p) < 1) return { error: 'Инвентарь полон' };
    const proto = ITEMS[recipe.product];
    if (!proto) return { error: 'Неизвестный предмет' };
    return {
      player: {
        ...p,
        ap: p.ap - recipe.ap,
        inventory: { ...spent, [recipe.product]: have + 1 },
        craftSkills: nextSkills,
        world: { ...(p.world ?? {}), crafted: (p.world?.crafted ?? 0) + 1 },
      },
      crafted: { ...proto, amount: 1 },
      events: [],
      daily: { action: 'craft', amount: 1 },
    };
  }

  if (bagFreeSlots(p) < 1) return { error: 'Инвентарь полон' };

  const quality = raiseQuality(pickWeighted(craftQualityWeights(skill)), recipe.minQuality);
  const level = Math.max(1, levelFromXp(p?.xp ?? 0).level);
  const item = rollGeneratedItem(Math.random, level, quality, recipe.match);
  if (!item) return { error: 'Не удалось создать предмет' };

  item.id = `gen_c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  item.desc = `${item.desc} Сработано: ${profession?.title ?? 'ремесло'}.`;

  return {
    player: {
      ...p,
      ap: p.ap - recipe.ap,
      inventory: { ...spent, [item.id]: 1 },
      generatedGear: { ...(p.generatedGear ?? {}), [item.id]: item },
      craftSkills: nextSkills,
      world: { ...(p.world ?? {}), crafted: (p.world?.crafted ?? 0) + 1 },
    },
    crafted: item,
    events: [],
    daily: { action: 'craft', amount: 1 },
  };
}
