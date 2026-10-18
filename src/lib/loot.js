import { levelFromXp } from './game';

/** Лавка случайной экипировки обновляется раз в час. */
export const VENDOR_HOUR_MS = 60 * 60 * 1000;

export function vendorHourKey(now = Date.now()) {
  return Math.floor(now / VENDOR_HOUR_MS);
}

export function msUntilVendorRefresh(now = Date.now()) {
  return VENDOR_HOUR_MS - (now % VENDOR_HOUR_MS);
}

const RARITY_WEIGHTS = [
  ['common', 800],
  ['uncommon', 160],
  ['rare', 35],
  ['epic', 5],
];

const COUNT_WEIGHTS = [
  [1, 15],
  [2, 28],
  [3, 30],
  [4, 17],
  [5, 10],
];

const QUALITY_FLAT = { common: 1, uncommon: 1.16, rare: 1.36, epic: 1.58 };
const QUALITY_PCT = { common: 1, uncommon: 1.08, rare: 1.16, epic: 1.26 };
const QUALITY_PRICE = { common: 1, uncommon: 1.65, rare: 3.3, epic: 7.2 };
const QUALITY_COEFF = { common: 1, uncommon: 1.05, rare: 1.1, epic: 1.16 };

const PCT_KEYS = new Set(['critChance', 'dodgeChance', 'magicDmgMul']);

const ARCH = {
  warrior: { stat: 'STR', role: 'воина' },
  rogue: { stat: 'AGI', role: 'ловкача' },
  mage: { stat: 'INT', role: 'мага' },
  warden: { stat: 'END', role: 'стража' },
};

const CORE = {
  warrior: { armor: 12, hp: 15 },
  rogue: { armor: 7, critChance: 0.05, dodgeChance: 0.04 },
  mage: { armor: 3, magicDmgMul: 0.14, startShield: 18 },
  warden: { armor: 9, hp: 20 },
};

const AFFIXES = {
  warrior: [
    { key: 'hp', base: 4 },
    { key: 'physFlat', base: 1 },
    { key: 'armor', base: 2, only: (item) => !item.damage },
  ],
  rogue: [
    { key: 'critChance', base: 0.015 },
    { key: 'dodgeChance', base: 0.012 },
    { key: 'physFlat', base: 1 },
  ],
  mage: [
    { key: 'magicDmgMul', base: 0.02 },
    { key: 'startShield', base: 4 },
    { key: 'hp', base: 3 },
  ],
  warden: [
    { key: 'hp', base: 6 },
    { key: 'armor', base: 2 },
    { key: 'blockPerEnd', base: 1, only: (item) => item.grip === 'offHand' },
  ],
};

const MATERIALS = {
  warrior: {
    m: ['железный', 'стальной', 'кованый', 'латный'],
    f: ['железная', 'стальная', 'кованая', 'латная'],
    n: ['железное', 'стальное', 'кованое', 'латное'],
    pl: ['железные', 'стальные', 'кованые', 'латные'],
  },
  rogue: {
    m: ['кожаный', 'охотничий', 'гибкий'],
    f: ['кожаная', 'охотничья', 'гибкая'],
    n: ['кожаное', 'охотничье', 'гибкое'],
    pl: ['кожаные', 'охотничьи', 'гибкие'],
  },
  mage: {
    m: ['тканый', 'рунный', 'льняной'],
    f: ['тканая', 'рунная', 'льняная'],
    n: ['тканое', 'рунное', 'льняное'],
    pl: ['тканые', 'рунные', 'льняные'],
  },
  warden: {
    m: ['крепкий', 'сторожевой', 'дубовый'],
    f: ['крепкая', 'сторожевая', 'дубовая'],
    n: ['крепкое', 'сторожевое', 'дубовое'],
    pl: ['крепкие', 'сторожевые', 'дубовые'],
  },
};

