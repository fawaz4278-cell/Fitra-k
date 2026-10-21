"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Right-side header action, e.g. a Save button. */
  action?: ReactNode;
  children: ReactNode;
}

const EXIT_MS = 240;
/** Drag further than this (px), or flick down fast, to dismiss. */
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 0.6;

/**
 * iOS-style bottom sheet with Cancel / title / action header. Springs up on open, slides away on close,
 * and can be dragged down by its handle or header to dismiss. Rendered into <body> so no ancestor
 * (animations, transforms, stacking) can trap it under the tab bar.
 */
export function Sheet({ open, onClose, title, action, children }: SheetProps) {
  // Stay mounted briefly after closing so the exit animation can play.
  const [rendered, setRendered] = useState(open);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ startY: number; startT: number; lastY: number; lastT: number } | null>(null);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setDragY(0);
      return;
    }
    const t = setTimeout(() => setRendered(false), EXIT_MS);
    return () => clearTimeout(t);
  }, [open]);

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

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    // Let buttons in the header (Cancel / Save) work normally.
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const now = performance.now();
    drag.current = { startY: e.clientY, startT: now, lastY: e.clientY, lastT: now };
    setDragging(true);
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const dy = e.clientY - drag.current.startY;
    // Resist dragging upwards, follow the finger downwards.
    setDragY(dy > 0 ? dy : dy / 6);
    drag.current.lastY = e.clientY;
    drag.current.lastT = performance.now();
  }
  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (!d) return;
    const dy = e.clientY - d.startY;
    const velocity = dy / Math.max(1, performance.now() - d.startT);
    if (dy > DISMISS_DISTANCE || (dy > 30 && velocity > DISMISS_VELOCITY)) {
      onClose();
    } else {
      setDragY(0);
    }
  }

  if (!rendered || typeof document === "undefined") return null;
  const closing = !open;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true" aria-label={title}>
      <button
        aria-label="Close"
        className={`absolute inset-0 bg-black/70 backdrop-blur-[3px] ${closing ? "animate-fade-out" : "animate-fade-in"}`}
        style={{ opacity: closing ? undefined : Math.max(0.2, 1 - dragY / 500) }}
        onClick={onClose}
      />
      <div
        className={`relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] border-t border-white/10 bg-[#121215] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] ${
          closing ? "animate-sheet-down" : "animate-sheet-up"
        }`}
        style={
          closing
            ? undefined
            : {
                transform: `translateY(${dragY}px)`,
                transition: dragging ? "none" : "transform 550ms var(--spring)",
              }
        }
      >
        <div
          className="cursor-grab touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="mx-auto mt-2.5 h-[5px] w-10 rounded-full bg-white/25" />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center px-5 py-3.5">
            <button onClick={onClose} className="justify-self-start text-[16px] text-white/60 transition-opacity active:opacity-50">
              Cancel
            </button>
            <h2 className="justify-self-center text-[17px] font-semibold">{title}</h2>
            <div className="justify-self-end">{action}</div>
          </div>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
