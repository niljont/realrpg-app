import {
  HP_REGEN_MS,
  addPalium,
  currentHp,
  damageMultiplier,
  formatPalium,
  getStats,
  levelFromXp,
  maxHp as baseMaxHp,
  statMultiplier,
  STAT_META,
  withHp,
} from './game';

export const BAG_SLOT_COUNT = 32;
export const COMBAT_AP_MAX = 3;

export const ITEM_QUALITY = {
  junk: { id: 'junk', label: 'Хлам', color: '#9ca3af' },
  common: { id: 'common', label: 'Обычное', color: '#f5f5f5' },
  uncommon: { id: 'uncommon', label: 'Необычное', color: '#1eff00' },
  rare: { id: 'rare', label: 'Редкое', color: '#0070dd' },
  epic: { id: 'epic', label: 'Эпическое', color: '#a335ee' },
};

export const GRIP_LABELS = {
  oneHand: 'Одноручное',
  twoHand: 'Двуручное',
  offHand: 'Левая рука',
};

export const SLOT_LABELS = {
  mainHand: 'Оружие',
  offHand: 'Левая',
  head: 'Голова',
  neck: 'Шея',
  shoulders: 'Плечи',
  chest: 'Грудь',
  wrists: 'Запястья',
  hands: 'Кисти',
  waist: 'Пояс',
  legs: 'Ноги',
  feet: 'Ступни',
  finger1: 'Кольцо',
  finger2: 'Кольцо',
  trinket1: 'Аксессуар',
  trinket2: 'Аксессуар',
};

export const EQUIP_SLOTS = Object.keys(SLOT_LABELS);

export function emptyEquipment() {
  return Object.fromEntries(EQUIP_SLOTS.map((s) => [s, null]));
}

export function qualityColor(item) {
  return ITEM_QUALITY[item?.quality]?.color ?? item?.color ?? '#a1a1aa';
}

const p3 = (n) => Math.round(n * 1000) / 1000;

function gear(def) {
  const buy = def.buyPrice ?? 0.01;
  return {
    quality: 'common',
    sellPrice: p3(buy * 0.35),
    ...def,
  };
}

/* ---------- оружие ---------- */

export const WEAPON_ITEMS = {
  sword_1h: gear({
    id: 'sword_1h',
    name: 'Одноручный меч',
    emoji: '🗡️',
    category: 'weapon',
    grip: 'oneHand',
    slot: 'weapon',
    req: { STR: 2 },
    damage: { min: 7, max: 10, type: 'physical' },
    scaling: { stat: 'STR', coeff: 1.5 },
    buyPrice: 0.015,
    desc: 'Стартовый клинок. Урон растёт от Силы.',
  }),
  sword_2h: gear({
    id: 'sword_2h',
    name: 'Двуручный меч',
    emoji: '⚔️',
    category: 'weapon',
    grip: 'twoHand',
    slot: 'weapon',
    req: { STR: 2 },
    damage: { min: 15, max: 20, type: 'physical' },
    scaling: { stat: 'STR', coeff: 2.5 },
    buyPrice: 0.028,
    desc: 'Тяжёлый двуручник. Занимает обе руки.',
  }),
  steel_shield: gear({
    id: 'steel_shield',
    name: 'Стальной щит',
    emoji: '🛡️',
    category: 'weapon',
    grip: 'offHand',
    slot: 'offHand',
    req: { END: 2 },
    armor: 5,
    blockPerEnd: 2,
    buyPrice: 0.018,
    desc: 'Щит в левую руку. Броня и блок от Выносливости.',
  }),
  dagger: gear({
    id: 'dagger',
    name: 'Кинжал',
    emoji: '🔪',
    category: 'weapon',
    grip: 'oneHand',
    slot: 'weapon',
    req: { AGI: 2 },
    damage: { min: 4, max: 6, type: 'physical' },
    scaling: { stat: 'AGI', coeff: 1.0 },
    critChance: 0.1,
    buyPrice: 0.012,
    desc: 'Быстрый клинок. Скейлинг от Ловкости, +10% крит.',
  }),
  hunting_spear: gear({
    id: 'hunting_spear',
    name: 'Охотничье копьё',
    emoji: '🔱',
    category: 'weapon',
    grip: 'twoHand',
    slot: 'weapon',
    req: { AGI: 2 },
    damage: { min: 12, max: 15, type: 'physical' },
    scaling: { stat: 'AGI', coeff: 1.8 },
    buyPrice: 0.025,
    desc: 'Двуручное копьё. Урон от Ловкости.',
  }),
  apprentice_staff: gear({
    id: 'apprentice_staff',
    name: 'Ученический посох',
    emoji: '🪄',
    category: 'weapon',
    grip: 'twoHand',
    slot: 'weapon',
    req: { INT: 2 },
    damage: { min: 14, max: 18, type: 'magic' },
    scaling: { stat: 'INT', coeff: 2.2 },
    buyPrice: 0.03,
    desc: 'Двуручный посох. Магический урон от Интеллекта.',
  }),
  magic_wand: gear({
    id: 'magic_wand',
    name: 'Магический жезл',
    emoji: '✨',
    category: 'weapon',
    grip: 'oneHand',
    slot: 'weapon',
    req: { INT: 2 },
    damage: { min: 6, max: 9, type: 'magic' },
    scaling: { stat: 'INT', coeff: 1.4 },
    buyPrice: 0.014,
    desc: 'Одноручный жезл. Магический урон от Интеллекта.',
  }),
};

