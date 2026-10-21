"use client";

interface SegmentedProps<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Allow horizontal scrolling when there are many options. */
  scroll?: boolean;
}

/** iOS segmented control. */
export function Segmented<T extends string | number>({ options, value, onChange, scroll }: SegmentedProps<T>) {
  return (
    <div className={`rounded-[12px] bg-white/[0.07] p-[3px] ${scroll ? "overflow-x-auto no-scrollbar" : ""}`}>
      <div className={`flex ${scroll ? "w-max" : "w-full"}`}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex-1 whitespace-nowrap rounded-[9px] px-3 py-[7px] text-[13px] font-semibold transition-all duration-200 ${
              o.value === value
                ? "bg-white/[0.16] text-white shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]"
                : "text-white/55"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
