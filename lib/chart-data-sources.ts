// Chart Data Source Registry
// Maps data sources to compatible chart types and provides transform functions

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiData = any;

export type ChartTypeId = "BAR" | "LINE" | "PIE" | "AREA" | "RADAR" | "STACKED_BAR";

export type DataSourceCategory = "orders" | "factories" | "products" | "forecasting";

export type TransformedChartData = { chartData: Record<string, unknown>[]; dataKeys: string[]; nameKey: string; colors?: string[] };

export type MetricDefinition = {
  id: string;
  name: string;
  description: string;
  transform: (data: unknown) => TransformedChartData;
};

export type DataSourceDefinition = {
  id: string;
  endpoint: string;
  name: string;
  description: string;
  category: DataSourceCategory;
  compatibleCharts: ChartTypeId[];
  metrics: MetricDefinition[];
  supportsTimeFilter?: boolean;
};

const STATUS_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  "In Progress": "#3b82f6",
  "Behind Schedule": "#f59e0b",
  Completed: "#10b981",
  Shipped: "#8b5cf6",
  "In Transit": "#06b6d4",
  Customs: "#a855f7",
  Delivered: "#059669",
  Delayed: "#f97316",
  Disrupted: "#ef4444",
  Cancelled: "#6b7280",
};

const CHART_PALETTE = [
  "#EB5D2E", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#ef4444", "#06b6d4", "#ec4899", "#84cc16", "#f97316",
];

