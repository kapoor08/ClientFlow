"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import type { PlanDistributionRow } from "@/server/admin/analytics";

const PLAN_COLORS: Record<string, string> = {
  free: "#94a3b8",
  starter: "#3b82f6",
  professional: "#8b5cf6",
  enterprise: "#22c55e",
};

function getColor(code: string) {
  return PLAN_COLORS[code.toLowerCase()] ?? "#3b82f6";
}

type Props = { data: PlanDistributionRow[] };

export function PlanDistributionChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <BarChart3 size={24} className="opacity-40" />
        <p className="text-xs">No active subscriptions.</p>
      </div>
    );
  }

  const chartData = data.map((r) => ({
    name: r.planName,
    code: r.planCode,
    count: r.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
        barSize={16}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={88}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: 12,
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
          formatter={(v: number) => [v, "Active subs"]}
        />
        <Bar dataKey="count" radius={[0, 3, 3, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.code} fill={getColor(entry.code)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
