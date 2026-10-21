import type { ReactNode } from "react";

/** iOS large navigation title with an optional eyebrow above and trailing action (e.g. a "+" button). */
export function LargeTitle({ title, action, eyebrow }: { title: string; action?: ReactNode; eyebrow?: string }) {
  return (
    <header className="flex items-end justify-between px-5 pb-4 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h1 className="truncate text-[34px] font-bold leading-[1.1] tracking-[-0.02em]">{title}</h1>
      </div>
      {action}
    </header>
  );
}
