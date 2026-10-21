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

const btn =
  "flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-[20px] leading-none text-white [transition:transform_450ms_var(--spring-bouncy),background-color_200ms] active:scale-[0.82] active:bg-white/[0.18] active:[transition-duration:90ms] disabled:opacity-25";

/** −/+ stepper with round buttons. */
export function Stepper({ value, onChange, step = 1, min = 0, max = Infinity, decimals = 0 }: StepperProps) {
  const round = (n: number) => Number(n.toFixed(decimals));
  const set = (n: number) => onChange(round(Math.min(max, Math.max(min, n))));
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label="Decrease" disabled={value <= min} onClick={() => set(value - step)} className={btn}>
        −
      </button>
      <button type="button" aria-label="Increase" disabled={value >= max} onClick={() => set(value + step)} className={btn}>
        +
      </button>
    </div>
  );
}