export const DATA_SOURCES: DataSourceDefinition[] = [
  {
    id: "status-breakdown",
    endpoint: "/api/dashboard/status-breakdown",
    name: "Order Status",
    description: "Distribution of orders by current status",
    category: "orders",
    compatibleCharts: ["PIE", "BAR"],
    supportsTimeFilter: true,
    metrics: [
      {
        id: "ordersByStatus",
        name: "Order Status Distribution",
        description: "How orders are distributed across statuses",
        transform: (data: ApiData) => ({
          chartData: data.map((d: ApiData) => ({ name: d.status, value: d.count, color: d.color })),
          dataKeys: ["value"],
          nameKey: "name",
          colors: data.map((d: ApiData) => d.color),
        }),
      },
    ],
  },
  {
    id: "product-portfolio",
    endpoint: "/api/dashboard/product-portfolio",
    name: "Product Portfolio",
    description: "Quantity breakdown by product",
    category: "products",
    compatibleCharts: ["PIE", "BAR"],
    supportsTimeFilter: true,
    metrics: [
      {
        id: "productSplit",
        name: "Product Portfolio Split",
        description: "Total quantity ordered per product",
        transform: (data: ApiData) => ({
          chartData: data.map((d: ApiData) => ({ name: d.name, value: d.value, color: d.color })),
          dataKeys: ["value"],
          nameKey: "name",
          colors: data.map((d: ApiData) => d.color),
        }),
      },
    ],
  },
  {
    id: "trends",
    endpoint: "/api/dashboard/trends",
    name: "Order Trends",
    description: "Weekly order volume over time",
    category: "orders",
    compatibleCharts: ["LINE", "AREA", "STACKED_BAR"],
    supportsTimeFilter: true,
    metrics: [
      {
        id: "ordersOverTime",
        name: "Orders Over Time",
        description: "Orders created per week, broken down by status",
        transform: (data: ApiData) => ({
          chartData: data.map((d: ApiData) => ({
            name: d.week,
            Pending: d.Pending || 0,
            "In Progress": d["In Progress"] || 0,
            "Behind Schedule": d["Behind Schedule"] || 0,
            Completed: d.Completed || 0,
            Delayed: d.Delayed || 0,
            Disrupted: d.Disrupted || 0,
            Shipped: d.Shipped || 0,
            "In Transit": d["In Transit"] || 0,
            Customs: d.Customs || 0,
            Delivered: d.Delivered || 0,
            Cancelled: d.Cancelled || 0,
          })),
          dataKeys: ["Pending", "In Progress", "Behind Schedule", "Completed", "Delayed", "Disrupted", "Shipped", "In Transit", "Customs", "Delivered", "Cancelled"],
          nameKey: "name",
          colors: [
            STATUS_COLORS["Pending"],
            STATUS_COLORS["In Progress"],
            STATUS_COLORS["Behind Schedule"],
            STATUS_COLORS["Completed"],
            STATUS_COLORS["Delayed"],
            STATUS_COLORS["Disrupted"],
            STATUS_COLORS["Shipped"],
            STATUS_COLORS["In Transit"],
            STATUS_COLORS["Customs"],
            STATUS_COLORS["Delivered"],
            STATUS_COLORS["Cancelled"],
          ],
        }),
      },
    ],
  },
  {
    id: "factory-stats",
    endpoint: "/api/dashboard/factory-stats",
    name: "Factory Statistics",
    description: "Performance metrics by factory",
    category: "factories",
    compatibleCharts: ["BAR", "RADAR"],
    supportsTimeFilter: true,
    metrics: [
      {
        id: "ordersPerFactory",
        name: "Orders Per Factory",
        description: "Total order count per factory",
        transform: (data: ApiData) => ({
          chartData: (data.factories || []).map((f: ApiData) => ({
            name: f.name,
            value: f.totalOrders,
          })),
          dataKeys: ["value"],
          nameKey: "name",
          colors: [CHART_PALETTE[0]],
        }),
      },
      {
        id: "factoryPerformance",
        name: "Factory Performance",
        description: "Multi-metric comparison across factories",
        transform: (data: ApiData) => ({
          chartData: (data.factories || []).map((f: ApiData) => ({
            name: f.name,
            "On-Time Rate": f.onTimeRate,
            "Completion Rate": f.completionRate,
            "Avg Progress": f.averageProgress,
          })),
          dataKeys: ["On-Time Rate", "Completion Rate", "Avg Progress"],
          nameKey: "name",
          colors: [CHART_PALETTE[0], CHART_PALETTE[1], CHART_PALETTE[2]],
        }),
      },
    ],
  },
  {
    id: "lead-time",
    endpoint: "/api/dashboard/lead-time",
    name: "Lead Time",
    description: "Average lead time analysis",
    category: "factories",
    compatibleCharts: ["BAR"],
    metrics: [
      {
        id: "leadTimeByFactory",
        name: "Lead Time by Factory",
        description: "Average days from order to completion per factory",
        transform: (data: ApiData) => ({
          chartData: (data.byFactory || []).map((f: ApiData) => ({
            name: f.factoryName,
            value: f.avgLeadTime,
            expected: f.avgExpectedTime,
          })),
          dataKeys: ["value"],
          nameKey: "name",
          colors: [CHART_PALETTE[0]],
        }),
      },
      {
        id: "leadTimeByProduct",
        name: "Lead Time by Product",
        description: "Average lead time per product type",
        transform: (data: ApiData) => ({
          chartData: (data.byProduct || []).map((p: ApiData) => ({
            name: p.productName,
            value: p.avgLeadTime,
          })),
          dataKeys: ["value"],
          nameKey: "name",
          colors: [CHART_PALETTE[0]],
        }),
      },
    ],
  },
  {
    id: "delay-analysis",
    endpoint: "/api/dashboard/delay-analysis",
    name: "Delay Analysis",
    description: "Delay rates and problem stages by factory",
    category: "factories",
    compatibleCharts: ["BAR", "STACKED_BAR"],
    metrics: [
      {
        id: "delayByFactory",
        name: "Delay Rate by Factory",
        description: "Percentage of orders delayed per factory",
        transform: (data: ApiData) => ({
          chartData: (data.byFactory || []).map((f: ApiData) => ({
            name: f.factoryName,
            value: f.delayRate,
          })),
          dataKeys: ["value"],
          nameKey: "name",
          colors: [CHART_PALETTE[5]],
        }),
      },
      {
        id: "delayByStage",
        name: "Incidents by Stage",
        description: "Delayed and blocked incidents per production stage",
        transform: (data: ApiData) => ({
          chartData: (data.byStage || []).map((s: ApiData) => ({
            name: s.stageName,
            Delayed: s.delayedCount,
            Blocked: s.blockedCount,
          })),
          dataKeys: ["Delayed", "Blocked"],
          nameKey: "name",
          colors: ["#f59e0b", "#ef4444"],
        }),
      },
    ],
  },
  {
    id: "forecasting",
    endpoint: "/api/dashboard/forecasting",
    name: "Forecasting",
    description: "Order delivery risk analysis",
    category: "forecasting",
    compatibleCharts: ["PIE", "BAR"],
    metrics: [
      {
        id: "riskDistribution",
        name: "Risk Distribution",
        description: "Active orders grouped by delivery risk level",
        transform: (data: ApiData) => {
          const summary = data.summary || { onTrack: 0, atRisk: 0, critical: 0 };
          return {
            chartData: [
              { name: "On Track", value: summary.onTrack, color: "#10b981" },
              { name: "At Risk", value: summary.atRisk, color: "#f59e0b" },
              { name: "Critical", value: summary.critical, color: "#ef4444" },
            ],
            dataKeys: ["value"],
            nameKey: "name",
            colors: ["#10b981", "#f59e0b", "#ef4444"],
          };
        },
      },
      {
        id: "progressByRisk",
        name: "Progress by Risk",
        description: "Average progress of orders by risk category",
        transform: (data: ApiData) => {
          const forecasts = data.forecasts || [];
          const groups: Record<string, number[]> = { "on-track": [], "at-risk": [], critical: [] };
          forecasts.forEach((f: ApiData) => groups[f.risk]?.push(f.progress));
          return {
            chartData: [
              { name: "On Track", value: avg(groups["on-track"]), color: "#10b981" },
              { name: "At Risk", value: avg(groups["at-risk"]), color: "#f59e0b" },
              { name: "Critical", value: avg(groups["critical"]), color: "#ef4444" },
            ],
            dataKeys: ["value"],
            nameKey: "name",
            colors: ["#10b981", "#f59e0b", "#ef4444"],
          };
        },
      },
    ],
  },
  {
    id: "stats",
    endpoint: "/api/dashboard/stats",
    name: "KPI Stats",
    description: "Key performance indicator trends",
    category: "orders",
    compatibleCharts: ["LINE", "AREA"],
    supportsTimeFilter: true,
    metrics: [
      {
        id: "kpiSparklines",
        name: "KPI Sparklines",
        description: "Trend lines for total, active, completed, and delayed orders",
        transform: (data: ApiData) => {
          const sparklines = data.sparklines || {};
          const total = sparklines.total || [];
          const bucketCount = total.length || 7;

          // Compute real date labels from period.from / period.to
          const fromMs = data.period?.from ? new Date(data.period.from).getTime() : Date.now() - 30 * 86400000;
          const toMs = data.period?.to ? new Date(data.period.to).getTime() : Date.now();
          const bucketMs = (toMs - fromMs) / bucketCount;

          return {
            chartData: total.map((_: number, i: number) => {
              const bucketDate = new Date(fromMs + bucketMs * i + bucketMs / 2);
              const label = bucketDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              return {
                name: label,
                Total: sparklines.total?.[i] || 0,
                Active: sparklines.active?.[i] || 0,
                Completed: sparklines.completed?.[i] || 0,
                Delayed: sparklines.delayed?.[i] || 0,
              };
            }),
            dataKeys: ["Total", "Active", "Completed", "Delayed"],
            nameKey: "name",
            colors: [CHART_PALETTE[0], CHART_PALETTE[1], CHART_PALETTE[2], CHART_PALETTE[3]],
          };
        },
      },
    ],
  },
  {
    id: "best-sellers",
    endpoint: "/api/dashboard/best-sellers",
    name: "Best Sellers",
    description: "Top products by total quantity ordered",
    category: "products",
    compatibleCharts: ["BAR", "PIE"],
    supportsTimeFilter: true,
    metrics: [
      {
        id: "topProducts",
        name: "Top Products by Quantity",
        description: "Products ranked by total units ordered",
        transform: (data: ApiData) => ({
          chartData: data.map((d: ApiData, i: number) => ({
            name: d.productName,
            value: d.totalQuantity,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
          })),
          dataKeys: ["value"],
          nameKey: "name",
          colors: data.map((_: ApiData, i: number) => CHART_PALETTE[i % CHART_PALETTE.length]),
        }),
      },
    ],
  },
];

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

