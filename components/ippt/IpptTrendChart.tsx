"use client";

import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatShortDate } from "@/lib/date";
import type { IpptAttempt } from "@/lib/types";

export default function IpptTrendChart({ attempts, target }: { attempts: IpptAttempt[]; target: number }) {
  const data = [...attempts]
    .sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at))
    .map((a) => ({ date: a.date, total: a.total }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => formatShortDate(d)}
            tick={{ fill: "#8e8e93", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: "#8e8e93", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#2c2c2e", border: "none", borderRadius: 10, color: "#fff" }}
            labelFormatter={(d) => formatShortDate(String(d), true)}
            formatter={(v) => [`${v} pts`, "Total"]}
          />
          <ReferenceLine y={target} stroke="#ff9f0a" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="total" stroke="#0a84ff" strokeWidth={2.5} dot={{ r: 3, fill: "#0a84ff" }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
