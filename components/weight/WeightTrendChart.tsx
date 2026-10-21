"use client";

import { Area, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatShortDate } from "@/lib/date";
import type { WeightPoint } from "./stats";

export default function WeightTrendChart({ points, target }: { points: WeightPoint[]; target: number | null }) {
  const values = points.flatMap((p) => [p.kg, p.avg7]).concat(target != null ? [target] : []);
  const lo = Math.floor(Math.min(...values) - 1);
  const hi = Math.ceil(Math.max(...values) + 1);

  return (
    <div className="w-full">
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5ac8fa" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#5ac8fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => formatShortDate(d)}
              tick={{ fill: "rgba(235,235,245,0.4)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis domain={[lo, hi]} tick={{ fill: "rgba(235,235,245,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "rgba(28,28,32,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "#fff",
                fontSize: 13,
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              }}
              labelStyle={{ color: "rgba(235,235,245,0.6)" }}
              cursor={{ stroke: "rgba(255,255,255,0.15)" }}
              labelFormatter={(d) => formatShortDate(String(d), true)}
              formatter={(v, name) => [`${Number(v).toFixed(1)} kg`, name === "avg7" ? "7-day avg" : "Weight"]}
            />
            {target != null && <ReferenceLine y={target} stroke="#34d399" strokeOpacity={0.6} strokeDasharray="3 5" />}
            <Area type="monotone" dataKey="avg7" stroke="#5ac8fa" strokeWidth={3} fill="url(#weightFill)" dot={false} animationDuration={1400} animationEasing="ease-out" />
            <Line type="monotone" dataKey="kg" stroke="none" dot={{ r: 2.5, fill: "rgba(255,255,255,0.55)", strokeWidth: 0 }} activeDot={{ r: 4 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex gap-4 text-[12px] text-white/50">
        <span className="flex items-center gap-1.5">
          <span className="h-[3px] w-4 rounded-full bg-[#5ac8fa]" />7-day average
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-white/55" />Weigh-ins
        </span>
        {target != null && (
          <span className="flex items-center gap-1.5">
            <span className="h-0 w-4 border-t border-dashed border-[#34d399]" />Target
          </span>
        )}
      </div>
    </div>
  );
}
