"use client";

import { useEffect, useState } from "react";
import { Stepper } from "@/components/ui";

interface NumberStepRowProps {
  label: string;
  unit?: string;
  value: number;
  onChange: (value: number) => void;
  step: number;
  decimals?: number;
  max?: number;
}

/** Row with a directly editable number plus an iOS stepper. */
export function NumberStepRow({ label, unit, value, onChange, step, decimals = 0, max }: NumberStepRowProps) {
  const [text, setText] = useState(String(value));

  // Keep text in sync when the value changes externally (stepper, date switch).
  useEffect(() => {
    if (Number(text) !== value) setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function commit(raw: string) {
    setText(raw);
    if (raw.trim() === "") return;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return;
    const clamped = max !== undefined ? Math.min(max, n) : n;
    onChange(Number(clamped.toFixed(decimals)));
  }

  return (
    <div className="hairline flex min-h-[64px] items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0">
      <label className="min-w-0 flex-1">
        <span className="block text-[13px] text-white/55">{label}</span>
        <span className="mt-0.5 flex items-baseline gap-1.5">
          <input
            type="text"
            inputMode={decimals > 0 ? "decimal" : "numeric"}
            value={text}
            onChange={(e) => commit(e.target.value)}
            onBlur={() => setText(String(value))}
            onFocus={(e) => e.target.select()}
            style={{ width: `${Math.max(text.length, 1) + 0.6}ch` }}
            className="num min-w-[2ch] bg-transparent text-[24px] font-semibold leading-tight text-white outline-none"
            aria-label={label}
          />
          {unit && <span className="text-[14px] font-medium text-white/45">{unit}</span>}
        </span>
      </label>
      <Stepper value={value} onChange={onChange} step={step} decimals={decimals} max={max} />
    </div>
  );
}
