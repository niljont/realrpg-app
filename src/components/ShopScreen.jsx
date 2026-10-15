import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, Gem, X } from 'lucide-react';
import { PALIUM_COLOR, formatPalium, getStats } from '../lib/game';
import {
  GRIP_LABELS,
  ITEM_QUALITY,
  SHOP_ACCESSORIES,
  SHOP_ARMOR,
  SHOP_CONSUMABLES,
  SHOP_WEAPONS,
  SLOT_LABELS,
  formatGearBonusLines,
  formatWeaponDamageLine,
  qualityColor,
  reqStatus,
} from '../lib/equipment';

const TABS = [
  { id: 'weapon', label: 'Оружие' },
  { id: 'armor', label: 'Броня' },
  { id: 'accessory', label: 'Аксессуары' },
  { id: 'consumable', label: 'Расходники' },
];

/** Сортировки для экипировки */
const GEAR_SORTS = [
  { id: 'price', label: 'Цена', get: (item) => item.buyPrice ?? 0 },
  { id: 'name', label: 'Название', get: (item) => item.name ?? '' },
  { id: 'armor', label: 'Броня', get: (item) => item.armor ?? 0 },
  { id: 'hp', label: 'HP', get: (item) => item.hp ?? 0 },
  { id: 'damage', label: 'Урон', get: (item) => {
    if (!item.damage) return 0;
    return (item.damage.min + item.damage.max) / 2;
  }},
  { id: 'crit', label: 'Крит', get: (item) => item.critChance ?? 0 },
  { id: 'dodge', label: 'Уклон', get: (item) => item.dodgeChance ?? 0 },
  { id: 'magic', label: 'Маг.урон', get: (item) => item.magicDmgMul ?? 0 },
  { id: 'shield', label: 'Стартовый щит', get: (item) => item.startShield ?? item.trinketShield ?? 0 },
];

const STAT_FILTERS_BY_TAB = {
  weapon: [
    { id: 'all', label: 'Все' },
    { id: 'STR', label: 'Сила' },
    { id: 'AGI', label: 'Ловкость' },
    { id: 'INT', label: 'Интеллект' },
    { id: 'END', label: 'Выносливость' },
  ],
  armor: [
    { id: 'all', label: 'Все' },
    { id: 'STR', label: 'Сила' },
    { id: 'AGI', label: 'Ловкость' },
    { id: 'INT', label: 'Интеллект' },
  ],
  accessory: [
    { id: 'all', label: 'Все' },
    { id: 'STR', label: 'Сила' },
    { id: 'END', label: 'Выносливость' },
    { id: 'INT', label: 'Интеллект' },
  ],
};

function filterByReqStat(list, statId) {
  if (statId === 'all') return list;
  return list.filter((item) => (item.req?.[statId] ?? 0) > 0);
}