const ADJECTIVES = {
  warrior: {
    m: ['закалённый', 'тяжёлый', 'верный', 'прочный'],
    f: ['закалённая', 'тяжёлая', 'верная', 'прочная'],
    n: ['закалённое', 'тяжёлое', 'верное', 'прочное'],
    pl: ['закалённые', 'тяжёлые', 'верные', 'прочные'],
  },
  rogue: {
    m: ['быстрый', 'тихий', 'меткий', 'ловкий'],
    f: ['быстрая', 'тихая', 'меткая', 'ловкая'],
    n: ['быстрое', 'тихое', 'меткое', 'ловкое'],
    pl: ['быстрые', 'тихие', 'меткие', 'ловкие'],
  },
  mage: {
    m: ['светлый', 'тихий', 'древний', 'ясный'],
    f: ['светлая', 'тихая', 'древняя', 'ясная'],
    n: ['светлое', 'тихое', 'древнее', 'ясное'],
    pl: ['светлые', 'тихие', 'древние', 'ясные'],
  },
  warden: {
    m: ['надёжный', 'глухой', 'массивный', 'стойкий'],
    f: ['надёжная', 'глухая', 'массивная', 'стойкая'],
    n: ['надёжное', 'глухое', 'массивное', 'стойкое'],
    pl: ['надёжные', 'глухие', 'массивные', 'стойкие'],
  },
};

const RARE_TAILS = [
  'глухого перевала',
  'ночного дозора',
  'сломленного знамени',
  'багрового рубежа',
  'пепельного марша',
  'тихой заставы',
  'северного ветра',
  'старого тракта',
  'туманной рощи',
  'нижней галереи',
];

const EPIC_TAILS = [
  'Разлома',
  'Багровой Луны',
  'Вечного Дозора',
  'Павшего Короля',
  'Глубинной Бреши',
  'Последнего Рубежа',
  'Системного Шрама',
  'Негасимого Огня',
];

const PRICE = {
  head: 0.012,
  shoulders: 0.01,
  chest: 0.02,
  wrists: 0.006,
  hands: 0.008,
  waist: 0.007,
  legs: 0.015,
  feet: 0.009,
  neck: 0.015,
  finger: 0.01,
  trinket: 0.02,
  oneHand: 0.015,
  twoHand: 0.028,
  offHand: 0.018,
};

function armor(arch, rows) {
  return rows.map(([slot, noun, g, emoji, w]) => ({
    arch,
    kind: 'armor',
    slot,
    noun,
    g,
    emoji,
    w,
  }));
}

function weapon(arch, row) {
  return { arch, kind: 'weapon', ...row };
}

