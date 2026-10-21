"use client";

import { useEffect, useState } from "react";
import { Section, Segmented, Sheet } from "@/components/ui";
import { createClient } from "@/lib/supabase";
import { AGE_GROUPS, AGE_GROUP_LABELS, AWARD_THRESHOLDS, type AgeGroup, type IpptTarget } from "@/lib/types";

const TARGETS: { value: IpptTarget; label: string }[] = [
  { value: "pass", label: "Pass" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  target: IpptTarget;
  ageGroup: AgeGroup;
}

export function IpptSettingsSheet({ open, onClose, onSaved, target, ageGroup }: Props) {
  const [t, setT] = useState(target);
  const [g, setG] = useState(ageGroup);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setT(target);
      setG(ageGroup);
      setError("");
    }
  }, [open, target, ageGroup]);

  async function save() {
    setSaving(true);
    const { error } = await createClient()
      .from("goals")
      .upsert({ ippt_target: t, age_group: g }, { onConflict: "user_id" });
    setSaving(false);
    if (error) return setError(error.message);
    onSaved();
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="IPPT Goal"
      action={
        <button onClick={save} disabled={saving} className="text-[17px] font-semibold text-ios-blue disabled:text-ios-label3">
          Save
        </button>
      }
    >
      <div className="-mx-4 pt-2">
        <Section header="Target award" footer={`Requires ${AWARD_THRESHOLDS[t]}+ points.`}>
          <div className="p-2">
            <Segmented options={TARGETS} value={t} onChange={setT} />
          </div>
        </Section>
        <Section header="Default age group">
          <div className="p-2">
            <Segmented
              scroll
              options={AGE_GROUPS.map((a) => ({ value: a, label: AGE_GROUP_LABELS[a] }))}
              value={g}
              onChange={setG}
            />
          </div>
        </Section>
        {error && <p className="px-4 text-center text-[15px] text-ios-red">{error}</p>}
      </div>
    </Sheet>
  );
}
