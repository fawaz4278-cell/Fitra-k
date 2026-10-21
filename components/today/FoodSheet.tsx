"use client";

import { useEffect, useState } from "react";
import { Section, Sheet } from "@/components/ui";
import { createClient } from "@/lib/supabase";
import { FOOD_PRESETS } from "@/lib/food";
import type { FoodLog } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  date: string;
  onAdded: (food: FoodLog) => void;
}

/** Quick-add sheet: tap a preset to log it straight away, or enter a custom item. */
export function FoodSheet({ open, onClose, date, onAdded }: Props) {
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setName("");
      setKcal("");
      setError("");
      setAdded([]);
    }
  }, [open]);

  async function add(foodName: string, foodKcal: number): Promise<boolean> {
    setBusy(true);
    setError("");
    const { data, error } = await createClient()
      .from("food_logs")
      .insert({ date, name: foodName, kcal: foodKcal })
      .select()
      .single();
    setBusy(false);
    if (error) {
      setError(error.message);
      return false;
    }
    onAdded(data as FoodLog);
    setAdded((prev) => [...prev, foodName]);
    return true;
  }

  const customKcal = Number(kcal);
  const customValid = name.trim().length > 0 && kcal !== "" && Number.isInteger(customKcal) && customKcal >= 0 && customKcal < 10000;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add food"
      action={
        <button onClick={onClose} className="text-[17px] font-semibold text-ios-blue">
          Done
        </button>
      }
    >
      <p className="mb-4 h-5 px-1 text-[13px] text-ios-green" aria-live="polite">
        {added.length > 0 ? `Added: ${added.join(", ")}` : ""}
      </p>

      {FOOD_PRESETS.map(({ group, items }) => (
        <div key={group} className="mb-5">
          <h3 className="mb-2 px-1 text-[13px] uppercase text-ios-label2">{group}</h3>
          <div className="flex flex-wrap gap-2">
            {items.map((f) => (
              <button
                key={f.name}
                type="button"
                disabled={busy}
                onClick={() => add(f.name, f.kcal)}
                className="rounded-full bg-ios-card2 px-3.5 py-2 text-[15px] active:bg-ios-sep disabled:opacity-50"
              >
                {f.name} <span className="text-ios-label2">{f.kcal}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <Section header="Custom">
        <div className="flex items-center gap-3 px-4">
          <input
            type="text"
            placeholder="Food"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-w-0 flex-1 bg-transparent py-3 text-[17px] text-white placeholder:text-ios-label3 outline-none"
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="kcal"
            value={kcal}
            onChange={(e) => setKcal(e.target.value.replace(/\D/g, ""))}
            className="w-20 bg-transparent py-3 text-right text-[17px] text-white placeholder:text-ios-label3 outline-none"
          />
          <button
            type="button"
            disabled={!customValid || busy}
            onClick={async () => {
              if (await add(name.trim(), customKcal)) {
                setName("");
                setKcal("");
              }
            }}
            className="text-[17px] font-semibold text-ios-blue disabled:opacity-30"
          >
            Add
          </button>
        </div>
      </Section>
      {error && <p className="px-1 text-[15px] text-ios-red">{error}</p>}
    </Sheet>
  );
}
