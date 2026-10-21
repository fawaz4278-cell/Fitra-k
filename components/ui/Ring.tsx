"use client";

import type { ReactNode } from "react";
import { useMounted } from "./motion";

interface RingProps {
  /** 0–1 */
  progress: number;
  size?: number;
  stroke?: number;
  /** Gradient colours from start to end of the arc. */
  from: string;
  to: string;
  children?: ReactNode;
}

/** Circular progress ring with a gradient arc and optional centre content. */
export function Ring({ progress, size = 72, stroke = 8, from, to, children }: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const mounted = useMounted(120);
  const p = mounted ? Math.min(1, Math.max(0, progress)) : 0;
  const id = `ring-${from.slice(1)}-${to.slice(1)}`;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          style={{ transition: "stroke-dashoffset 1400ms cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}
