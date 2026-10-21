"use client";

import { useEffect, useState } from "react";
import { Row, Section, Sheet } from "@/components/ui";
import { createClient } from "@/lib/supabase";

interface Props {
  open: boolean;
  onClose: () => void;
  heightCm: number | null;
  birthYear: number | null;
  onSaved: (heightCm: number, birthYear: number) => void;
}

/** Height and birth year, used with your latest weight to estimate resting burn. */
export function BodyStatsSheet({ open, onClose, heightCm, birthYear, onSaved }: Props) {
  const [height, setHeight] = useState("");
  const [year, setYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setHeight(heightCm == null ? "" : String(heightCm));
      setYear(birthYear == null ? "" : String(birthYear));
      setError("");
    }
  }, [open, heightCm, birthYear]);

  const h = Number(height);
  const y = Number(year);
  const valid = h > 100 && h < 250 && Number.isInteger(y) && y > 1940 && y < 2020;

  async function save() {
    setSaving(true);
    const { error } = await createClient()
      .from("goals")
      .upsert({ height_cm: h, birth_year: y }, { onConflict: "user_id" });
    setSaving(false);
    if (error) return setError(error.message);
    onSaved(h, y);
    onClose();
  }

  const inputClass = "w-24 bg-transparent text-right text-[17px] text-white placeholder:text-ios-label3 outline-none";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Body stats"
      action={
        <button onClick={save} disabled={!valid || saving} className="text-[17px] font-semibold text-ios-blue disabled:opacity-30">
          {saving ? "Saving…" : "Save"}
        </button>
      }
    >
      <Section footer="Used with your latest weigh-in to estimate how much you burn at rest.">
        <Row label="Height">
          <span className="flex items-center gap-1">
            <input
              inputMode="decimal"
              placeholder="175"
              value={height}
              onChange={(e) => setHeight(e.target.value.replace(/[^\d.]/g, ""))}
              className={inputClass}
            />
            cm
          </span>
        </Row>
        <Row label="Birth year">
          <input
            inputMode="numeric"
            placeholder="2005"
            maxLength={4}
            value={year}
            onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
            className={inputClass}
          />
        </Row>
      </Section>
      {error && <p className="px-1 text-[15px] text-ios-red">{error}</p>}
    </Sheet>
  );
}