function armorSet(prefix, pieces, reqStat, emojiBySlot) {
  const out = {};
  for (const [slot, name, armor, extras, price] of pieces) {
    const id = `${prefix}_${slot}`;
    out[id] = gear({
      id,
      name,
      emoji: emojiBySlot[slot] ?? '🧥',
      category: 'armor',
      slot,
      req: { [reqStat]: 2 },
      armor,
      ...extras,
      buyPrice: price,
      desc: `Стартовая броня. Требует ${STAT_META[reqStat].label} ≥ 2.`,
    });
  }
  return out;
}

const EMOJI_ARMOR = {
  head: '🪖',
  shoulders: '🦺',
  chest: '👕',
  wrists: '⌚',
  hands: '🧤',
  waist: '👔',
  legs: '👖',
  feet: '👢',
};

/** Тяжёлый сет (Сила) */
const HEAVY_ARMOR = armorSet(
  'heavy',
  [
    ['head', 'Шлем', 6, { hp: 8 }, 0.012],
    ['shoulders', 'Наплечники', 4, { hp: 5 }, 0.01],
    ['chest', 'Латный доспех', 12, { hp: 15 }, 0.02],
    ['wrists', 'Наручи', 2, { hp: 3 }, 0.006],
    ['hands', 'Латные рукавицы', 3, { hp: 5 }, 0.008],
    ['waist', 'Кованый пояс', 3, { hp: 4 }, 0.007],
    ['legs', 'Поножи', 8, { hp: 10 }, 0.015],
    ['feet', 'Латные сапоги', 4, { hp: 5 }, 0.009],
  ],
  'STR',
  EMOJI_ARMOR,
);

/** Средний сет (Ловкость) — crit/dodge в долях (0.03 = 3%) */
const MEDIUM_ARMOR = armorSet(
  'medium',
  [
    ['head', 'Кожаный капюшон', 3, { critChance: 0.03 }, 0.011],
    ['shoulders', 'Кожаные наплечники', 2, { dodgeChance: 0.02 }, 0.009],
    ['chest', 'Куртка следопыта', 7, { critChance: 0.05, dodgeChance: 0.04 }, 0.018],
    ['wrists', 'Кожаные браслеты', 1, { critChance: 0.02 }, 0.005],
    ['hands', 'Перчатки стрелка', 2, { critChance: 0.04 }, 0.008],
    ['waist', 'Пояс разведчика', 2, { dodgeChance: 0.02 }, 0.007],
    ['legs', 'Штаны из шкуры', 5, { critChance: 0.03, dodgeChance: 0.03 }, 0.014],
    ['feet', 'Мягкие сапоги', 2, { dodgeChance: 0.05 }, 0.009],
  ],
  'AGI',
  { ...EMOJI_ARMOR, head: 'hoodie', chest: '🧥', feet: '👟' },
);

// fix hoodie emoji
MEDIUM_ARMOR.medium_head.emoji = '🧢';

/** Лёгкий сет (Интеллект) — magicDmgMul и startShield */
const LIGHT_ARMOR = armorSet(
  'light',
  [
    ['head', 'Тканевый обруч', 1, { magicDmgMul: 0.06, startShield: 8 }, 0.01],
    ['shoulders', 'Мантия плеч', 1, { magicDmgMul: 0.04, startShield: 5 }, 0.008],
    ['chest', 'Одеяние послушника', 3, { magicDmgMul: 0.15, startShield: 20 }, 0.018],
    ['wrists', 'Тканевые манжеты', 1, { magicDmgMul: 0.03, startShield: 4 }, 0.005],
    ['hands', 'Перчатки ткача чар', 1, { magicDmgMul: 0.05, startShield: 5 }, 0.008],
    ['waist', 'Шелковый кушак', 1, { magicDmgMul: 0.04, startShield: 5 }, 0.007],
    ['legs', 'Тканевые бриджи', 2, { magicDmgMul: 0.08, startShield: 12 }, 0.014],
    ['feet', 'Сапоги заклинателя', 1, { magicDmgMul: 0.05, startShield: 6 }, 0.009],
  ],
  'INT',
  { ...EMOJI_ARMOR, head: '🎩', chest: '👘', feet: '🥿' },
);

