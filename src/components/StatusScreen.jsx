import { useEffect, useState } from 'react';
import { Backpack, BarChart3, ChevronUp, Store, Trophy, X } from 'lucide-react';
import StatRadar from './StatRadar';
import Modal from './Modal';
import AchievementsScreen from './AchievementsScreen';
import AnalyticsScreen from './AnalyticsScreen';
import ShopScreen from './ShopScreen';
import { STATS, STAT_META, formatPalium, getStats, levelFromXp, statProgress } from '../lib/game';
import {
  BAG_SLOT_COUNT,
  GRIP_LABELS,
  ITEM_QUALITY,
  SLOT_LABELS,
  formatGearBonusLines,
  formatWeaponDamageLine,
  gearMetrics,
  getGearBonuses,
  getGearItem,
  isGearItem,
  isGearUpgrade,
  isWeaponItem,
  compareSlotFor,
  meetsReq,
  qualityColor,
  reqStatus,
} from '../lib/equipment';
import { ITEMS, invCount, listInventory } from '../lib/world';
import DailyBoard from './DailyBoard';

function EquipSlot({ label, item, locked, onClick }) {
  const color = item ? qualityColor(item) : '#3f3f46';
  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick}
      className={`relative flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border sm:h-14 sm:w-14 ${
        locked ? 'opacity-40' : ''
      } ${onClick ? 'active:scale-95' : ''}`}
      style={{
        borderColor: item ? color : '#3f3f46',
        borderStyle: item ? 'solid' : 'dashed',
        background: item ? `${color}14` : 'rgb(9 9 11 / 0.8)',
        boxShadow: item ? `0 0 10px ${color}33` : 'none',
      }}
      title={item?.name ?? label}
    >
      {item ? (
        <span className="text-xl leading-none">{item.emoji}</span>
      ) : locked ? (
        <span className="text-lg opacity-60">⚔️</span>
      ) : (
        <span className="px-0.5 text-center text-[8px] font-bold leading-tight text-zinc-600">{label}</span>
      )}
    </button>
  );
}

function slotItem(player, slot) {
  return getGearItem(player?.equipment?.[slot], player);
}

function PaperDoll({ player, onSlotClick }) {
  const label = player?.name?.trim() || 'Герой';
  const genderMark = player?.gender === 'female' ? '♀' : '♂';
  const { level } = levelFromXp(player?.xp ?? 0);
  const main = slotItem(player, 'mainHand');
  const off = slotItem(player, 'offHand');
  const twoHandLocked = main?.grip === 'twoHand';
  const gear = getGearBonuses(player);

  const click = (slot) => {
    const it = slotItem(player, slot);
    if (it) onSlotClick(slot);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-stretch justify-center gap-2">
        <div className="flex flex-col gap-1.5">
          <EquipSlot label={SLOT_LABELS.head} item={slotItem(player, 'head')} onClick={() => click('head')} />
          <EquipSlot label={SLOT_LABELS.neck} item={slotItem(player, 'neck')} onClick={() => click('neck')} />
          <EquipSlot label={SLOT_LABELS.shoulders} item={slotItem(player, 'shoulders')} onClick={() => click('shoulders')} />
          <EquipSlot label={SLOT_LABELS.chest} item={slotItem(player, 'chest')} onClick={() => click('chest')} />
          <EquipSlot label={SLOT_LABELS.wrists} item={slotItem(player, 'wrists')} onClick={() => click('wrists')} />
          <EquipSlot label={SLOT_LABELS.hands} item={slotItem(player, 'hands')} onClick={() => click('hands')} />
          <EquipSlot label={SLOT_LABELS.waist} item={slotItem(player, 'waist')} onClick={() => click('waist')} />
        </div>
        <div className="flex min-w-[100px] flex-col items-center justify-between py-1">
          <div className="flex w-full flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 px-2 py-3">
            <div className="flex h-16 w-12 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-950/60 text-2xl text-zinc-500">
              {genderMark}
            </div>
            <div className="max-w-full truncate text-center font-display text-[10px] tracking-wide text-zinc-400">
              {label}
            </div>
            <div className="text-[9px] tabular-nums text-zinc-600">Ур. {level}</div>
          </div>
          <div className="mt-1.5 flex gap-1.5">
            <EquipSlot label="Оружие" item={main} onClick={() => click('mainHand')} />
            <EquipSlot
              label="Левая"
              item={twoHandLocked ? null : off}
              locked={twoHandLocked}
              onClick={!twoHandLocked ? () => click('offHand') : undefined}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <EquipSlot label={SLOT_LABELS.finger1} item={slotItem(player, 'finger1')} onClick={() => click('finger1')} />
          <EquipSlot label={SLOT_LABELS.finger2} item={slotItem(player, 'finger2')} onClick={() => click('finger2')} />
          <EquipSlot label={SLOT_LABELS.trinket1} item={slotItem(player, 'trinket1')} onClick={() => click('trinket1')} />
          <EquipSlot label={SLOT_LABELS.trinket2} item={slotItem(player, 'trinket2')} onClick={() => click('trinket2')} />
          <EquipSlot label={SLOT_LABELS.legs} item={slotItem(player, 'legs')} onClick={() => click('legs')} />
          <EquipSlot label={SLOT_LABELS.feet} item={slotItem(player, 'feet')} onClick={() => click('feet')} />
        </div>
      </div>
      <div className="text-center text-[10px] text-zinc-500">
        Броня {gear.armor} · HP+{gear.hp} · Крит {Math.round(gear.critChance * 100)}% · Уклон{' '}
        {Math.round(gear.dodgeChance * 100)}% · Маг+{Math.round(gear.magicDmgMul * 100)}% · Стартовый щит{' '}
        {gear.startShield}
      </div>
    </div>
  );
}

