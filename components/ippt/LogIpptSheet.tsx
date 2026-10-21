"use client";

import { useEffect, useMemo, useState } from "react";
import { Section, Row, Segmented, Sheet } from "@/components/ui";
import { score } from "@/lib/ippt/score";
import { todayISO } from "@/lib/date";
import { createClient } from "@/lib/supabase";
import {
  AGE_GROUPS,
  AGE_GROUP_LABELS,
  type AgeGroup,
  type IpptAttemptInsert,
  type IpptScore,
} from "@/lib/types";
import { AwardBadge } from "./AwardBadge";

const inputCls =
  "w-20 rounded-lg bg-ios-card2 px-3 py-1.5 text-right text-[17px] text-white outline-none placeholder:text-ios-label3 focus:ring-2 focus:ring-ios-blue";

/** Parse a non-negative integer from a text box; null when empty/invalid. */
function parseIntField(v: string, max: number): number | null {
  if (!/^\d+$/.test(v)) return null;
  const n = Number(v);
  return n <= max ? n : null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  defaultAgeGroup: AgeGroup;
}

export function LogIpptSheet({ open, onClose, onSaved, defaultAgeGroup }: Props) {
  const [date, setDate] = useState(todayISO());
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(defaultAgeGroup);
  const [pushups, setPushups] = useState("");
  const [situps, setSitups] = useState("");
  const [runMin, setRunMin] = useState("");
  const [runSec, setRunSec] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDate(todayISO());
    setAgeGroup(defaultAgeGroup);
    setPushups("");
    setSitups("");
    setRunMin("");
    setRunSec("");
    setError("");
  }, [open, defaultAgeGroup]);

  const pu = parseIntField(pushups, 200);
  const su = parseIntField(situps, 200);
  const min = parseIntField(runMin, 59);
  const sec = parseIntField(runSec, 59);
  const runSeconds = min !== null && sec !== null ? min * 60 + sec : null;
  const valid = !!date && pu !== null && su !== null && runSeconds !== null && runSeconds > 0;

  const preview = useMemo<IpptScore | null>(() => {
    if (!valid) return null;
    try {
      return score(ageGroup, pu!, su!, runSeconds!);
    } catch {
      return null;
    }
  }, [valid, ageGroup, pu, su, runSeconds]);

  async function save() {
    if (!valid || !preview) return;
    setSaving(true);
    setError("");
    const row: IpptAttemptInsert = {
      date,
      age_group: ageGroup,
      pushups: pu!,
      situps: su!,
      run_seconds: runSeconds!,
      ...preview,
    };
    const { error } = await createClient().from("ippt_attempts").insert(row);
    setSaving(false);
    if (error) return setError(error.message);
    onSaved();
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log IPPT"
      action={
        <button
          onClick={save}
          disabled={!valid || !preview || saving}
          className="text-[17px] font-semibold text-ios-blue disabled:text-ios-label3"
        >
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
        </Section>

        <Section header="Age group">
          <div className="p-2">
            <Segmented
              scroll
              options={AGE_GROUPS.map((g) => ({ value: g, label: AGE_GROUP_LABELS[g] }))}
              value={ageGroup}
              onChange={setAgeGroup}
            />
          </div>
        </Section>

        <Section header="Stations">
          <Row label="Push-ups" sub={preview ? `${preview.pu_pts}/25 pts` : undefined}>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={pushups}
              onChange={(e) => setPushups(e.target.value.replace(/\D/g, ""))}
              className={inputCls}
              aria-label="Push-ups"
            />
          </Row>
          <Row label="Sit-ups" sub={preview ? `${preview.su_pts}/25 pts` : undefined}>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={situps}
              onChange={(e) => setSitups(e.target.value.replace(/\D/g, ""))}
              className={inputCls}
              aria-label="Sit-ups"
            />
          </Row>
          <Row label="2.4 km run" sub={preview ? `${preview.run_pts}/50 pts` : undefined}>
            <div className="flex items-center gap-1.5">
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="min"
                value={runMin}
                onChange={(e) => setRunMin(e.target.value.replace(/\D/g, "").slice(0, 2))}
                className={`${inputCls} w-16`}
                aria-label="Run minutes"
              />
              <span className="text-white">:</span>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="sec"
                value={runSec}
                onChange={(e) => setRunSec(e.target.value.replace(/\D/g, "").slice(0, 2))}
                className={`${inputCls} w-16`}
                aria-label="Run seconds"
              />
            </div>
          </Row>
        </Section>

        <Section header="Score preview">
          {preview ? (
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-[34px] font-bold leading-none">{preview.total}</div>
                <div className="mt-1 text-[13px] text-ios-label2">
                  {preview.pu_pts} + {preview.su_pts} + {preview.run_pts}
                </div>
              </div>
              <AwardBadge award={preview.award} />
            </div>
          ) : (
            <div className="px-4 py-3 text-[15px] text-ios-label2">
              {valid ? "Scoring unavailable" : "Enter all stations to see your score"}
            </div>
          )}
        </Section>
        {error && <p className="px-4 text-center text-[15px] text-ios-red">{error}</p>}
      </div>
    </Sheet>
  );
}