export const ARMOR_ITEMS = { ...HEAVY_ARMOR, ...MEDIUM_ARMOR, ...LIGHT_ARMOR };

export const ACCESSORY_ITEMS = {
  amulet_seeker: gear({
    id: 'amulet_seeker',
    name: 'Амулет искателя',
    emoji: '📿',
    category: 'accessory',
    slot: 'neck',
    req: { END: 2 },
    hp: 12,
    buyPrice: 0.015,
    desc: 'Амулет. +12 Max HP. Требует Выносливость ≥ 2.',
  }),
  ring_copper_str: gear({
    id: 'ring_copper_str',
    name: 'Медное кольцо силы',
    emoji: '💍',
    category: 'accessory',
    slot: 'finger',
    req: { STR: 2 },
    physFlat: 2,
    buyPrice: 0.01,
    desc: 'Кольцо. +2 к физ. урону. Требует Сила ≥ 2.',
  }),
  trinket_anomaly_eye: gear({
    id: 'trinket_anomaly_eye',
    name: 'Глаз аномалии',
    emoji: '👁️',
    category: 'accessory',
    slot: 'trinket',
    req: { INT: 2 },
    trinketShield: 10,
    buyPrice: 0.02,
    desc: 'Аксессуар. Раз в бой восстанавливает 10 ед. Щита. Требует Интеллект ≥ 2.',
  }),
};

export const GEAR_ITEMS = { ...WEAPON_ITEMS, ...ARMOR_ITEMS, ...ACCESSORY_ITEMS };

export const SHOP_WEAPONS = Object.values(WEAPON_ITEMS);
export const SHOP_ARMOR = Object.values(ARMOR_ITEMS);
export const SHOP_ACCESSORIES = Object.values(ACCESSORY_ITEMS);

export const SHOP_CONSUMABLES = [
  { item: 'cheatmeal_scroll', price: 0.8, name: 'Свиток Читмила', emoji: '📜', desc: 'Снимает штраф или защищает следующий срыв' },
  { item: 'focus_elixir', price: 0.25, name: 'Эликсир Фокуса', emoji: '🧪', desc: '+10% XP на 2 часа' },
  { item: 'recovery_rune', price: 0.35, name: 'Камень Энергии', emoji: '💎', desc: 'Восстанавливает 5 AP (глобальных)' },
  {
    item: 'health_potion',
    price: 0.04,
    name: 'Зелье лечения',
    emoji: '❤️',
    desc: 'Восстанавливает 25 HP (вне боя и в Бреши)',
  },
];

/** Max HP статуса и Брешей: база + экипировка, с учётом штрафа зашлакованности. */
export function playerMaxHp(p) {
  const gear = getGearBonuses(p);
  return Math.max(1, Math.round((baseMaxHp(p) + (gear.hp ?? 0)) * statMultiplier(p)));
}

export function getPlayerHp(p) {
  return currentHp(p, playerMaxHp(p));
}

/** Пассивный реген HP: +1 / 15 мин. */
export function applyHpRegen(p, now = Date.now()) {
  if (!p) return { player: p, events: [], changed: false };
  // В активной Бреши HP ведёт бой — реген снаружи не крутим.
  if (p.breach?.active) {
    return { player: p, events: [], changed: false };
  }

  const max = playerMaxHp(p);
  let cur = currentHp(p, max);
  const last = p.lastHpTick ?? now;
  const ticks = Math.floor((now - last) / HP_REGEN_MS);
  let next = p;
  let changed = false;
  const events = [];

  if (ticks > 0) {
    const lastHpTick = last + ticks * HP_REGEN_MS;
    if (cur < max) {
      const gain = Math.min(ticks, max - cur);
      cur += gain;
      next = { ...withHp(p, cur, max), lastHpTick };
      if (gain > 0) events.push({ type: 'energy', text: `Реген HP: +${gain}` });
      changed = true;
    } else if (p.lastHpTick !== lastHpTick) {
      next = { ...p, lastHpTick };
      changed = true;
    }
  } else if (!p.lastHpTick) {
    next = { ...p, lastHpTick: now };
    changed = true;
  }

  const clamped = currentHp(next, max);
  if (next.hp != null && next.hp !== clamped) {
    next = withHp(next, clamped, max);
    changed = true;
  }

  return { player: next, events, changed };
}

