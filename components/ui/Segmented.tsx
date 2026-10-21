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
    <div className={`rounded-[9px] bg-ios-card2 p-0.5 ${scroll ? "overflow-x-auto no-scrollbar" : ""}`}>
      <div className={`flex ${scroll ? "w-max" : "w-full"}`}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex-1 whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[13px] font-medium transition-colors ${
              o.value === value ? "bg-[#636366] text-white shadow" : "text-white/80"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
