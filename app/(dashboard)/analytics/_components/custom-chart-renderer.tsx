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
  const legendStyle = { fontSize: 11, color: isDark ? "#a1a1aa" : "#6b7280" };
  const arrowId = isDark ? "axis-arrow-dark" : "axis-arrow-light";
  const arrowUpId = `${arrowId}-up`;
  const xAxisLine = { stroke: gridColor, strokeWidth: 1, markerEnd: `url(#${arrowId})` };
  const yAxisLine = { stroke: gridColor, strokeWidth: 1, markerStart: `url(#${arrowUpId})` };

  // SVG arrow marker definitions — filled triangles
  const axisArrowDefs = (
    <defs>
      <marker id={arrowId} markerWidth="10" markerHeight="10" refX="10" refY="5">
        <path d="M0,0 L10,5 L0,10 Z" fill={gridColor} />
      </marker>
      <marker id={arrowUpId} markerWidth="10" markerHeight="10" refX="5" refY="0">
        <path d="M0,10 L5,0 L10,10 Z" fill={gridColor} />
      </marker>
    </defs>
  );

  // Custom angled tick that renders entirely below the axis line
  const angledTick = ({ x, y, payload }: any) => {
    const label = String(payload?.value || "");
    const short = label.length > 14 ? label.slice(0, 13) + "…" : label;
    return (
      <g transform={`translate(${x},${y + 10})`}>
        <text
          x={0} y={0}
          textAnchor="end"
          fill={axisColor}
          fontSize={10}
          transform="rotate(-40)"
        >
          {short}
        </text>
      </g>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-500 dark:text-zinc-400" style={{ height }}>
        No data available
      </div>
    );
  }

  switch (chartType) {
    case "BAR": {
      const manyItems = data.length > 5;
      const multiKey = dataKeys.length > 1;
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
            {axisArrowDefs}
            {manyItems && multiKey ? (
              <XAxis dataKey={nameKey} tick={false} tickLine={false} axisLine={xAxisLine} padding={{ right: 15 }} />
            ) : manyItems ? (
              <XAxis dataKey={nameKey} tick={angledTick} tickLine={false} axisLine={xAxisLine} interval={0} height={90} padding={{ right: 15 }} />
            ) : (
              <XAxis dataKey={nameKey} tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={xAxisLine} padding={{ right: 15 }} />
            )}
            <YAxis tick={{ fontSize: 11, fill: axisColor }} tickLine={{ stroke: gridColor, strokeWidth: 1 }} tickSize={4} axisLine={yAxisLine} padding={{ top: 15 }} />
            <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            {dataKeys.length > 1 && <Legend wrapperStyle={legendStyle} />}
            {dataKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={palette[i % palette.length]} radius={[4, 4, 0, 0]} barSize={32} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    case "LINE": {
      const showTrend = config?.showTrendLine;
      let trendData: any[] | null = null;
      if (showTrend) {
        // For single-key, trend that key; for multi-key, trend the first key
        const trendKey = dataKeys[0];
        const points = data.map((d, i) => ({ x: i, y: Number(d[trendKey]) || 0 }));
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
          <LineChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
            {axisArrowDefs}
            <XAxis dataKey={nameKey} tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={xAxisLine} padding={{ right: 15 }} />
            <YAxis tick={{ fontSize: 11, fill: axisColor }} tickLine={{ stroke: gridColor, strokeWidth: 1 }} tickSize={4} axisLine={yAxisLine} padding={{ top: 15 }} />
            <Tooltip {...TOOLTIP_STYLE} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
            {(dataKeys.length > 1 || showTrend) && <Legend wrapperStyle={legendStyle} />}
            {dataKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={palette[i % palette.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            ))}
            {showTrend && (
              <Line type="monotone" dataKey="_trend" stroke="#a1a1aa" strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="Forecast" />
            )}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    case "PIE": {
      const pieTotal = data.reduce((sum, d) => sum + (Number(d[dataKeys[0]]) || 0), 0);
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
              paddingAngle={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color || palette[i % palette.length]} />
              ))}
            </Pie>
            <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(value: any, name: any) => {
              const pct = pieTotal > 0 ? ((Number(value) / pieTotal) * 100).toFixed(0) : 0;
              return [`${value} (${pct}%)`, name];
            }} />
            <Legend wrapperStyle={legendStyle} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    case "AREA": {
      const showTrend = config?.showTrendLine;
      let trendData: any[] | null = null;
      if (showTrend) {
        const trendKey = dataKeys[0];
        const points = data.map((d, i) => ({ x: i, y: Number(d[trendKey]) || 0 }));
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
          <AreaChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
            {axisArrowDefs}
            <XAxis dataKey={nameKey} tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={xAxisLine} padding={{ right: 15 }} />
            <YAxis tick={{ fontSize: 11, fill: axisColor }} tickLine={{ stroke: gridColor, strokeWidth: 1 }} tickSize={4} axisLine={yAxisLine} padding={{ top: 15 }} />
            <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            {(dataKeys.length > 1 || showTrend) && <Legend wrapperStyle={legendStyle} />}
            {dataKeys.map((key, i) => (
              <Area key={key} type="monotone" dataKey={key} stroke={palette[i % palette.length]} fill={palette[i % palette.length]} fillOpacity={0.15} strokeWidth={2} />
            ))}
            {showTrend && (
              <Line type="monotone" dataKey="_trend" stroke="#a1a1aa" strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="Forecast" />
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
            <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            {dataKeys.length > 1 && <Legend wrapperStyle={legendStyle} />}
          </RadarChart>
        </ResponsiveContainer>
      );

    case "STACKED_BAR": {
      const manyItems = data.length > 5;
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
            {axisArrowDefs}
            {manyItems ? (
              <XAxis dataKey={nameKey} tick={angledTick} tickLine={false} axisLine={xAxisLine} interval={0} height={90} padding={{ right: 15 }} />
            ) : (
              <XAxis dataKey={nameKey} tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={xAxisLine} padding={{ right: 15 }} />
            )}
            <YAxis tick={{ fontSize: 11, fill: axisColor }} tickLine={{ stroke: gridColor, strokeWidth: 1 }} tickSize={4} axisLine={yAxisLine} padding={{ top: 15 }} />
            <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Legend wrapperStyle={legendStyle} />
            {dataKeys.map((key, i) => (
              <Bar key={key} dataKey={key} stackId="1" fill={palette[i % palette.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    default:
      return (
        <div className="flex items-center justify-center text-sm text-gray-500 dark:text-zinc-400" style={{ height }}>
          Unsupported chart type: {chartType}
        </div>
      );
  }
}