/** Лечение: восстанавливает amount HP (или до max). */
export function healPlayer(p, amount) {
  const max = playerMaxHp(p);
  const cur = currentHp(p, max);
  if (cur >= max) return { error: 'HP уже полное' };
  const gain = Math.min(Math.max(0, Math.round(amount)), max - cur);
  if (gain <= 0) return { error: 'HP уже полное' };

  // В Бреши лечим и сессию, и общий пул.
  if (p.breach?.active) {
    const session = {
      ...p.breach,
      playerHp: Math.min(p.breach.playerMaxHp ?? max, (p.breach.playerHp ?? cur) + gain),
      playerMaxHp: p.breach.playerMaxHp ?? max,
      log: [...(p.breach.log ?? []), `[СИСТЕМА] Лечение: +${gain} HP.`],
    };
    return {
      player: { ...withHp(p, session.playerHp, max), breach: session },
      events: [{ type: 'energy', text: `+${gain} HP` }],
      gain,
    };
  }

  return {
    player: withHp(p, cur + gain, max),
    events: [{ type: 'energy', text: `+${gain} HP` }],
    gain,
  };
}

export function getGearItem(id, player) {
  if (!id) return null;
  return GEAR_ITEMS[id] ?? player?.generatedGear?.[id] ?? null;
}

export function isGearItem(item) {
  return Boolean(item && (item.category === 'weapon' || item.category === 'armor' || item.category === 'accessory' || item.grip));
}

export function isWeaponItem(item) {
  return Boolean(item && (item.category === 'weapon' || item.grip));
}

export function meetsReq(player, item) {
  if (!item) return false;
  if (item.reqLevel) {
    const lvl = levelFromXp(player?.xp ?? 0).level;
    if (lvl < item.reqLevel) return false;
  }
  const stats = getStats(player);
  const req = item.req ?? {};
  return Object.entries(req).every(([stat, need]) => (stats[stat] ?? 0) >= need);
}

export function reqStatus(player, item) {
  const stats = getStats(player);
  const rows = [];
  if (item?.reqLevel) {
    const current = levelFromXp(player?.xp ?? 0).level;
    rows.push({
      stat: 'LVL',
      need: item.reqLevel,
      current,
      ok: current >= item.reqLevel,
      label: 'Уровень',
    });
  }
  for (const [stat, need] of Object.entries(item?.req ?? {})) {
    rows.push({
      stat,
      need,
      current: stats[stat] ?? 0,
      ok: (stats[stat] ?? 0) >= need,
      label: STAT_META[stat]?.label ?? stat,
    });
  }
  return rows;
}

function invOf(p) {
  return { ...(p.inventory ?? {}) };
}

function eqOf(p) {
  return { ...emptyEquipment(), ...(p.equipment ?? {}) };
}

export function bagUsedCount(p) {
  return Object.values(p.inventory ?? {}).reduce((n, v) => n + (Number(v) > 0 ? 1 : 0), 0);
}

export function bagFreeSlots(p) {
  return Math.max(0, BAG_SLOT_COUNT - bagUsedCount(p));
}

function addInv(inv, id, n = 1) {
  return { ...inv, [id]: (inv[id] ?? 0) + n };
}

function spendInv(inv, id, n = 1) {
  return { ...inv, [id]: Math.max(0, (inv[id] ?? 0) - n) };
}

function unequipToBag(inv, eq, slot) {
  const id = eq[slot];
  if (!id) return { inv, eq };
  return { inv: addInv(inv, id, 1), eq: { ...eq, [slot]: null } };
}

