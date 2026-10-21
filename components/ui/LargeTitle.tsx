import type { ReactNode } from "react";

/** iOS large navigation title with optional trailing action (e.g. a "+" button). */
export function LargeTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="flex items-end justify-between px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <h1 className="text-[34px] font-bold leading-tight tracking-tight">{title}</h1>
      {action}
    </header>
  );
}
