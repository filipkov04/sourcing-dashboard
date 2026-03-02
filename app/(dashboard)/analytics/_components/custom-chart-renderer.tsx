"use client";

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useTheme } from "@/components/theme-provider";
import { linearRegression, CHART_PALETTE } from "@/lib/chart-data-sources";

type ChartRendererProps = {
  chartType: string;
  data: any[];
  dataKeys: string[];
  nameKey: string;
  colors?: string[];
  config?: Record<string, any>;
  height?: number;
};

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#27272a",
    border: "1px solid #3f3f46",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#fff",
  },
  itemStyle: { color: "#a1a1aa" },
  labelStyle: { color: "#fff", fontWeight: 600, marginBottom: 2 },
};

export function CustomChartRenderer({
  chartType,
  data,
  dataKeys,
  nameKey,
  colors,
  config,
  height = 300,
}: ChartRendererProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const axisColor = isDark ? "#71717a" : "#9ca3af";
  const gridColor = isDark ? "#3f3f46" : "#e5e7eb";
  const palette = colors?.length ? colors : CHART_PALETTE;

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-500 dark:text-zinc-400" style={{ height }}>
        No data available
      </div>
    );
  }

  switch (chartType) {
    case "BAR":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <XAxis dataKey={nameKey} tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            {dataKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={palette[i % palette.length]} radius={[4, 4, 0, 0]} barSize={32} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case "LINE": {
      const showTrend = config?.showTrendLine;
      let trendData: any[] | null = null;
      if (showTrend && dataKeys.length === 1) {
        const points = data.map((d, i) => ({ x: i, y: Number(d[dataKeys[0]]) || 0 }));
        const { slope, intercept } = linearRegression(points);
        trendData = data.map((d, i) => ({ ...d, _trend: Math.round((slope * i + intercept) * 100) / 100 }));
        // Add forecast points
        for (let f = 0; f < 4; f++) {
          const idx = data.length + f;
          trendData.push({
            [nameKey]: `+${f + 1}`,
            _trend: Math.round((slope * idx + intercept) * 100) / 100,
          });
        }
      }
      const chartData = trendData || data;
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <XAxis dataKey={nameKey} tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            {dataKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={palette[i % palette.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            ))}
            {showTrend && (
              <Line type="monotone" dataKey="_trend" stroke="#a1a1aa" strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="Trend" />
            )}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    case "PIE":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              dataKey={dataKeys[0]}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              outerRadius={height / 3}
              innerRadius={height / 6}
              paddingAngle={2}
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={{ stroke: axisColor }}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color || palette[i % palette.length]} />
              ))}
            </Pie>
            <Tooltip {...TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      );

    case "AREA": {
      const showTrend = config?.showTrendLine;
      let trendData: any[] | null = null;
      if (showTrend && dataKeys.length === 1) {
        const points = data.map((d, i) => ({ x: i, y: Number(d[dataKeys[0]]) || 0 }));
        const { slope, intercept } = linearRegression(points);
        trendData = data.map((d, i) => ({ ...d, _trend: Math.round((slope * i + intercept) * 100) / 100 }));
        for (let f = 0; f < 4; f++) {
          const idx = data.length + f;
          trendData.push({
            [nameKey]: `+${f + 1}`,
            _trend: Math.round((slope * idx + intercept) * 100) / 100,
          });
        }
      }
      const chartData = trendData || data;
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <XAxis dataKey={nameKey} tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            {dataKeys.map((key, i) => (
              <Area key={key} type="monotone" dataKey={key} stroke={palette[i % palette.length]} fill={palette[i % palette.length]} fillOpacity={0.15} strokeWidth={2} />
            ))}
            {showTrend && (
              <Line type="monotone" dataKey="_trend" stroke="#a1a1aa" strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="Trend" />
            )}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    case "RADAR":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={data} cx="50%" cy="50%" outerRadius={height / 3.5}>
            <PolarGrid stroke={gridColor} />
            <PolarAngleAxis
              dataKey={nameKey}
              tick={({ x, y, payload, textAnchor }) => {
                const label = String(payload?.value || "");
                const short = label.length > 12 ? label.slice(0, 11) + "\u2026" : label;
                return (
                  <text x={x} y={y} textAnchor={textAnchor} fill={axisColor} fontSize={10}>
                    {short}
                  </text>
                );
              }}
            />
            <PolarRadiusAxis tick={{ fontSize: 9, fill: axisColor }} />
            {dataKeys.map((key, i) => (
              <Radar key={key} name={key} dataKey={key} stroke={palette[i % palette.length]} fill={palette[i % palette.length]} fillOpacity={0.2} />
            ))}
            <Tooltip {...TOOLTIP_STYLE} />
            {dataKeys.length > 1 && <Legend />}
          </RadarChart>
        </ResponsiveContainer>
      );

    case "STACKED_BAR":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <XAxis dataKey={nameKey} tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend />
            {dataKeys.map((key, i) => (
              <Bar key={key} dataKey={key} stackId="1" fill={palette[i % palette.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    default:
      return (
        <div className="flex items-center justify-center text-sm text-gray-500 dark:text-zinc-400" style={{ height }}>
          Unsupported chart type: {chartType}
        </div>
      );
  }
}