function GearCompare({ item, player }) {
  const slot = compareSlotFor(item, player);
  const worn = slot ? getGearItem(player.equipment?.[slot], player) : null;
  const slotName = slot ? SLOT_LABELS[slot] ?? slot : 'слот';
  const bagRows = gearMetrics(item, player);
  const wornRows = gearMetrics(worn, player);
  const ids = [...new Set([...wornRows.map((row) => row.id), ...bagRows.map((row) => row.id)])];

  return (
    <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
      <div className="mb-2 text-[10px] font-bold tracking-wider text-zinc-500">
        Сравнение · {slotName}
        {item.grip === 'twoHand' ? ' · двуручное снимет левую руку' : ''}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-2 text-[10px]">
        <div className="font-bold text-zinc-400">Надето</div>
        <div />
        <div className="text-right font-bold text-zinc-200">В сумке</div>
        <div className="col-span-3 mb-1 truncate text-[10px] text-zinc-500">
          {worn ? worn.name : 'Пусто'}
        </div>
      </div>
      {ids.length === 0 ? (
        <p className="text-[11px] text-zinc-500">Нет боевых характеристик для сравнения.</p>
      ) : (
        <div className="space-y-1">
          {ids.map((id) => {
            const left = wornRows.find((row) => row.id === id);
            const right = bagRows.find((row) => row.id === id);
            const delta = (right?.value ?? 0) - (left?.value ?? 0);
            const better = delta > 0.001;
            const worse = delta < -0.001;
            return (
              <div key={id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 text-[11px]">
                <span className="text-zinc-400">{left?.text ?? '—'}</span>
                <span className="text-[10px] text-zinc-500">{left?.label ?? right?.label}</span>
                <span className={`text-right font-bold ${better ? 'text-emerald-400' : worse ? 'text-red-400' : 'text-zinc-200'}`}>
                  {right?.text ?? '—'}
                  {better ? ' ↑' : worse ? ' ↓' : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
function ItemTooltip({
  item,
  count,
  player,
  mode, // bag | equipped
  equippedSlot,
  onClose,
  onUse,
  onEquip,
  onEquipOff,
  onUnequip,
  onSell,
}) {
  const color = qualityColor(item);
  const gear = isGearItem(item);
  const weapon = isWeaponItem(item);
  const reqs = gear ? reqStatus(player, item) : [];
  const canEq = gear && meetsReq(player, item);
  const sellPrice = item.sellPrice;
  const stack = Math.max(1, Math.floor(Number(count) || 1));
  const [sellQty, setSellQty] = useState(stack);
  useEffect(() => {
    setSellQty(stack);
  }, [item?.id, stack]);
  const sellN = Math.max(1, Math.min(stack, Math.floor(Number(sellQty) || 1)));
  const dmgLine = formatWeaponDamageLine(item, player);
  const bonusLines = formatGearBonusLines(item);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="system-panel modal-in w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: `${color}66` }}
      >
        <div className="mb-3 flex items-start gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl"
            style={{ background: `${color}22`, boxShadow: `0 0 14px ${color}33` }}
          >
            {item.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-base" style={{ color }}>
              {item.name}
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-500">
              {gear
                ? `${ITEM_QUALITY[item.quality]?.label ?? ''}${item.itemLevel ? ` · ур. ${item.itemLevel}` : ''}${item.grip ? ` · ${GRIP_LABELS[item.grip]}` : ''}`
                : `В инвентаре: ×${count}`}
              {gear && mode === 'bag' ? ` · ×${count}` : ''}
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800" aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>

        <p className="mb-2 text-sm leading-relaxed text-zinc-300">{item.desc}</p>
        {dmgLine && <p className="mb-1 text-[12px] text-zinc-200">{dmgLine}</p>}
        {bonusLines.map((line) => (
          <p key={line} className="mb-0.5 text-[12px] text-zinc-200">
            {line}
          </p>
        ))}

        {reqs.length > 0 && (
          <div className="mb-3 mt-2 space-y-1">
            {reqs.map((r) => (
              <div key={r.stat} className={`text-[11px] font-bold ${r.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {r.ok
                  ? `[Требуется: ${r.label} ${r.need}]`
                  : `[Требуется: ${r.label} ${r.need} (Текущая: ${r.current})]`}
              </div>
            ))}
          </div>
        )}

        {mode === 'bag' && gear && <GearCompare item={item} player={player} />}

        <div className="mt-3 flex flex-col gap-2">
          {mode === 'equipped' && (
            <button
              type="button"
              onClick={() => {
                if (onUnequip?.(equippedSlot)) onClose();
              }}
              className="w-full rounded-xl border border-zinc-600 py-3 text-sm font-bold text-zinc-200"
            >
              Снять в инвентарь
            </button>
          )}

          {mode === 'bag' && weapon && item.grip === 'oneHand' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!canEq}
                onClick={() => {
                  if (onEquip?.(item.id, 'mainHand')) onClose();
                }}
                className="rounded-xl border py-3 text-xs font-bold disabled:opacity-35"
                style={{
                  borderColor: canEq ? `${color}88` : '#3f3f46',
                  color: canEq ? color : '#71717a',
                  background: canEq ? `${color}18` : '#27272a',
                }}
              >
                В «Оружие»
              </button>
              <button
                type="button"
                disabled={!canEq}
                onClick={() => {
                  if (onEquipOff?.(item.id)) onClose();
                }}
                className="rounded-xl border py-3 text-xs font-bold disabled:opacity-35"
                style={{
                  borderColor: canEq ? `${color}88` : '#3f3f46',
                  color: canEq ? color : '#71717a',
                  background: canEq ? `${color}18` : '#27272a',
                }}
              >
                В «Левая»
              </button>
            </div>
          )}

          {mode === 'bag' && gear && !(weapon && item.grip === 'oneHand') && (
            <button
              type="button"
              disabled={!canEq}
              onClick={() => {
                if (onEquip?.(item.id, null)) onClose();
              }}
              className="w-full rounded-xl border py-3 text-sm font-bold disabled:opacity-35"
              style={{
                borderColor: canEq ? `${color}88` : '#3f3f46',
                color: canEq ? color : '#71717a',
                background: canEq ? `${color}18` : '#27272a',
              }}
            >
              Экипировать
            </button>
          )}

          {mode === 'bag' && (item.usable || item.food === 'useful') && (
            <button
              type="button"
              onClick={() => {
                if (onUse?.(item)) onClose();
              }}
              className="w-full rounded-xl border py-3 text-sm font-bold"
              style={{
                borderColor: `${color}88`,
                color,
                background: `${color}18`,
              }}
            >
              Применить
            </button>
          )}

          {mode === 'bag' && sellPrice != null && (
            <div className="space-y-2">
              {stack > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSellQty(Math.max(1, sellN - 1))}
                    className="h-11 w-11 rounded-xl border border-zinc-700 text-lg font-bold text-zinc-200"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={stack}
                    value={sellN}
                    onChange={(e) => setSellQty(Math.max(1, Math.min(stack, Math.floor(Number(e.target.value) || 1))))}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 text-center text-sm font-bold text-zinc-100 outline-none"
                    aria-label="Сколько продать"
                  />
                  <button
                    type="button"
                    onClick={() => setSellQty(Math.min(stack, sellN + 1))}
                    className="h-11 w-11 rounded-xl border border-zinc-700 text-lg font-bold text-zinc-200"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setSellQty(stack)}
                    className="h-11 rounded-xl border border-sky-500/40 px-3 text-[11px] font-bold text-sky-300"
                  >
                    Все {stack}
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  if (onSell?.(item.id, sellN)) onClose();
                }}
                className="w-full rounded-xl border border-sky-500/40 bg-sky-500/10 py-3 text-sm font-bold text-sky-300"
              >
                Продать {sellN}× за {formatPalium(sellPrice * sellN)} Палиума
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InventoryPanel({ player, onEat, onUse, onHealthy, onNormal, onFast, onEquip, onUnequip, onSell, onOpenShop }) {
  const [selectedId, setSelectedId] = useState(null);
  const [equippedSlot, setEquippedSlot] = useState(null);

  const owned = listInventory(player);
  const bagSlots = Array.from({ length: BAG_SLOT_COUNT }, (_, i) => owned[i] ?? null);

  const bagItem = selectedId
    ? (ITEMS[selectedId] ?? player.generatedGear?.[selectedId] ?? null)
    : null;
  const eqItem = equippedSlot ? getGearItem(player.equipment?.[equippedSlot], player) : null;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="font-display text-[11px] tracking-widest text-zinc-400">ЭКИПИРОВКА</div>
          <button type="button" onClick={onOpenShop} className="text-[10px] font-bold text-sky-400">
            Магазин →
          </button>
        </div>
        <PaperDoll
          player={player}
          onSlotClick={(slot) => {
            setSelectedId(null);
            setEquippedSlot(slot);
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-2">
        <button onClick={onHealthy} className="rounded-xl border border-orange-500/40 bg-orange-500/10 py-2.5 text-xs font-bold text-orange-300">
          Здоровая домашняя еда
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onNormal} className="rounded-xl border border-zinc-700 bg-zinc-900/70 py-2.5 text-xs font-bold text-zinc-300">
            Обычная еда
          </button>
          <button onClick={onFast} className="rounded-xl border border-red-500/40 bg-red-500/10 py-2.5 text-xs font-bold text-red-300">
            Фастфуд / Срыв
          </button>
        </div>
      </div>

      <div>
        <div className="mb-2 font-display text-[11px] tracking-widest text-zinc-400">ИНВЕНТАРЬ</div>
        <div className="grid grid-cols-5 gap-1.5">
          {bagSlots.map((slot, i) => {
            if (!slot) {
              return <div key={`empty-${i}`} className="aspect-square rounded-lg border border-zinc-800 bg-zinc-950/60" />;
            }
            const { item, count } = slot;
            const color = qualityColor(item);
            const active = selectedId === item.id;
            const upgrade = isGearUpgrade(item, player);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setEquippedSlot(null);
                  setSelectedId(item.id);
                }}
                className="relative aspect-square rounded-lg border bg-zinc-900/80 text-xl transition active:scale-95"
                style={{
                  borderColor: active ? color : '#3f3f46',
                  boxShadow: active ? `0 0 12px ${color}55` : 'none',
                }}
                aria-label={item.name}
              >
                {item.emoji}
                {upgrade && (
                  <span className="absolute left-0.5 top-0.5 text-emerald-400 drop-shadow-[0_0_4px_rgb(52_211_153)]">
                    <ChevronUp size={14} strokeWidth={3} />
                  </span>
                )}
                <span className="absolute right-0.5 bottom-0.5 rounded bg-black/70 px-1 font-display text-[9px] tabular-nums text-zinc-100">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {bagItem && invCount(player, bagItem.id) > 0 && (
        <ItemTooltip
          item={bagItem}
          count={invCount(player, bagItem.id)}
          player={player}
          mode="bag"
          onClose={() => setSelectedId(null)}
          onUse={(it) => (it.food === 'useful' ? onEat(it.id) : onUse(it.id))}
          onEquip={(id, slot) => onEquip(id, slot)}
          onEquipOff={(id) => onEquip(id, 'offHand')}
          onSell={onSell}
        />
      )}

      {eqItem && equippedSlot && (
        <ItemTooltip
          item={eqItem}
          count={1}
          player={player}
          mode="equipped"
          equippedSlot={equippedSlot}
          onClose={() => setEquippedSlot(null)}
          onUnequip={onUnequip}
        />
      )}
    </div>
  );
}

export default function StatusScreen({
  player,
  onEat,
  onUseItem,
  onHealthyMeal,
  onNormalMeal,
  onFastFood,
  onSell,
  onBuyGear,
  onBuyConsumable,
  onEquipItem,
  onUnequipSlot,
  onEquipTitle,
  justUnlocked,
  titlesInitialTab = 'titles',
  openRequest,
  onOpenRequestHandled,
  onClaimContract,
  onClaimReturn,
}) {
  const stats = getStats(player);
  const [panel, setPanel] = useState(null);
  const [titlesTab, setTitlesTab] = useState(titlesInitialTab);

  useEffect(() => {
    if (!openRequest) return undefined;
    if (openRequest === 'titles' || openRequest === 'achievements') {
      setTitlesTab(openRequest === 'achievements' ? 'achievements' : 'titles');
      setPanel('titles');
    } else if (openRequest === 'analytics') {
      setPanel('analytics');
    } else if (openRequest === 'inventory' || openRequest === 'shop') {
      setPanel(openRequest);
    }
    onOpenRequestHandled?.();
    return undefined;
  }, [openRequest, onOpenRequestHandled]);

  return (
    <div className="space-y-4">
      <DailyBoard
        player={player}
        onClaimContract={onClaimContract}
        onClaimReturn={onClaimReturn}
      />
      <section className="system-panel grid grid-cols-2 gap-2 p-3">
        <button
          type="button"
          onClick={() => setPanel('inventory')}
          className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 py-3 text-xs font-bold text-amber-300"
        >
          <Backpack size={16} /> Инвентарь
        </button>
        <button
          type="button"
          onClick={() => setPanel('shop')}
          className="flex items-center justify-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 py-3 text-xs font-bold text-sky-300"
        >
          <Store size={16} /> Магазин
        </button>
        <button
          type="button"
          onClick={() => {
            setTitlesTab('titles');
            setPanel('titles');
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-yellow-500/40 bg-yellow-500/10 py-3 text-xs font-bold text-yellow-300"
        >
          <Trophy size={16} /> Титулы
        </button>
        <button
          type="button"
          onClick={() => setPanel('analytics')}
          className="flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 py-3 text-xs font-bold text-violet-300"
        >
          <BarChart3 size={16} /> Графики
        </button>
      </section>

      <section className="system-panel p-4">
        <h2 className="font-display text-sm tracking-widest text-neon/90">ХАРАКТЕРИСТИКИ</h2>
        <StatRadar stats={stats} />
      </section>

      <section className="system-panel space-y-3 p-4">
        {STATS.map((s) => {
          const { level, cur, need } = statProgress(player.statPoints[s]);
          const { color, label } = STAT_META[s];
          return (
            <div key={s}>
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span>
                  <b className="font-display" style={{ color }}>
                    {s}
                  </b>{' '}
                  <span className="text-zinc-400">{label}</span>
                </span>
                <span className="tabular-nums text-zinc-400">
                  <b className="text-sm text-zinc-100">{level}</b> · {cur}/{need}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full transition-[width] duration-700"
                  style={{ width: `${(cur / need) * 100}%`, background: color, boxShadow: `0 0 8px ${color}` }}
                />
              </div>
            </div>
          );
        })}
      </section>

      {panel === 'inventory' && (
        <Modal title="Инвентарь" onClose={() => setPanel(null)}>
          <InventoryPanel
            player={player}
            onEat={onEat}
            onUse={onUseItem}
            onHealthy={onHealthyMeal}
            onNormal={onNormalMeal}
            onFast={onFastFood}
            onEquip={onEquipItem}
            onUnequip={onUnequipSlot}
            onSell={onSell}
            onOpenShop={() => setPanel('shop')}
          />
        </Modal>
      )}

      {panel === 'shop' && (
        <ShopScreen
          player={player}
          onClose={() => setPanel(null)}
          onBuyGear={onBuyGear}
          onBuyConsumable={onBuyConsumable}
        />
      )}

      {panel === 'titles' && (
        <Modal title="Титулы и достижения" onClose={() => setPanel(null)}>
          <AchievementsScreen
            key={titlesTab}
            player={player}
            initialTab={titlesTab}
            justUnlocked={justUnlocked}
            onEquip={onEquipTitle}
            compact
          />
        </Modal>
      )}
      {panel === 'analytics' && (
        <Modal title="Графики" onClose={() => setPanel(null)}>
          <AnalyticsScreen player={player} />
        </Modal>
      )}
    </div>
  );
}