/** Суммарные бонусы со всей экипировки. */
export function getGearBonuses(p) {
  const eq = eqOf(p);
  let armor = 0;
  let hp = 0;
  let critChance = 0;
  let dodgeChance = 0;
  let magicDmgMul = 0;
  let startShield = 0;
  let physFlat = 0;
  let hasShield = false;
  let shieldArmor = 0;
  let blockPerEnd = 0;
  let trinketShield = 0;

  for (const slot of EQUIP_SLOTS) {
    const item = getGearItem(eq[slot], p);
    if (!item) continue;
    armor += item.armor ?? 0;
    hp += item.hp ?? 0;
    critChance += item.critChance ?? 0;
    dodgeChance += item.dodgeChance ?? 0;
    magicDmgMul += item.magicDmgMul ?? 0;
    startShield += item.startShield ?? 0;
    physFlat += item.physFlat ?? 0;
    if (item.grip === 'offHand') {
      hasShield = true;
      shieldArmor += item.armor ?? 0;
      blockPerEnd += item.blockPerEnd ?? 0;
    }
    if (item.trinketShield) trinketShield = Math.max(trinketShield, item.trinketShield);
  }

  return {
    armor,
    hp,
    critChance: Math.min(0.75, critChance),
    dodgeChance: Math.min(0.6, dodgeChance),
    magicDmgMul,
    startShield,
    physFlat,
    hasShield,
    shieldArmor,
    blockPerEnd,
    trinketShield,
  };
}

export function resolveEquipSlot(item, preferSlot, eq) {
  if (!item) return null;
  if (item.grip === 'twoHand') return 'mainHand';
  if (item.grip === 'offHand') return 'offHand';
  if (item.grip === 'oneHand') {
    if (preferSlot === 'mainHand' || preferSlot === 'offHand') return preferSlot;
    return !eq.mainHand ? 'mainHand' : 'offHand';
  }
  if (item.slot === 'finger') {
    if (preferSlot === 'finger1' || preferSlot === 'finger2') return preferSlot;
    if (!eq.finger1) return 'finger1';
    return 'finger2';
  }
  if (item.slot === 'trinket') {
    if (preferSlot === 'trinket1' || preferSlot === 'trinket2') return preferSlot;
    if (!eq.trinket1) return 'trinket1';
    return 'trinket2';
  }
  if (item.slot && EQUIP_SLOTS.includes(item.slot)) return item.slot;
  return null;
}

export function canEquipTo(item, slot) {
  if (!item || !slot) return false;
  if (item.grip === 'twoHand') return slot === 'mainHand';
  if (item.grip === 'offHand') return slot === 'offHand';
  if (item.grip === 'oneHand') return slot === 'mainHand' || slot === 'offHand';
  if (item.slot === 'finger') return slot === 'finger1' || slot === 'finger2';
  if (item.slot === 'trinket') return slot === 'trinket1' || slot === 'trinket2';
  return item.slot === slot;
}

export function equipItem(p, itemId, preferSlot = null) {
  const item = getGearItem(itemId, p);
  if (!item) return { error: 'Это нельзя экипировать' };
  if ((p.inventory?.[itemId] ?? 0) < 1) return { error: 'Нет предмета в инвентаре' };
  if (!meetsReq(p, item)) {
    const bad = reqStatus(p, item).find((r) => !r.ok);
    return { error: `Требуется: ${bad.label} ${bad.need} (сейчас ${bad.current})` };
  }

  let inv = invOf(p);
  let eq = eqOf(p);
  inv = spendInv(inv, itemId, 1);

  const slot = resolveEquipSlot(item, preferSlot, eq);
  if (!slot || !canEquipTo(item, slot)) return { error: 'Неподходящий слот' };

  if (item.grip === 'twoHand') {
    ({ inv, eq } = unequipToBag(inv, eq, 'mainHand'));
    ({ inv, eq } = unequipToBag(inv, eq, 'offHand'));
    eq = { ...eq, mainHand: itemId, offHand: null };
  } else if (item.grip === 'offHand') {
    const mainItem = getGearItem(eq.mainHand, p);
    if (mainItem?.grip === 'twoHand') ({ inv, eq } = unequipToBag(inv, eq, 'mainHand'));
    ({ inv, eq } = unequipToBag(inv, eq, 'offHand'));
    eq = { ...eq, offHand: itemId };
  } else if (item.grip === 'oneHand') {
    const mainItem = getGearItem(eq.mainHand, p);
    if (mainItem?.grip === 'twoHand') {
      ({ inv, eq } = unequipToBag(inv, eq, 'mainHand'));
      ({ inv, eq } = unequipToBag(inv, eq, 'offHand'));
    }
    ({ inv, eq } = unequipToBag(inv, eq, slot));
    eq = { ...eq, [slot]: itemId };
  } else {
    ({ inv, eq } = unequipToBag(inv, eq, slot));
    eq = { ...eq, [slot]: itemId };
  }

  if (bagUsedCount({ inventory: inv }) > BAG_SLOT_COUNT) {
    return { error: 'Нет места в инвентаре, чтобы снять текущее снаряжение' };
  }

  const equipped = { ...p, inventory: inv, equipment: eq };
  const max = playerMaxHp(equipped);
  return {
    player: withHp(equipped, currentHp(equipped, max), max),
    events: [{ type: 'title', text: `Экипировано: ${item.name}` }],
  };
}

