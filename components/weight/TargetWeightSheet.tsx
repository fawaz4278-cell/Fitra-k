"use client";

import { useEffect, useState } from "react";
import { Row, Section, Sheet } from "@/components/ui";
import { createClient } from "@/lib/supabase";
import { fieldCls, parseDecimal } from "./LogWeightSheet";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  targetKg: number | null;
}

export function TargetWeightSheet({ open, onClose, onSaved, targetKg }: Props) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setValue(targetKg != null ? String(targetKg) : "");
      setError("");
    }
  }, [open, targetKg]);

  const parsed = value.trim() === "" ? null : parseDecimal(value, 400);
  const valid = value.trim() === "" || parsed !== null;

  async function save() {
    setSaving(true);
    const { error } = await createClient()
      .from("goals")
      .upsert({ target_kg: parsed === null ? null : Math.round(parsed * 100) / 100 }, { onConflict: "user_id" });
    setSaving(false);
    if (error) return setError(error.message);
    onSaved();
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Target Weight"
      action={
        <button onClick={save} disabled={!valid || saving} className="text-[17px] font-semibold text-ios-blue disabled:text-ios-label3">
          Save
        </button>
      }
    >
      <div className="-mx-4 pt-2">
        <Section footer="Leave empty to clear your target.">
          <Row label="Target (kg)">
            <input
              inputMode="decimal"
              value={value}
              placeholder="—"
              onChange={(e) => setValue(e.target.value.replace(",", ".").replace(/[^\d.]/g, ""))}
              className={fieldCls}
              aria-label="Target weight in kg"
            />
          </Row>
        </Section>
        {error && <p className="px-4 text-center text-[15px] text-ios-red">{error}</p>}
      </div>
    </Sheet>
  );
}