const POOLS = {
  warrior: [
    weapon('warrior', { noun: 'меч', g: 'm', emoji: '🗡️', grip: 'oneHand', dmg: [7, 10], coeff: 1.5, dmgType: 'physical' }),
    weapon('warrior', { noun: 'топор', g: 'm', emoji: '🪓', grip: 'oneHand', dmg: [8, 11], coeff: 1.45, dmgType: 'physical' }),
    weapon('warrior', { noun: 'булава', g: 'f', emoji: '🔨', grip: 'oneHand', dmg: [8, 12], coeff: 1.4, dmgType: 'physical' }),
    weapon('warrior', { noun: 'двуручный меч', g: 'm', emoji: '⚔️', grip: 'twoHand', dmg: [14, 19], coeff: 2.4, dmgType: 'physical' }),
    weapon('warrior', { noun: 'секира', g: 'f', emoji: '🪓', grip: 'twoHand', dmg: [15, 21], coeff: 2.35, dmgType: 'physical' }),
    weapon('warrior', { noun: 'щит', g: 'm', emoji: '🛡️', grip: 'offHand', core: { armor: 5, hp: 6 }, block: 2 }),
    ...armor('warrior', [
      ['head', 'шлем', 'm', '🪖', 0.52],
      ['shoulders', 'наплечники', 'pl', '🦺', 0.38],
      ['chest', 'доспех', 'm', '👕', 1],
      ['wrists', 'наручи', 'pl', '⌚', 0.22],
      ['hands', 'рукавицы', 'pl', '🧤', 0.32],
      ['waist', 'пояс', 'm', '👔', 0.28],
      ['legs', 'поножи', 'pl', '👖', 0.68],
      ['feet', 'сапоги', 'pl', '👢', 0.36],
    ]),
    { arch: 'warrior', kind: 'accessory', slot: 'neck', noun: 'амулет', g: 'm', emoji: '📿', w: 0.4 },
    { arch: 'warrior', kind: 'accessory', slot: 'finger', noun: 'кольцо', g: 'n', emoji: '💍', w: 0.28 },
    { arch: 'warrior', kind: 'accessory', slot: 'trinket', noun: 'талисман', g: 'm', emoji: '🧿', w: 0.42 },
  ],
  rogue: [
    weapon('rogue', { noun: 'кинжал', g: 'm', emoji: '🔪', grip: 'oneHand', dmg: [4, 6], coeff: 1, dmgType: 'physical', crit: 0.08 }),
    weapon('rogue', { noun: 'короткий меч', g: 'm', emoji: '🗡️', grip: 'oneHand', dmg: [5, 8], coeff: 1.15, dmgType: 'physical', crit: 0.04 }),
    weapon('rogue', { noun: 'копьё', g: 'n', emoji: '🔱', grip: 'twoHand', dmg: [12, 15], coeff: 1.8, dmgType: 'physical' }),
    weapon('rogue', { noun: 'лук', g: 'm', emoji: '🏹', grip: 'twoHand', dmg: [10, 14], coeff: 1.7, dmgType: 'physical', crit: 0.05 }),
    ...armor('rogue', [
      ['head', 'капюшон', 'm', '🧢', 0.5],
      ['shoulders', 'наплечники', 'pl', '🦺', 0.36],
      ['chest', 'куртка', 'f', '🧥', 1],
      ['wrists', 'браслеты', 'pl', '⌚', 0.22],
      ['hands', 'перчатки', 'pl', '🧤', 0.34],
      ['waist', 'пояс', 'm', '👔', 0.28],
      ['legs', 'штаны', 'pl', '👖', 0.66],
      ['feet', 'сапоги', 'pl', '👟', 0.36],
    ]),
    { arch: 'rogue', kind: 'accessory', slot: 'neck', noun: 'амулет', g: 'm', emoji: '📿', w: 0.4 },
    { arch: 'rogue', kind: 'accessory', slot: 'finger', noun: 'кольцо', g: 'n', emoji: '💍', w: 0.28 },
    { arch: 'rogue', kind: 'accessory', slot: 'trinket', noun: 'талисман', g: 'm', emoji: '🧿', w: 0.42 },
  ],
  mage: [
    weapon('mage', { noun: 'посох', g: 'm', emoji: '🪄', grip: 'twoHand', dmg: [13, 17], coeff: 2.1, dmgType: 'magic' }),
    weapon('mage', { noun: 'жезл', g: 'm', emoji: '✨', grip: 'oneHand', dmg: [6, 9], coeff: 1.35, dmgType: 'magic' }),
    weapon('mage', { noun: 'сфера', g: 'f', emoji: '🔮', grip: 'offHand', core: { startShield: 8, magicDmgMul: 0.04 } }),
    ...armor('mage', [
      ['head', 'обруч', 'm', '🎩', 0.48],
      ['shoulders', 'оплечье', 'n', '🦺', 0.36],
      ['chest', 'одеяние', 'n', '👘', 1],
      ['wrists', 'манжеты', 'pl', '⌚', 0.22],
      ['hands', 'перчатки', 'pl', '🧤', 0.32],
      ['waist', 'кушак', 'm', '👔', 0.28],
      ['legs', 'бриджи', 'pl', '👖', 0.64],
      ['feet', 'сапоги', 'pl', '🥿', 0.34],
    ]),
    { arch: 'mage', kind: 'accessory', slot: 'neck', noun: 'амулет', g: 'm', emoji: '📿', w: 0.4 },
    { arch: 'mage', kind: 'accessory', slot: 'finger', noun: 'кольцо', g: 'n', emoji: '💍', w: 0.28 },
    { arch: 'mage', kind: 'accessory', slot: 'trinket', noun: 'талисман', g: 'm', emoji: '🧿', w: 0.42 },
  ],
  warden: [
    weapon('warden', { noun: 'молот', g: 'm', emoji: '🔨', grip: 'oneHand', dmg: [6, 9], coeff: 1.15, dmgType: 'physical' }),
    weapon('warden', { noun: 'щит', g: 'm', emoji: '🛡️', grip: 'offHand', core: { armor: 7, hp: 10 }, block: 2 }),
    weapon('warden', { noun: 'двуручный молот', g: 'm', emoji: '⚒️', grip: 'twoHand', dmg: [13, 18], coeff: 1.9, dmgType: 'physical' }),
    ...armor('warden', [
      ['head', 'шлем', 'm', '🪖', 0.55],
      ['shoulders', 'наплечники', 'pl', '🦺', 0.4],
      ['chest', 'кираса', 'f', '👕', 1],
      ['wrists', 'наручи', 'pl', '⌚', 0.24],
      ['hands', 'рукавицы', 'pl', '🧤', 0.34],
      ['waist', 'пояс', 'm', '👔', 0.3],
      ['legs', 'поножи', 'pl', '👖', 0.7],
      ['feet', 'сапоги', 'pl', '👢', 0.38],
    ]),
    { arch: 'warden', kind: 'accessory', slot: 'neck', noun: 'амулет', g: 'm', emoji: '📿', w: 0.42 },
    { arch: 'warden', kind: 'accessory', slot: 'finger', noun: 'кольцо', g: 'n', emoji: '💍', w: 0.28 },
    { arch: 'warden', kind: 'accessory', slot: 'trinket', noun: 'талисман', g: 'm', emoji: '🧿', w: 0.45 },
  ],
};