export function unequipSlot(p, slot) {
  if (!EQUIP_SLOTS.includes(slot)) return { error: 'Неизвестный слот' };
  const eq = eqOf(p);
  const id = eq[slot];
  if (!id) return { error: 'Слот пуст' };
  if ((p.inventory?.[id] ?? 0) <= 0 && bagFreeSlots(p) < 1) {
    return { error: 'Нет свободного слота в инвентаре' };
  }
  const { inv, eq: nextEq } = unequipToBag(invOf(p), eq, slot);
  const item = getGearItem(id, p);
  const unequipped = { ...p, inventory: inv, equipment: nextEq };
  const max = playerMaxHp(unequipped);
  return {
    player: withHp(unequipped, currentHp(unequipped, max), max),
    events: [{ type: 'gain', text: `Снято: ${item?.name ?? id}` }],
  };
}

export function buyGear(p, itemId, rawAmount = 1) {
  const staticItem = GEAR_ITEMS[itemId] ?? null;
  const offer = (p.vendorStock?.offers ?? []).find((row) => row.id === itemId) ?? null;
  const item = staticItem ?? offer ?? p.generatedGear?.[itemId] ?? null;
  if (!staticItem && !offer) return { error: 'Этой вещи уже нет в лавке' };
  if (!item || (item.buyPrice == null && item.buyPrice !== 0)) return { error: 'Нет в ассортименте' };
  const count = staticItem ? Math.max(1, Math.min(99, Math.floor(Number(rawAmount) || 1))) : 1;
  const price = p3((item.buyPrice ?? 0) * count);
  if ((p.palium ?? 0) + 1e-9 < price) {
    return { error: `Нужно ${formatPalium(price)} Палиум (у вас ${formatPalium(p.palium)})` };
  }
  const have = (p.inventory?.[itemId] ?? 0) > 0;
  if (!have && bagFreeSlots(p) < 1) return { error: 'Инвентарь полон' };

  let generatedGear = p.generatedGear ?? {};
  let vendorStock = p.vendorStock ?? null;
  if (offer) {
    generatedGear = { ...generatedGear, [itemId]: { ...offer } };
    vendorStock = {
      ...p.vendorStock,
      offers: (p.vendorStock?.offers ?? []).filter((row) => row.id !== itemId),
    };
  }

  return {
    player: {
      ...p,
      palium: addPalium(p.palium, -price),
      inventory: addInv(invOf(p), itemId, count),
      generatedGear,
      vendorStock,
      world: { ...(p.world ?? {}), bought: (p.world?.bought ?? 0) + count },
    },
    events: [{ type: 'title', text: `Куплено: ${count}× ${item.name} (−${formatPalium(price)} Палиум)` }],
  };
}

/** @deprecated use buyGear */
export const buyWeapon = buyGear;

export function sellInventoryItem(p, itemId, amount = 1) {
  const item = getGearItem(itemId, p);
  if (!item) return { error: 'not_weapon' };
  const n = Math.max(1, Math.floor(Number(amount) || 0));
  if ((p.inventory?.[itemId] ?? 0) < n) return { error: 'Недостаточно предметов' };
  const price = item.sellPrice ?? 0;
  const gain = p3(price * n);
  const inventory = spendInv(invOf(p), itemId, n);
  let generatedGear = p.generatedGear;
  if (generatedGear?.[itemId] && (inventory[itemId] ?? 0) <= 0) {
    const worn = Object.values(p.equipment ?? {}).includes(itemId);
    if (!worn) {
      generatedGear = { ...generatedGear };
      delete generatedGear[itemId];
    }
  }
  return {
    player: {
      ...p,
      palium: addPalium(p.palium, gain),
      inventory,
      generatedGear,
      world: { ...(p.world ?? {}), sold: (p.world?.sold ?? 0) + n },
    },
    events: [{ type: 'gain', text: `Продано: ${n}× ${item.name} за ${formatPalium(gain)} Палиум` }],
  };
}

export function attackApCost(p) {
  const main = getGearItem(eqOf(p).mainHand, p);
  if (!main?.damage) return 1;
  if (main.damage.type === 'magic') return 2;
  if (main.grip === 'twoHand') return 2;
  return 1;
}

