"use client";

import { useEffect, useState } from "react";
import { Row, Section, Sheet } from "@/components/ui";
import { todayISO } from "@/lib/date";
import { createClient } from "@/lib/supabase";
import type { WeightInsert } from "@/lib/types";

export const fieldCls =
  "w-24 rounded-lg bg-ios-card2 px-3 py-1.5 text-right text-[17px] text-white outline-none placeholder:text-ios-label3 focus:ring-2 focus:ring-ios-blue";

/** Positive decimal in (0, max); null when empty/invalid. */
export function parseDecimal(v: string, max: number): number | null {
  if (!/^\d+(\.\d*)?$/.test(v.trim())) return null;
  const n = Number(v);
  return n > 0 && n < max ? n : null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  lastKg?: number;
}

export function LogWeightSheet({ open, onClose, onSaved, lastKg }: Props) {
  const [date, setDate] = useState(todayISO());
  const [kg, setKg] = useState("");
  const [waist, setWaist] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDate(todayISO());
    setKg("");
    setWaist("");
    setNote("");
    setError("");
  }, [open]);

  const kgVal = parseDecimal(kg, 400);
  const waistVal = waist.trim() === "" ? null : parseDecimal(waist, 300);
  const valid = !!date && kgVal !== null && (waist.trim() === "" || waistVal !== null);

  async function save() {
    if (!valid) return;
    setSaving(true);
    setError("");
    const row: WeightInsert = {
      date,
      kg: Math.round(kgVal! * 100) / 100,
      waist_cm: waistVal === null ? null : Math.round(waistVal * 10) / 10,
      note: note.trim() || null,
    };
    const { error } = await createClient().from("weights").insert(row);
    setSaving(false);
    if (error) return setError(error.message);
    onSaved();
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log Weight"
      action={
        <button onClick={save} disabled={!valid || saving} className="text-[17px] font-semibold text-ios-blue disabled:text-ios-label3">
          {saving ? "Saving…" : "Save"}
        </button>
      }
    >
      <div className="-mx-4 pt-2">
        <Section>
          <Row label="Date">
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-right text-[17px] text-ios-blue outline-none [color-scheme:dark]"
            />
          </Row>
          <Row label="Weight (kg)">
            <input
              inputMode="decimal"
              placeholder={lastKg ? lastKg.toFixed(1) : "0.0"}
              value={kg}
              onChange={(e) => setKg(e.target.value.replace(",", ".").replace(/[^\d.]/g, ""))}
              className={fieldCls}
              aria-label="Weight in kg"
            />
          </Row>
          <Row label="Waist (cm)" sub="Optional">
            <input
              inputMode="decimal"
              placeholder="—"
              value={waist}
              onChange={(e) => setWaist(e.target.value.replace(",", ".").replace(/[^\d.]/g, ""))}
              className={fieldCls}
              aria-label="Waist in cm"
            />
          </Row>
        </Section>
        <Section header="Note">
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
            className="block w-full resize-none bg-transparent px-4 py-3 text-[17px] text-white outline-none placeholder:text-ios-label3"
          />
        </Section>
        {error && <p className="px-4 text-center text-[15px] text-ios-red">{error}</p>}
      </div>
    </Sheet>
  );
}
