"use client";

import { Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatShortDate } from "@/lib/date";
import type { WeightPoint } from "./stats";

export default function WeightTrendChart({ points, target }: { points: WeightPoint[]; target: number | null }) {
  const values = points.flatMap((p) => [p.kg, p.avg7]).concat(target != null ? [target] : []);
  const lo = Math.floor(Math.min(...values) - 1);
  const hi = Math.ceil(Math.max(...values) + 1);

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => formatShortDate(d)}
            tick={{ fill: "#8e8e93", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis domain={[lo, hi]} tick={{ fill: "#8e8e93", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "#2c2c2e", border: "none", borderRadius: 10, color: "#fff" }}
            labelFormatter={(d) => formatShortDate(String(d), true)}
            formatter={(v, name) => [`${Number(v).toFixed(1)} kg`, name === "avg7" ? "7-day avg" : "Weight"]}
          />
          <Legend
            iconType="plainline"
            wrapperStyle={{ fontSize: 12, color: "#8e8e93" }}
            formatter={(v) => (v === "avg7" ? "7-day avg" : "Weight")}
          />
          {target != null && <ReferenceLine y={target} stroke="#30d158" strokeDasharray="4 4" />}
          <Line type="monotone" dataKey="kg" stroke="#8e8e93" strokeWidth={1} dot={{ r: 2, fill: "#8e8e93" }} isAnimationActive={false} />
          <Line type="monotone" dataKey="avg7" stroke="#0a84ff" strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
