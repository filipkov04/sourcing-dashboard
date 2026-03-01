"use client";

import { useEffect, useState } from "react";
import { BarChart3, Clock, Layers, Target } from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadTimeChart } from "./_components/lead-time-chart";
import { StageDurationChart } from "./_components/stage-duration-chart";
import { FactoryComparisonTable } from "./_components/factory-comparison-table";
import { ForecastTimeline } from "./_components/forecast-timeline";
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

export default function AnalyticsPage() {
  const [leadTime, setLeadTime] = useState<LeadTimeData | null>(null);
  const [stageDuration, setStageDuration] = useState<StageDurationData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [ltRes, sdRes, fcRes] = await Promise.all([
          fetch("/api/dashboard/lead-time"),
          fetch("/api/dashboard/stage-duration"),
          fetch("/api/dashboard/forecasting"),
        ]);

        const [ltData, sdData, fcData] = await Promise.all([
          ltRes.json(),
          sdRes.json(),
          fcRes.json(),
        ]);

        if (ltData.success) setLeadTime(ltData.data);
        if (sdData.success) setStageDuration(sdData.data);
        if (fcData.success) setForecast(fcData.data);
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
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Analytics</h1>
        <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
          Deep insights into production performance
        </p>
      </div>

      {/* Summary Cards */}
      <ScrollReveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger>
        <SummaryCard
          icon={Clock}
          label="Avg Lead Time"
          value={leadTime ? `${leadTime.overall.avgLeadTime}d` : "—"}
          numericValue={leadTime?.overall.avgLeadTime}
          suffix="d"
          subtitle={leadTime ? `${leadTime.overall.totalOrders} completed orders` : "No data"}
        />
        <SummaryCard
          icon={Layers}
          label="Bottleneck Stage"
          value={stageDuration?.bottleneck || "—"}
          subtitle={stageDuration?.overall?.[0] ? `Avg ${stageDuration.overall[0].avgDuration}d` : "No data"}
        />
        <SummaryCard
          icon={Target}
          label="On Track"
          value={forecast ? `${forecast.summary.onTrack}/${forecast.summary.total}` : "—"}
          subtitle="Active orders on schedule"
          highlight={forecast ? forecast.summary.critical > 0 : false}
        />
        <SummaryCard
          icon={BarChart3}
          label="At Risk"
          value={forecast ? `${forecast.summary.atRisk + forecast.summary.critical}` : "—"}
          numericValue={forecast ? forecast.summary.atRisk + forecast.summary.critical : undefined}
          subtitle="Orders may miss deadline"
          highlight={forecast ? forecast.summary.critical > 0 : false}
        />
      </ScrollReveal>

      {/* Lead Time Analysis */}
      <ScrollReveal>
        <Card className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 card-hover-glow">
          <CardContent className="pt-6">
            {leadTime && (
              <LeadTimeChart data={leadTime.byFactory} overallAvg={leadTime.overall.avgLeadTime} />
            )}
          </CardContent>
        </Card>
      </ScrollReveal>

      {/* Stage Duration */}
      <ScrollReveal>
        <Card className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 card-hover-glow">
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
        <Card className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 card-hover-glow">
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
        <Card className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 card-hover-glow">
          <CardContent className="pt-6">
            {forecast && (
              <ForecastTimeline forecasts={forecast.forecasts} summary={forecast.summary} />
            )}
          </CardContent>
        </Card>
      </ScrollReveal>
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
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  numericValue?: number;
  suffix?: string;
  subtitle: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 card-hover-glow ${
        highlight
          ? "bg-red-50/50 border-red-100 dark:bg-red-950/20 dark:border-red-900/30"
          : "bg-white border-gray-100 dark:bg-zinc-900 dark:border-zinc-800"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
        <span className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {numericValue != null ? (
          <><AnimatedNumber value={numericValue} />{suffix}</>
        ) : (
          value
        )}
      </p>
      <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">{subtitle}</p>
    </div>
  );
}