function StatFilterBar({ filters, value, onChange }) {
  if (!filters?.length) return null;
  return (
    <div className="mb-2 flex gap-1 overflow-x-auto pb-1">
      {filters.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold ${
            value === f.id ? 'border-neon/50 bg-neon/10 text-neon' : 'border-zinc-800 text-zinc-500'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

/** Сортировки для расходников */
const CONSUMABLE_SORTS = [
  { id: 'price', label: 'Цена', get: (o) => o.price ?? 0 },
  { id: 'name', label: 'Название', get: (o) => o.name ?? '' },
];

function sortList(list, sortId, dir, sorts) {
  const def = sorts.find((s) => s.id === sortId) ?? sorts[0];
  const mul = dir === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    const av = def.get(a);
    const bv = def.get(b);
    if (typeof av === 'string' || typeof bv === 'string') {
      return String(av).localeCompare(String(bv), 'ru') * mul;
    }
    if (av !== bv) return (av - bv) * mul;
    const an = a.name ?? a.id ?? '';
    const bn = b.name ?? b.id ?? '';
    return String(an).localeCompare(String(bn), 'ru');
  });
}

function SortBar({ sorts, sortId, dir, onSortId, onDir }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <ArrowDownUp size={12} className="shrink-0 text-zinc-500" />
      <select
        value={sortId}
        onChange={(e) => onSortId(e.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-[11px] font-bold text-zinc-200 outline-none focus:border-neon/50"
        aria-label="Сортировка"
      >
        {sorts.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onDir(dir === 'asc' ? 'desc' : 'asc')}
        className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-[10px] font-bold text-zinc-300"
        title={dir === 'asc' ? 'По возрастанию' : 'По убыванию'}
      >
        {dir === 'asc' ? '↑ возр.' : '↓ убыв.'}
      </button>
    </div>
  );
}

function GearCard({ item, player, onBuy, flash }) {
  const color = qualityColor(item);
  const reqs = reqStatus(player, item);
  const canBuy = (player.palium ?? 0) + 1e-9 >= (item.buyPrice ?? 0);
  const dmgLine = formatWeaponDamageLine(item, player);
  const bonusLines = formatGearBonusLines(item);

  return (
    <div className="rounded-xl border bg-zinc-900/70 p-3" style={{ borderColor: `${color}44` }}>
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl"
          style={{ background: `${color}18` }}
        >
          {item.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-sm" style={{ color }}>
            {item.name}
          </div>
          <div className="text-[10px] text-zinc-500">
            {ITEM_QUALITY[item.quality]?.label}
            {item.grip ? ` · ${GRIP_LABELS[item.grip]}` : ''}
            {item.slot && !item.grip
              ? ` · ${SLOT_LABELS[item.slot] ?? SLOT_LABELS[`${item.slot}1`] ?? item.slot}`
              : ''}
          </div>
          {dmgLine && <div className="mt-1 text-[11px] text-zinc-300">{dmgLine}</div>}
          {bonusLines.map((line) => (
            <div key={line} className="text-[11px] text-zinc-300">
              {line}
            </div>
          ))}
          <div className="mt-1.5 space-y-0.5">
            {reqs.map((r) => (
              <div key={r.stat} className={`text-[10px] font-bold ${r.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {r.ok ? '✓' : '✗'} Требуется: {r.label} {r.need}
                {!r.ok && ` (Текущая: ${r.current})`}
              </div>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        disabled={!canBuy && !flash}
        onClick={() => onBuy(item.id, item.buyPrice ?? 0)}
        className={`mt-3 w-full rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-35 ${
          flash ? 'shop-buy-flash' : ''
        }`}
        style={{ background: flash || canBuy ? '#059669' : '#3f3f46' }}
      >
        {flash ? 'Куплено!' : `Купить · ${formatPalium(item.buyPrice)} Палиум`}
      </button>
    </div>
  );
}

function ConsumableCard({ offer, player, onBuy, flash }) {
  const canBuy = (player.palium ?? 0) + 1e-9 >= offer.price;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-950 text-2xl">{offer.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-sm text-zinc-100">{offer.name}</div>
          <div className="mt-1 text-[11px] text-zinc-400">{offer.desc}</div>
        </div>
      </div>
      <button
        type="button"
        disabled={!canBuy && !flash}
        onClick={() => onBuy(offer.item, offer.price)}
        className={`mt-3 w-full rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-35 ${
          flash ? 'shop-buy-flash' : ''
        }`}
        style={{ background: flash || canBuy ? '#059669' : '#3f3f46' }}
      >
        {flash ? 'Куплено!' : `Купить · ${formatPalium(offer.price)} Палиум`}
      </button>
    </div>
  );
}

export default function ShopScreen({ player, onClose, onBuyGear, onBuyConsumable }) {
  const [tab, setTab] = useState('weapon');
  const [sortId, setSortId] = useState('price');
  const [dir, setDir] = useState('asc');
  const [statFilter, setStatFilter] = useState('all');
  const [flashId, setFlashId] = useState(null);
  const [spendFx, setSpendFx] = useState(null);
  const [balancePulse, setBalancePulse] = useState(false);
  const stats = getStats(player);

  const isConsumable = tab === 'consumable';
  const sorts = isConsumable ? CONSUMABLE_SORTS : GEAR_SORTS;
  const activeSortId = sorts.some((s) => s.id === sortId) ? sortId : 'price';
  const statFilters = STAT_FILTERS_BY_TAB[tab] ?? null;
  const activeStatFilter =
    statFilters?.some((f) => f.id === statFilter) ? statFilter : 'all';

  const weapons = useMemo(
    () => sortList(filterByReqStat(SHOP_WEAPONS, activeStatFilter), activeSortId, dir, GEAR_SORTS),
    [activeSortId, dir, activeStatFilter],
  );
  const armor = useMemo(
    () => sortList(filterByReqStat(SHOP_ARMOR, activeStatFilter), activeSortId, dir, GEAR_SORTS),
    [activeSortId, dir, activeStatFilter],
  );
  const accessories = useMemo(
    () => sortList(filterByReqStat(SHOP_ACCESSORIES, activeStatFilter), activeSortId, dir, GEAR_SORTS),
    [activeSortId, dir, activeStatFilter],
  );
  const consumables = useMemo(
    () => sortList(SHOP_CONSUMABLES, activeSortId, dir, CONSUMABLE_SORTS),
    [activeSortId, dir],
  );

  useEffect(() => {
    if (!flashId) return undefined;
    const t = setTimeout(() => setFlashId(null), 700);
    return () => clearTimeout(t);
  }, [flashId]);

  useEffect(() => {
    if (!spendFx) return undefined;
    const t = setTimeout(() => setSpendFx(null), 900);
    return () => clearTimeout(t);
  }, [spendFx]);

  useEffect(() => {
    if (!balancePulse) return undefined;
    const t = setTimeout(() => setBalancePulse(false), 550);
    return () => clearTimeout(t);
  }, [balancePulse]);

  const playPurchaseFx = (id, price) => {
    setFlashId(id);
    setSpendFx({ amount: price, key: Date.now() });
    setBalancePulse(true);
  };

  const handleBuyGear = (id, price) => {
    const ok = onBuyGear?.(id);
    if (ok) playPurchaseFx(id, price);
  };

  const handleBuyConsumable = (id, price) => {
    const ok = onBuyConsumable?.(id);
    if (ok) playPurchaseFx(id, price);
  };

  const switchTab = (id) => {
    setTab(id);
    setStatFilter('all');
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-void/95 backdrop-blur-md">
      <div className="border-b border-neon/20 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div>
            <div className="font-display text-sm tracking-widest text-neon/90">МАГАЗИН СИСТЕМЫ</div>
            <div className="relative mt-1 inline-flex items-center gap-1.5 text-xs font-bold tabular-nums">
              <span
                className={`inline-flex items-center gap-1.5 ${balancePulse ? 'shop-balance-pulse' : ''}`}
                style={{ color: PALIUM_COLOR }}
              >
                <Gem size={13} />
                {formatPalium(player.palium)} Палиум
              </span>
              {spendFx && (
                <span
                  key={spendFx.key}
                  className="shop-palium-spend absolute left-full top-0 ml-2 whitespace-nowrap text-[11px] font-bold text-rose-400"
                >
                  −{formatPalium(spendFx.amount)}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 text-zinc-400"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mx-auto mt-3 flex max-w-md gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              className={`shrink-0 rounded-lg border px-3 py-2 text-[10px] font-bold ${
                tab === t.id ? 'border-neon/50 bg-neon/10 text-neon' : 'border-zinc-800 text-zinc-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-4 py-4 pb-[max(env(safe-area-inset-bottom),24px)]">
        <p className="mb-2 text-[11px] text-zinc-500">
          STR {stats.STR} · AGI {stats.AGI} · END {stats.END} · INT {stats.INT} · WIL {stats.WIL}
        </p>

        <SortBar
          sorts={sorts}
          sortId={activeSortId}
          dir={dir}
          onSortId={setSortId}
          onDir={setDir}
        />

        {statFilters && (
          <StatFilterBar filters={statFilters} value={activeStatFilter} onChange={setStatFilter} />
        )}

        {tab === 'weapon' && (
          <div className="space-y-2">
            {weapons.map((item) => (
              <GearCard
                key={item.id}
                item={item}
                player={player}
                onBuy={handleBuyGear}
                flash={flashId === item.id}
              />
            ))}
          </div>
        )}
        {tab === 'armor' && (
          <div className="space-y-2">
            {armor.map((item) => (
              <GearCard
                key={item.id}
                item={item}
                player={player}
                onBuy={handleBuyGear}
                flash={flashId === item.id}
              />
            ))}
          </div>
        )}
        {tab === 'accessory' && (
          <div className="space-y-2">
            {accessories.map((item) => (
              <GearCard
                key={item.id}
                item={item}
                player={player}
                onBuy={handleBuyGear}
                flash={flashId === item.id}
              />
            ))}
          </div>
        )}
        {tab === 'consumable' && (
          <div className="space-y-2">
            {consumables.map((offer) => (
              <ConsumableCard
                key={offer.item}
                offer={offer}
                player={player}
                onBuy={handleBuyConsumable}
                flash={flashId === offer.item}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