function rollOneWeapon(weapon, stats, dmgMul, gear) {
  if (!weapon?.damage) return { dmg: 0, crit: false, magic: false };
  const { min, max, type } = weapon.damage;
  const base = min + Math.random() * (max - min);
  const coeff = weapon.scaling?.coeff ?? 0;
  const statKey = weapon.scaling?.stat;
  const scale = statKey ? (stats[statKey] ?? 0) * coeff : 0;
  let dmg = (base + scale) * dmgMul;
  if (type === 'magic') dmg *= 1 + (gear.magicDmgMul ?? 0);
  else dmg += gear.physFlat ?? 0;
  let crit = false;
  const critChance = (weapon.critChance ?? 0) + (gear.critChance ?? 0);
  if (Math.random() < critChance) {
    dmg *= 1.5;
    crit = true;
  }
  return { dmg: Math.max(1, Math.floor(dmg)), crit, magic: type === 'magic' };
}

export function rollPlayerAttack(p) {
  const stats = getStats(p);
  const dmgMul = damageMultiplier(p);
  const gear = getGearBonuses(p);
  const eq = eqOf(p);
  const main = getGearItem(eq.mainHand, p);
  const off = getGearItem(eq.offHand, p);
  const parts = [];
  let total = 0;
  let anyCrit = false;
  let anyMagic = false;

  if (main?.damage) {
    const r = rollOneWeapon(main, stats, dmgMul, gear);
    total += r.dmg;
    anyCrit = anyCrit || r.crit;
    anyMagic = anyMagic || r.magic;
    parts.push(main.name);
  }
  if (off?.damage) {
    const r = rollOneWeapon(off, stats, dmgMul, gear);
    total += r.dmg;
    anyCrit = anyCrit || r.crit;
    anyMagic = anyMagic || r.magic;
    parts.push(off.name);
  }

  if (total <= 0) {
    const fist = Math.max(
      1,
      Math.floor((1.5 + stats.STR * 1.65 + (gear.physFlat ?? 0) + Math.floor(Math.random() * (1 + stats.STR * 0.6))) * dmgMul),
    );
    return { dmg: fist, crit: false, magic: false, label: 'безоружный удар', apCost: 1 };
  }

  return {
    dmg: total,
    crit: anyCrit,
    magic: anyMagic,
    label: parts.join(' + '),
    apCost: attackApCost(p),
  };
}

/**
 * Входящий урон с учётом брони / стойки / блока щита.
 * Броня режет процент (не плоско), иначе фулл-сет на старте делает мобов беззубыми.
 * reduction = armor / (armor + 55) → 24 брони ≈ 30%, 42 ≈ 43%, 80 ≈ 59%.
 */
export function mitigateIncoming(p, rawDamage, { stanceReduce = 0, absorb = 0 } = {}) {
  const gear = getGearBonuses(p);
  const armor = gear.armor ?? 0;
  const raw = Math.max(0, rawDamage);
  const reduction = armor > 0 ? armor / (armor + 55) : 0;
  let dmg = Math.max(1, Math.round(raw * (1 - reduction)));
  if (raw <= 0) dmg = 0;
  if (stanceReduce > 0) dmg = Math.max(0, Math.floor(dmg * (1 - stanceReduce)));
  if (absorb > 0) {
    const used = Math.min(absorb, dmg);
    dmg -= used;
    absorb -= used;
  }
  return { damage: Math.max(0, dmg), absorbLeft: absorb, armor };
}

export function formatWeaponDamageLine(item, player) {
  if (!item?.damage) return null;
  const stats = player ? getStats(player) : null;
  const scale = item.scaling;
  const scaleTxt = scale ? `+${scale.coeff} × ${STAT_META[scale.stat]?.label ?? scale.stat}` : '';
  const typeTxt = item.damage.type === 'magic' ? 'Маг. урон' : 'Урон';
  let est = '';
  if (stats && scale) {
    const bonus = (stats[scale.stat] ?? 0) * (scale.coeff ?? 0);
    est = ` · сейчас ~${Math.floor(item.damage.min + bonus)}–${Math.floor(item.damage.max + bonus)}`;
  }
  return `${typeTxt}: ${item.damage.min}–${item.damage.max}${scaleTxt ? ` (${scaleTxt})` : ''}${est}`;
}

