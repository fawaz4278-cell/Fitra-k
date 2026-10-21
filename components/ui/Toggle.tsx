"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

/** iOS switch. */
export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 ${
        checked ? "bg-ios-green" : "bg-white/[0.14]"
      }`}
    >
      <span
        className={`absolute left-0 top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.35)] [transition:transform_500ms_var(--spring-bouncy)] active:w-[31px] ${
          checked ? "translate-x-[22px] active:translate-x-[18px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}
