import type { ReactNode } from "react";

/** Inset grouped section, iOS Settings style. */
export function Section({ header, footer, children }: { header?: string; footer?: string; children: ReactNode }) {
  return (
    <section className="mx-4 mb-6">
      {header && <h2 className="mb-1.5 px-4 text-[13px] uppercase text-ios-label2">{header}</h2>}
      <div className="overflow-hidden rounded-[10px] bg-ios-card">{children}</div>
      {footer && <p className="mt-1.5 px-4 text-[13px] text-ios-label2">{footer}</p>}
    </section>
  );
}

/** A row inside a Section. Rows are separated by inset hairlines. */
export function Row({ label, children, sub }: { label: ReactNode; children?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex min-h-[44px] items-center justify-between gap-3 border-b border-ios-sep/70 px-4 py-2 last:border-b-0">
      <div className="min-w-0">
        <div className="text-[17px]">{label}</div>
        {sub && <div className="text-[13px] text-ios-label2">{sub}</div>}
      </div>
      {children !== undefined && <div className="shrink-0 text-[17px] text-ios-label2">{children}</div>}
    </div>
  );
}

/** Standalone rounded card. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[14px] bg-ios-card p-4 ${className}`}>{children}</div>;
}