const ARCH_IDS = Object.keys(POOLS);

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function pickWeighted(rng, rows) {
  const total = rows.reduce((s, row) => s + row[1], 0);
  let roll = rng() * total;
  for (const row of rows) {
    roll -= row[1];
    if (roll <= 0) return row[0];
  }
  return rows[rows.length - 1][0];
}

function cap(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function word(rng, table, arch, g) {
  const bag = table[arch][g] ?? table[arch].m;
  return pick(rng, bag);
}

function makeName(rng, bp, quality) {
  const g = bp.g ?? 'm';
  if (quality === 'epic') return cap(`${bp.noun} ${pick(rng, EPIC_TAILS)}`);
  if (quality === 'rare') return cap(`${bp.noun} ${pick(rng, RARE_TAILS)}`);
  const mat = word(rng, MATERIALS, bp.arch, g);
  if (quality === 'uncommon') return cap(`${word(rng, ADJECTIVES, bp.arch, g)} ${mat} ${bp.noun}`);
  return cap(`${mat} ${bp.noun}`);
}

function reqStatFor(ilvl) {
  return Math.max(2, Math.round(ilvl * 0.6 + 0.4));
}

function scaleFlat(base, ilvl, quality) {
  const n = base * (1 + (ilvl - 1) * 0.055) * QUALITY_FLAT[quality];
  return Math.max(1, Math.round(n));
}

function scalePct(base, ilvl, quality) {
  if (base <= 0) return 0;
  const n = base * (1 + (ilvl - 1) * 0.02) * QUALITY_PCT[quality];
  return Math.round(n * 1000) / 1000;
}

function addStat(item, key, base, ilvl, quality) {
  if (base <= 0) return;
  if (key === 'blockPerEnd') {
    item.blockPerEnd = Math.min(4, (item.blockPerEnd ?? 0) + Math.max(1, Math.round(base)));
    return;
  }
  if (PCT_KEYS.has(key)) {
    item[key] = Math.round(((item[key] ?? 0) + scalePct(base, ilvl, quality)) * 1000) / 1000;
    return;
  }
  item[key] = (item[key] ?? 0) + scaleFlat(base, ilvl, quality);
}

function applyBundle(item, bundle, weight, ilvl, quality) {
  if (!bundle) return;
  for (const [key, value] of Object.entries(bundle)) {
    addStat(item, key, value * weight, ilvl, quality);
  }
}

/** Одна случайная вещь под уровень персонажа. match ограничивает пул чертежей. */
export function rollGeneratedItem(rng, playerLevel, forcedQuality, match) {
  const ilvl = Math.max(1, Math.floor(playerLevel) || 1);
  const quality = forcedQuality ?? pickWeighted(rng, RARITY_WEIGHTS);
  let bp;
  if (match) {
    const pool = [];
    for (const arch of ARCH_IDS) {
      for (const row of POOLS[arch]) if (match(row)) pool.push(row);
    }
    if (!pool.length) return null;
    bp = pick(rng, pool);
  } else {
    const arch = pick(rng, ARCH_IDS);
    bp = pick(rng, POOLS[arch]);
  }
  const meta = ARCH[bp.arch];

  const item = {
    id: 'pending',
    name: makeName(rng, bp, quality),
    emoji: bp.emoji,
    quality,
    category: bp.kind === 'weapon' ? 'weapon' : bp.kind === 'accessory' ? 'accessory' : 'armor',
    slot: bp.grip ? (bp.grip === 'offHand' ? 'offHand' : 'weapon') : bp.slot,
    reqLevel: ilvl,
    itemLevel: ilvl,
    req: { [meta.stat]: reqStatFor(ilvl) },
    spec: bp.arch,
    desc: `Снаряжение ${meta.role}. Уровень предмета ${ilvl}.`,
    generated: true,
  };
  if (bp.grip) item.grip = bp.grip;

  if (bp.dmg) {
    const min = scaleFlat(bp.dmg[0], ilvl, quality);
    const max = Math.max(min + 1, scaleFlat(bp.dmg[1], ilvl, quality));
    item.damage = { min, max, type: bp.dmgType };
    item.scaling = {
      stat: meta.stat,
      coeff: Math.round(bp.coeff * QUALITY_COEFF[quality] * 100) / 100,
    };
    if (bp.crit) addStat(item, 'critChance', bp.crit, ilvl, quality);
  }

  if (bp.core) {
    applyBundle(item, bp.core, 1, ilvl, quality);
  } else if (bp.kind !== 'weapon') {
    const weight = (bp.w ?? 1) * (bp.kind === 'accessory' ? 0.55 : 1);
    applyBundle(item, CORE[bp.arch], weight, ilvl, quality);
  }

  if (bp.block) item.blockPerEnd = Math.min(4, (item.blockPerEnd ?? 0) + bp.block);

  if (bp.slot === 'trinket') {
    if (bp.arch === 'rogue') addStat(item, 'critChance', 0.03, ilvl, quality);
    else addStat(item, 'trinketShield', bp.arch === 'mage' ? 10 : 8, ilvl, quality);
  }

  const extra = quality === 'common' ? 0 : quality === 'uncommon' ? 1 : quality === 'epic' ? 2 : rng() < 0.45 ? 2 : 1;
  const affixes = AFFIXES[bp.arch].filter((aff) => !aff.only || aff.only(item));
  const bag = [...affixes];
  for (let i = 0; i < extra && bag.length; i += 1) {
    const idx = Math.floor(rng() * bag.length);
    const aff = bag.splice(idx, 1)[0];
    const weight = bp.kind === 'weapon' ? 0.85 : Math.max(bp.w ?? 0.5, 0.4);
    addStat(item, aff.key, aff.base * weight, ilvl, quality);
  }

  const priceKey = bp.grip ?? bp.slot;
  const priceBase = PRICE[priceKey] ?? 0.01;
  const buy = Math.round(priceBase * (1 + (ilvl - 1) * 0.1) * QUALITY_PRICE[quality] * 1000) / 1000;
  item.buyPrice = buy;
  item.sellPrice = Math.round(buy * 0.35 * 1000) / 1000;
  return item;
}

const VENDOR_STOCK_VERSION = 3;

function rollShopQualities(rng, count) {
  const out = [];
  let epic = false;
  let rare = false;
  for (let i = 0; i < count; i += 1) {
    let quality = pickWeighted(rng, RARITY_WEIGHTS);
    if (quality === 'epic') {
      if (epic) quality = rng() < 0.25 ? 'uncommon' : 'common';
      else epic = true;
    } else if (quality === 'rare') {
      if (rare) quality = rng() < 0.3 ? 'uncommon' : 'common';
      else rare = true;
    }
    out.push(quality);
  }
  return out;
}

export function rollVendorOffers(player, now = Date.now()) {
  const level = Math.max(1, levelFromXp(player?.xp ?? 0).level);
  const hour = vendorHourKey(now);
  const count = pickWeighted(Math.random, COUNT_WEIGHTS);
  const qualities = rollShopQualities(Math.random, count);
  const offers = [];
  const seen = new Set();
  let guard = 0;
  while (offers.length < count && guard < 48) {
    guard += 1;
    const item = rollGeneratedItem(Math.random, level, qualities[offers.length]);
    const key = `${item.slot}|${item.grip ?? ''}|${item.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    item.id = `gen_${hour.toString(36)}_${offers.length}_${Math.random().toString(36).slice(2, 7)}`;
    offers.push(item);
  }
  return offers;
}

export function ensureVendorStock(p, now = Date.now()) {
  if (!p) return { player: p, changed: false };
  const hour = vendorHourKey(now);
  const stock = p.vendorStock;
  if (stock?.hour === hour && stock?.v === VENDOR_STOCK_VERSION && Array.isArray(stock.offers)) {
    return { player: p, changed: false };
  }
  return {
    player: {
      ...p,
      vendorStock: { hour, v: VENDOR_STOCK_VERSION, offers: rollVendorOffers(p, now) },
    },
    changed: true,
  };
}
