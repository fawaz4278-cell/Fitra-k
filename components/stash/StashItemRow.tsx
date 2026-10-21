"use client";

import type { StashItem } from "@/lib/types";
import { useMounted } from "@/components/ui";

/** Tap the row to eat one; the + button puts one back (undo). */
export function StashItemRow({
  item,
  onEat,
  onUndo,
}: {
  item: StashItem;
  onEat: () => void;
  onUndo: () => void;
}) {
  const empty = item.qty_left === 0;
  const mounted = useMounted(150);
  const pct = mounted && item.qty_bought > 0 ? (item.qty_left / item.qty_bought) * 100 : 0;

  return (
    <div className="hairline flex items-center gap-3 border-b px-4 py-3.5 last:border-b-0">
      <button
        type="button"
        onClick={onEat}
        disabled={empty}
        className="pressable min-w-0 flex-1 text-left disabled:opacity-40"
        aria-label={`Eat one ${item.name}`}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className={`truncate text-[16px] font-medium ${empty ? "line-through" : ""}`}>{item.name}</span>
          <span className="num shrink-0 text-[18px] font-semibold">
            {item.qty_left}
            <span className="text-[13px] font-medium text-white/40">/{item.qty_bought}</span>
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#e9d5ff] to-[#a855f7] [transition:width_900ms_var(--spring)]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 text-[12px] text-white/45">
          {item.kcal_per_unit} kcal each{empty ? " · finished" : " · tap to eat one"}
        </div>
      </button>
      <button
        type="button"
        onClick={onUndo}
        disabled={item.qty_left >= item.qty_bought}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[18px] text-white/80 [transition:transform_450ms_var(--spring-bouncy)] active:scale-[0.82] active:[transition-duration:90ms] disabled:opacity-25"
        aria-label={`Put back one ${item.name}`}
      >
        +
      </button>
    </div>
  );
}
