import type { ReactNode } from "react";

/** Inset grouped section, iOS Settings style. */
export function Section({ header, footer, children }: { header?: string; footer?: string; children: ReactNode }) {
  return (
    <section className="mx-4 mb-7">
      {header && <h2 className="eyebrow mb-2 px-1">{header}</h2>}
      <div className="surface overflow-hidden">{children}</div>
      {footer && <p className="mt-2 px-1 text-[13px] leading-snug text-ios-label2">{footer}</p>}
    </section>
  );
}

/** A row inside a Section. Rows are separated by inset hairlines. */
export function Row({ label, children, sub }: { label: ReactNode; children?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="hairline flex min-h-[52px] items-center justify-between gap-3 border-b px-4 py-2.5 last:border-b-0">
      <div className="min-w-0">
        <div className="text-[16px]">{label}</div>
        {sub && <div className="mt-0.5 text-[13px] text-ios-label2">{sub}</div>}
      </div>
      {children !== undefined && <div className="shrink-0 text-[16px] text-ios-label2">{children}</div>}
    </div>
  );
}

/** Standalone rounded card. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`surface p-4 ${className}`}>{children}</div>;
}
