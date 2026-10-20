import { SLOT_LABELS, compareSlotFor, gearMetrics, getGearItem } from '../lib/equipment';

/**
 * Сравнение вещи со слотом, который она займёт.
 * @param {{ item: object, player: object, rightLabel?: string }} props
 */
export default function GearCompare({ item, player, rightLabel = 'В сумке' }) {
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
        <div className="text-right font-bold text-zinc-200">{rightLabel}</div>
        <div className="col-span-3 mb-1 truncate text-[10px] text-zinc-500">{worn ? worn.name : 'Пусто'}</div>
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
