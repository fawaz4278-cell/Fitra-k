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
    <div className="flex min-h-[52px] items-center justify-between gap-3 border-b border-ios-sep/70 px-4 py-2 last:border-b-0">
      <label className="min-w-0 flex-1 text-[17px]">
        <span className="block">{label}</span>
        <span className="flex items-baseline gap-1">
          <input
            type="text"
            inputMode={decimals > 0 ? "decimal" : "numeric"}
            value={text}
            onChange={(e) => commit(e.target.value)}
            onBlur={() => setText(String(value))}
            onFocus={(e) => e.target.select()}
            className="w-24 bg-transparent text-[22px] font-semibold tabular-nums text-white outline-none"
            aria-label={label}
          />
          {unit && <span className="text-[13px] text-ios-label2">{unit}</span>}
        </span>
      </label>
      <Stepper value={value} onChange={onChange} step={step} decimals={decimals} max={max} />
    </div>
  );
}
