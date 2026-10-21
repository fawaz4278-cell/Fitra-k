"use client";

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Decimal places to display/round to. */
  decimals?: number;
}

/** iOS-style −/+ stepper. */
export function Stepper({ value, onChange, step = 1, min = 0, max = Infinity, decimals = 0 }: StepperProps) {
  const round = (n: number) => Number(n.toFixed(decimals));
  const set = (n: number) => onChange(round(Math.min(max, Math.max(min, n))));
  return (
    <div className="flex items-center overflow-hidden rounded-[9px] bg-ios-card2">
      <button
        type="button"
        aria-label="Decrease"
        disabled={value <= min}
        onClick={() => set(value - step)}
        className="h-8 w-11 text-[20px] leading-none disabled:opacity-30"
      >
        −
      </button>
      <div className="h-5 w-px bg-ios-sep" />
      <button
        type="button"
        aria-label="Increase"
        disabled={value >= max}
        onClick={() => set(value + step)}
        className="h-8 w-11 text-[20px] leading-none disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
