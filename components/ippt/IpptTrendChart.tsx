"use client";

import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatShortDate } from "@/lib/date";
import type { IpptAttempt } from "@/lib/types";

const TOOLTIP = {
  contentStyle: {
    background: "rgba(28,28,32,0.95)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    color: "#fff",
    fontSize: 13,
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
  },
  labelStyle: { color: "rgba(235,235,245,0.6)" },
  cursor: { stroke: "rgba(255,255,255,0.15)" },
};

export default function IpptTrendChart({ attempts, target }: { attempts: IpptAttempt[]; target: number }) {
  const data = [...attempts]
    .sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at))
    .map((a) => ({ date: a.date, total: a.total }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          <defs>
            <linearGradient id="ipptFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffb340" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#ffb340" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ipptLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffd60a" />
              <stop offset="100%" stopColor="#ff7a2f" />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => formatShortDate(d)}
            tick={{ fill: "rgba(235,235,245,0.4)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis domain={[0, 100]} ticks={[0, 50, 75, 100]} tick={{ fill: "rgba(235,235,245,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            {...TOOLTIP}
            labelFormatter={(d) => formatShortDate(String(d), true)}
            formatter={(v) => [`${v} pts`, "Total"]}
          />
          <ReferenceLine y={target} stroke="rgba(255,255,255,0.35)" strokeDasharray="3 5" />
          <Area
            type="monotone"
            dataKey="total"
            stroke="url(#ipptLine)"
            strokeWidth={3}
            fill="url(#ipptFill)"
            dot={{ r: 4, fill: "#0e0e11", stroke: "#ffb340", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#ffb340", stroke: "#0e0e11", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
