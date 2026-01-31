"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { OrderSummaryData } from "./orders-over-time-section";

export function OrderSummaryChart({ data }: { data: OrderSummaryData }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
        <XAxis
          type="number"
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={80}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
          labelStyle={{ color: "#374151", fontWeight: 600 }}
          formatter={(value: number) => [value, "Orders"]}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
