"use client";

import type { StashItem } from "@/lib/types";

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
  const pct = item.qty_bought > 0 ? (item.qty_left / item.qty_bought) * 100 : 0;

  return (
    <div className="flex items-center gap-3 border-b border-ios-sep/70 px-4 py-3 last:border-b-0">
      <button
        type="button"
        onClick={onEat}
        disabled={empty}
        className="min-w-0 flex-1 text-left active:opacity-60 disabled:opacity-40"
        aria-label={`Eat one ${item.name}`}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className={`truncate text-[17px] ${empty ? "line-through" : ""}`}>{item.name}</span>
          <span className="shrink-0 text-[17px] font-semibold tabular-nums">
            {item.qty_left}
            <span className="text-[13px] font-normal text-ios-label2">/{item.qty_bought}</span>
          </span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ios-card2">
          <div
            className={`h-full rounded-full ${pct > 50 ? "bg-ios-green" : pct > 0 ? "bg-ios-orange" : "bg-transparent"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 text-[13px] text-ios-label2">
          {item.kcal_per_unit} kcal each{empty ? " · finished" : " · tap to eat one"}
        </div>
      </button>
      <button
        type="button"
        onClick={onUndo}
        disabled={item.qty_left >= item.qty_bought}
        className="h-8 w-8 shrink-0 rounded-full bg-ios-card2 text-[18px] text-ios-blue disabled:opacity-30"
        aria-label={`Put back one ${item.name}`}
      >
        +
      </button>
    </div>
  );
}
