import { useState } from 'react';
import { Backpack, RotateCcw, Store, X } from 'lucide-react';
import StatRadar from './StatRadar';
import Modal from './Modal';
import { STATS, STAT_META, getStats, levelFromXp, statProgress } from '../lib/game';
import { ITEMS, SHOP_BUY, SHOP_SELL, formatMoney, invCount } from '../lib/world';

const BAG_SLOT_COUNT = 20;

function EquipSlot({ label }) {
  return (
    <div
      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-950/80 sm:h-14 sm:w-14"
      title={label}
    >
      <span className="px-0.5 text-center text-[8px] font-bold leading-tight text-zinc-600">{label}</span>
    </div>
  );
}

function PaperDoll({ player }) {
  const label = player?.name?.trim() || 'Герой';
  const genderMark = player?.gender === 'female' ? '♀' : '♂';
  const { level } = levelFromXp(player?.xp ?? 0);

  return (
    <div className="flex items-stretch justify-center gap-2">
      <div className="flex flex-col gap-1.5">
        <EquipSlot label="Голова" />
        <EquipSlot label="Шея" />
        <EquipSlot label="Плечи" />
        <EquipSlot label="Грудь" />
        <EquipSlot label="Запястья" />
        <EquipSlot label="Кисти" />
        <EquipSlot label="Пояс" />
      </div>
      <div className="flex min-w-[100px] flex-col items-center justify-between py-1">
        <div className="flex flex-1 w-full flex-col items-center justify-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 px-2 py-3">
          <div className="flex h-16 w-12 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-950/60 text-2xl text-zinc-500">
            {genderMark}
          </div>
          <div className="max-w-full truncate text-center font-display text-[10px] tracking-wide text-zinc-400">
            {label}
          </div>
          <div className="text-[9px] tabular-nums text-zinc-600">Ур. {level}</div>
        </div>
        <div className="mt-1.5 flex gap-1.5">
          <EquipSlot label="Оружие" />
          <EquipSlot label="Левая" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <EquipSlot label="Кольцо" />
        <EquipSlot label="Кольцо" />
        <EquipSlot label="Аксессуар" />
        <EquipSlot label="Аксессуар" />
        <EquipSlot label="Ноги" />
        <EquipSlot label="Ступни" />
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

function InventoryPanel({ player, onEat, onUse, onHealthy, onNormal, onFast }) {
  const [selectedId, setSelectedId] = useState(null);
  const owned = Object.values(ITEMS)
    .map((item) => ({ item, count: invCount(player, item.id) }))
    .filter((x) => x.count > 0);
  const bagSlots = Array.from({ length: BAG_SLOT_COUNT }, (_, i) => owned[i] ?? null);
  const selected = selectedId ? ITEMS[selectedId] : null;
  const selectedCount = selected ? invCount(player, selected.id) : 0;
  const applicable = canApplyItem(selected);

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 font-display text-[11px] tracking-widest text-zinc-400">ЭКИПИРОВКА</div>
        <PaperDoll player={player} />
        <p className="mt-2 text-center text-[10px] text-zinc-600">Слоты снаряжения пока пусты</p>
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
              return (
                <div
                  key={`empty-${i}`}
                  className="aspect-square rounded-lg border border-zinc-800 bg-zinc-950/60"
                />
              );
            }
            const { item, count } = slot;
            const active = selectedId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className="relative aspect-square rounded-lg border bg-zinc-900/80 text-xl transition active:scale-95"
                style={{
                  borderColor: active ? item.color : '#3f3f46',
                  boxShadow: active ? `0 0 12px ${item.color}55` : 'none',
                }}
                aria-label={item.name}
              >
                {item.emoji}
                <span className="absolute right-0.5 bottom-0.5 rounded bg-black/70 px-1 font-display text-[9px] tabular-nums text-zinc-100">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selected && selectedCount > 0 && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={() => setSelectedId(null)}>
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
                <div className="mt-0.5 text-[11px] text-zinc-500">В инвентаре: ×{selectedCount}</div>
              </div>
              <button type="button" onClick={() => setSelectedId(null)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800" aria-label="Закрыть">
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

function ShopPanel({ player, onSell, onBuy }) {
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

export default function StatusScreen({
  player,
  onReset,
  onEat,
  onUseItem,
  onHealthyMeal,
  onNormalMeal,
  onFastFood,
  onSell,
  onBuy,
}) {
  const stats = getStats(player);
  const [panel, setPanel] = useState(null);

  return (
    <div className="space-y-4">
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
                <div className="h-full transition-[width] duration-700" style={{ width: `${(cur / need) * 100}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
              </div>
            </div>
          );
        })}
      </section>

      <button
        onClick={() => confirm('Стереть профиль Игрока? Весь прогресс будет потерян.') && onReset()}
        className="mx-auto flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-red-400"
      >
        <RotateCcw size={12} /> Сбросить профиль
      </button>

      {panel === 'inventory' && (
        <Modal title="Инвентарь" onClose={() => setPanel(null)}>
          <InventoryPanel
            player={player}
            onEat={onEat}
            onUse={onUseItem}
            onHealthy={onHealthyMeal}
            onNormal={onNormalMeal}
            onFast={onFastFood}
          />
        </Modal>
      )}
      {panel === 'shop' && (
        <Modal title="Магазин" onClose={() => setPanel(null)}>
          <ShopPanel player={player} onSell={onSell} onBuy={onBuy} />
        </Modal>
      )}
    </div>
  );
}
