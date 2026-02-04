"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

export type OrdersByFactoryData = {
  name: string;
  count: number;
}[];

export function OrdersByFactoryChart({ data }: { data: OrdersByFactoryData }) {
  // Limit to top 5 factories
  const topFactories = data.slice(0, 5);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={topFactories}
        layout="vertical"
        margin={{ top: 5, right: 80, left: 5, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.2} horizontal={false} />
        <XAxis
          type="number"
          stroke="#71717a"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          hide
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#a1a1aa"
          fontSize={13}
          tickLine={false}
          axisLine={false}
          width={150}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#60a5fa">
          <LabelList
            dataKey="count"
            position="right"
            style={{ fill: "#a1a1aa", fontSize: "13px", fontWeight: 500 }}
            formatter={(value: number) => `${value} orders`}
          />
          {topFactories.map((_, index) => (
            <Cell key={`cell-${index}`} fill="#60a5fa" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
