"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { BarChart3, Clock, Target } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { AnimatedNumber } from "@/components/animated-number";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LeadTimeChart } from "./_components/lead-time-chart";
import { StageDurationChart } from "./_components/stage-duration-chart";
import { FactoryComparisonTable } from "./_components/factory-comparison-table";
import { ForecastTimeline } from "./_components/forecast-timeline";
import { CustomChartsTab } from "./_components/custom-charts-tab";
import { ScrollReveal } from "@/components/scroll-reveal";

type LeadTimeData = {
  overall: { avgLeadTime: number; minLeadTime: number; maxLeadTime: number; totalOrders: number };
  byFactory: any[];
  byProduct: any[];
};

type StageDurationData = {
  overall: any[];
  bottleneck: string | null;
  byFactory: any[];
};

type ForecastData = {
  summary: { total: number; onTrack: number; atRisk: number; critical: number };
  forecasts: any[];
};

type DailyStat = {
  day: string;
  created: number;
  completed: number;
  delayed: number;
  active: number;
};

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [leadTime, setLeadTime] = useState<LeadTimeData | null>(null);
  const [stageDuration, setStageDuration] = useState<StageDurationData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [ltRes, sdRes, fcRes, dsRes] = await Promise.all([
          fetch("/api/dashboard/lead-time"),
          fetch("/api/dashboard/stage-duration"),
          fetch("/api/dashboard/forecasting"),
          fetch("/api/dashboard/daily-stats"),
        ]);

        const [ltData, sdData, fcData, dsData] = await Promise.all([
          ltRes.json(),
          sdRes.json(),
          fcRes.json(),
          dsRes.json(),
        ]);

        if (ltData.success) setLeadTime(ltData.data);
        if (sdData.success) setStageDuration(sdData.data);
        if (fcData.success) setForecast(fcData.data);
        if (dsData.success) setDailyStats(dsData.data);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
            Deep insights into production performance
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EB5D2E]" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-5">
      {/* HUD Grid Overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-0 dark:opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,77,21,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,21,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Analytics</h1>
        <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
          Deep insights into production performance
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="custom">Custom Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-5">
            {/* Summary Cards */}
            <ScrollReveal className="grid gap-4 sm:grid-cols-3" stagger>
              <SummaryCard
                icon={Clock}
                label="Avg Lead Time"
                value={leadTime ? `${leadTime.overall.avgLeadTime}d` : "—"}
                numericValue={leadTime?.overall.avgLeadTime}
                suffix="d"
                subtitle={leadTime ? `${leadTime.overall.totalOrders} completed orders` : "No data"}
                sparklineData={dailyStats.map((d) => ({ v: d.completed }))}
                sparklineColor="#22c55e"
              />
              <SummaryCard
                icon={Target}
                label="On Track"
                value={forecast ? `${forecast.summary.onTrack}/${forecast.summary.total}` : "—"}
                subtitle="Active orders on schedule"
                highlight={forecast ? forecast.summary.critical > 0 : false}
                sparklineData={dailyStats.map((d) => ({ v: d.created }))}
                sparklineColor="#a855f7"
              />
              <SummaryCard
                icon={BarChart3}
                label="At Risk"
                value={forecast ? `${forecast.summary.atRisk + forecast.summary.critical}` : "—"}
                numericValue={forecast ? forecast.summary.atRisk + forecast.summary.critical : undefined}
                subtitle="Orders may miss deadline"
                highlight={forecast ? forecast.summary.critical > 0 : false}
                sparklineData={dailyStats.map((d) => ({ v: d.delayed }))}
                sparklineColor="#ef4444"
              />
            </ScrollReveal>

            {/* Lead Time Analysis */}
            <ScrollReveal>
              <p className="hud-section-label font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-500 mb-4">
                Lead Time
              </p>
              <Card className="bg-white dark:bg-[#0d0f13] border-gray-100 dark:border-zinc-800/60 rounded-xl card-hover-glow hud-corners">
                <CardContent className="pt-6">
                  {leadTime && (
                    <LeadTimeChart data={leadTime.byFactory} overallAvg={leadTime.overall.avgLeadTime} />
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Stage Duration */}
            <ScrollReveal>
              <p className="hud-section-label font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-500 mb-4">
                Stage Duration
              </p>
              <Card className="bg-white dark:bg-[#0d0f13] border-gray-100 dark:border-zinc-800/60 rounded-xl card-hover-glow hud-corners">
                <CardContent className="pt-6">
                  {stageDuration && (
                    <StageDurationChart
                      overall={stageDuration.overall}
                      bottleneck={stageDuration.bottleneck}
                      byFactory={stageDuration.byFactory}
                    />
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Factory Comparison Table */}
            <ScrollReveal>
              <p className="hud-section-label font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-500 mb-4">
                Factory Comparison
              </p>
              <Card className="bg-white dark:bg-[#0d0f13] border-gray-100 dark:border-zinc-800/60 rounded-xl card-hover-glow hud-corners">
                <CardContent className="pt-6">
                  {leadTime && stageDuration && (
                    <FactoryComparisonTable
                      leadTimeData={leadTime.byFactory}
                      stageData={stageDuration.byFactory}
                    />
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Production Forecast */}
            <ScrollReveal>
              <p className="hud-section-label font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-500 mb-4">
                Forecast
              </p>
              <Card className="bg-white dark:bg-[#0d0f13] border-gray-100 dark:border-zinc-800/60 rounded-xl card-hover-glow hud-corners">
                <CardContent className="pt-6">
                  {forecast && (
                    <ForecastTimeline forecasts={forecast.forecasts} summary={forecast.summary} />
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </TabsContent>

        <TabsContent value="custom" forceMount className="data-[state=inactive]:hidden mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300">
          <CustomChartsTab userId={session?.user?.id || ""} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  numericValue,
  suffix,
  subtitle,
  highlight,
  sparklineData,
  sparklineColor,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  numericValue?: number;
  suffix?: string;
  subtitle: string;
  highlight?: boolean;
  sparklineData?: { v: number }[];
  sparklineColor?: string;
}) {
  const color = sparklineColor || "#FF4D15";
  return (
    <div
      className={`rounded-xl border p-4 card-hover-glow hud-corners ${
        highlight
          ? "bg-red-50/50 border-red-100 dark:bg-red-950/20 dark:border-red-900/30"
          : "bg-white border-gray-100 dark:bg-[#0d0f13] dark:border-zinc-800/60"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">{label.substring(0, 3).toUpperCase()}</span>
        <Icon className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
        <span className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {numericValue != null ? (
              <><AnimatedNumber value={numericValue} />{suffix}</>
            ) : (
              value
            )}
          </p>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">{subtitle}</p>
        </div>
        {sparklineData && sparklineData.length > 0 && (
          <div className="w-20 h-10 opacity-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`spark-${label.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={color}
                  strokeWidth={1.5}
                  fill={`url(#spark-${label.replace(/\s/g, "")})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