export function formatGearBonusLines(item) {
  const lines = [];
  if (item.armor) lines.push(`Броня +${item.armor}`);
  if (item.hp) lines.push(`HP +${item.hp}`);
  if (item.critChance && Math.round(item.critChance * 100) > 0) lines.push(`Крит +${Math.round(item.critChance * 100)}%`);
  if (item.dodgeChance && Math.round(item.dodgeChance * 100) > 0) {
    lines.push(`Уклонение +${Math.round(item.dodgeChance * 100)}%`);
  }
  if (item.magicDmgMul && Math.round(item.magicDmgMul * 100) > 0) {
    lines.push(`Маг. урон +${Math.round(item.magicDmgMul * 100)}%`);
  }
  if (item.startShield) lines.push(`Стартовый щит +${item.startShield}`);
  if (item.physFlat) lines.push(`Физ. урон +${item.physFlat}`);
  if (item.trinketShield) lines.push(`Раз в бой: +${item.trinketShield} щита`);
  if (item.blockPerEnd) lines.push(`Блок +(Выносливость × ${item.blockPerEnd})`);
  return lines;
}

/** Числовые статы для сравнения двух вещей одного слота. */
export function gearMetrics(item, player) {
  if (!item || !isGearItem(item)) return [];
  const stats = player ? getStats(player) : null;
  const rows = [];
  if (item.damage) {
    const scale = item.scaling && stats ? (stats[item.scaling.stat] ?? 0) * (item.scaling.coeff ?? 0) : 0;
    const min = item.damage.min + scale;
    const max = item.damage.max + scale;
    rows.push({
      id: 'dmg',
      label: item.damage.type === 'magic' ? 'Маг. урон' : 'Урон',
      value: (min + max) / 2,
      text: `${Math.floor(min)}–${Math.floor(max)}`,
    });
  }
  const add = (id, label, value, text) => {
    if (!value) return;
    rows.push({ id, label, value, text: text ?? String(value) });
  };
  add('armor', 'Броня', item.armor ?? 0);
  add('hp', 'HP', item.hp ?? 0);
  if (item.critChance && Math.round(item.critChance * 100) > 0) {
    add('crit', 'Крит', item.critChance, `${Math.round(item.critChance * 100)}%`);
  }
  if (item.dodgeChance && Math.round(item.dodgeChance * 100) > 0) {
    add('dodge', 'Уклон', item.dodgeChance, `${Math.round(item.dodgeChance * 100)}%`);
  }
  if (item.magicDmgMul && Math.round(item.magicDmgMul * 100) > 0) {
    add('magic', 'Маг. урон', item.magicDmgMul, `${Math.round(item.magicDmgMul * 100)}%`);
  }
  add('shield', 'Щит', item.startShield ?? 0);
  add('phys', 'Физ. урон', item.physFlat ?? 0);
  add('trinket', 'Щит аксессуара', item.trinketShield ?? 0);
  add('block', 'Блок', item.blockPerEnd ?? 0);
  return rows.filter((row) => row.value > 0);
}

const METRIC_WEIGHT = {
  dmg: 1,
  armor: 1.15,
  hp: 0.28,
  crit: 90,
  dodge: 90,
  magic: 80,
  shield: 0.35,
  phys: 4,
  trinket: 0.4,
  block: 8,
};

export function gearPower(item, player) {
  return gearMetrics(item, player).reduce((sum, row) => sum + row.value * (METRIC_WEIGHT[row.id] ?? 1), 0);
}

function weakerSlot(player, slotA, slotB) {
  const a = getGearItem(player.equipment?.[slotA], player);
  const b = getGearItem(player.equipment?.[slotB], player);
  if (!a) return slotA;
  if (!b) return slotB;
  return gearPower(a, player) <= gearPower(b, player) ? slotA : slotB;
}

/** Слот, с которым сравнивается вещь из сумки. */
export function compareSlotFor(item, player) {
  if (!item || !player || !isGearItem(item)) return null;
  if (item.grip === 'twoHand' || item.grip === 'oneHand' || item.slot === 'weapon') return 'mainHand';
  if (item.grip === 'offHand' || item.slot === 'offHand') return 'offHand';
  if (item.slot === 'finger') return weakerSlot(player, 'finger1', 'finger2');
  if (item.slot === 'trinket') return weakerSlot(player, 'trinket1', 'trinket2');
  if (item.slot && EQUIP_SLOTS.includes(item.slot)) return item.slot;
  return null;
}

export function isGearUpgrade(item, player) {
  const slot = compareSlotFor(item, player);
  if (!slot) return false;
  const worn = getGearItem(player.equipment?.[slot], player);
  if (!worn) return true;
  return gearPower(item, player) > gearPower(worn, player) + 0.25;
}

/** Список id всей экипировки для EMPTY_INV. */
export const GEAR_ITEM_IDS = Object.keys(GEAR_ITEMS);