// Get data sources compatible with a given chart type
export function getSourcesForChartType(chartType: ChartTypeId): DataSourceDefinition[] {
  return DATA_SOURCES.filter((ds) => ds.compatibleCharts.includes(chartType));
}

// Get all metrics compatible with a given chart type
export function getMetricsForChartType(chartType: ChartTypeId): Array<MetricDefinition & { dataSourceId: string; category: DataSourceCategory }> {
  const result: Array<MetricDefinition & { dataSourceId: string; category: DataSourceCategory }> = [];
  for (const ds of DATA_SOURCES) {
    if (ds.compatibleCharts.includes(chartType)) {
      for (const metric of ds.metrics) {
        result.push({ ...metric, dataSourceId: ds.id, category: ds.category });
      }
    }
  }
  return result;
}

// Find a data source by ID
export function getDataSource(id: string): DataSourceDefinition | undefined {
  return DATA_SOURCES.find((ds) => ds.id === id);
}

// Find a metric within a data source
export function getMetric(dataSourceId: string, metricId: string): MetricDefinition | undefined {
  const ds = getDataSource(dataSourceId);
  return ds?.metrics.find((m) => m.id === metricId);
}

// Linear regression for trend lines
export function linearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  const sumX = data.reduce((s, d) => s + d.x, 0);
  const sumY = data.reduce((s, d) => s + d.y, 0);
  const sumXY = data.reduce((s, d) => s + d.x * d.y, 0);
  const sumX2 = data.reduce((s, d) => s + d.x * d.x, 0);
  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

// Generate trend line points including forecast
export function getTrendLineData(
  data: Record<string, unknown>[],
  valueKey: string,
  nameKey: string,
  forecastPoints: number = 4
): Record<string, unknown>[] {
  const points = data.map((d, i) => ({ x: i, y: Number(d[valueKey]) || 0 }));
  const { slope, intercept } = linearRegression(points);
  const trendData = data.map((d, i) => ({
    [nameKey]: d[nameKey],
    trend: Math.round((slope * i + intercept) * 100) / 100,
  }));
  for (let i = 0; i < forecastPoints; i++) {
    const idx = data.length + i;
    trendData.push({
      [nameKey]: `Forecast ${i + 1}`,
      trend: Math.round((slope * idx + intercept) * 100) / 100,
    });
  }
  return trendData;
}

export { CHART_PALETTE };
