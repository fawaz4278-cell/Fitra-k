"use client";

import { useEffect, type ReactNode } from "react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Right-side header action, e.g. a Save button. */
  action?: ReactNode;
  children: ReactNode;
}

/** iOS-style bottom sheet with Cancel / title / action header. */
export function Sheet({ open, onClose, title, action, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className="relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] border-t border-white/10 bg-[#121215] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] animate-sheet-up">
        <div className="mx-auto mt-2.5 h-[5px] w-10 rounded-full bg-white/20" />
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-5 py-3.5">
          <button onClick={onClose} className="justify-self-start text-[16px] text-white/60">
            Cancel
          </button>
          <h2 className="justify-self-center text-[17px] font-semibold">{title}</h2>
          <div className="justify-self-end">{action}</div>
        </div>
        <div className="overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}
