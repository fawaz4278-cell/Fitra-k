"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { todayISO } from "@/lib/date";
import type { StashItem, StashItemInsert } from "@/lib/types";
import { Sheet } from "@/components/ui";

interface Draft {
  key: number;
  name: string;
  qty: string;
  kcal: string;
}

let nextKey = 1;
const blankRow = (): Draft => ({ key: nextKey++, name: "", qty: "1", kcal: "" });

const isPosInt = (s: string) => /^\d+$/.test(s.trim()) && Number(s) > 0;
const isNonNegInt = (s: string) => s.trim() === "" || /^\d+$/.test(s.trim());

export function NewBookingSheet({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (items: StashItem[]) => void;
}) {
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState<Draft[]>(() => [blankRow()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filled = rows.filter((r) => r.name.trim() !== "");
  const valid =
    !!date && filled.length > 0 && filled.every((r) => isPosInt(r.qty) && isNonNegInt(r.kcal));

  function patch(key: number, p: Partial<Draft>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...p } : r)));
  }

  function reset() {
    setDate(todayISO());
    setRows([blankRow()]);
    setError("");
  }

  async function save() {
    if (!valid) return;
    setSaving(true);
    setError("");
    const payload: StashItemInsert[] = filled.map((r) => ({
      booking_start: date,
      name: r.name.trim(),
      qty_bought: Number(r.qty),
      qty_left: Number(r.qty),
      kcal_per_unit: r.kcal.trim() === "" ? 0 : Number(r.kcal),
    }));
    const { data, error } = await createClient().from("stash_items").insert(payload).select();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onCreated((data as StashItem[]) ?? []);
    reset();
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New booking"
      action={
        <button
          onClick={save}
          disabled={!valid || saving}
          className="text-[17px] font-semibold text-ios-blue disabled:opacity-30"
        >
          {saving ? "Saving" : "Save"}
        </button>
      }
    >
      <div className="mb-5 surface overflow-hidden2">
        <label className="flex min-h-[44px] items-center justify-between px-4">
          <span className="text-[17px]">Booking in</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-[17px] text-ios-blue outline-none [color-scheme:dark]"
          />
        </label>
      </div>

      <div className="mb-1.5 grid grid-cols-[1fr_56px_72px_28px] gap-2 px-1 text-[12px] uppercase text-ios-label2">
        <span>Item</span>
        <span className="text-center">Qty</span>
        <span className="text-center">kcal/unit</span>
        <span />
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.key} className="grid grid-cols-[1fr_56px_72px_28px] items-center gap-2">
            <input
              placeholder="e.g. Maggi cup"
              value={r.name}
              onChange={(e) => patch(r.key, { name: e.target.value })}
              className="min-w-0 rounded-lg bg-ios-card2 px-3 py-2.5 text-[16px] text-white placeholder:text-ios-label3 outline-none"
            />
            <input
              inputMode="numeric"
              value={r.qty}
              onChange={(e) => patch(r.key, { qty: e.target.value.replace(/\D/g, "") })}
              className={`rounded-lg bg-ios-card2 px-2 py-2.5 text-center text-[16px] tabular-nums outline-none ${
                r.name && !isPosInt(r.qty) ? "ring-1 ring-ios-red" : ""
              }`}
              aria-label="Quantity"
            />
            <input
              inputMode="numeric"
              placeholder="0"
              value={r.kcal}
              onChange={(e) => patch(r.key, { kcal: e.target.value.replace(/\D/g, "") })}
              className="rounded-lg bg-ios-card2 px-2 py-2.5 text-center text-[16px] tabular-nums placeholder:text-ios-label3 outline-none"
              aria-label="kcal per unit"
            />
            <button
              type="button"
              onClick={() => setRows((prev) => (prev.length > 1 ? prev.filter((x) => x.key !== r.key) : [blankRow()]))}
              className="text-[20px] text-ios-red"
              aria-label="Remove item"
            >
              ⊖
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRows((prev) => [...prev, blankRow()])}
        className="mt-3 text-[17px] text-ios-blue"
      >
        ⊕ Add item
      </button>
      {error && <p className="mt-3 text-[15px] text-ios-red">{error}</p>}
    </Sheet>
  );
}
