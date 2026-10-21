"use client";

import { useMounted } from "./motion";

interface SparklineProps {
  values: number[];
  color: string;
  width?: number;
  height?: number;
}

/** Tiny trend line with a soft gradient fill. Needs at least two values. */
export function Sparkline({ values, color, width = 140, height = 40 }: SparklineProps) {
  const mounted = useMounted(200);
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 3;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * width,
    pad + (1 - (v - min) / span) * (height - pad * 2),
  ]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const id = `spark-${color.slice(1)}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" aria-hidden="true" className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} style={{ opacity: mounted ? 1 : 0, transition: "opacity 900ms ease 500ms" }} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={mounted ? 0 : 1}
        style={{ transition: "stroke-dashoffset 1300ms cubic-bezier(0.16,1,0.3,1)" }}
      />
    </svg>
  );
}
