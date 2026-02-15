"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

type RateEntry = {
  pair: string;
  rate: number;
  dailyChange: number | null;
  sparkline: number[];
  updatedAt: string;
};

type ExchangeRateData = {
  rates: RateEntry[];
  lastFetched: string;
};

function formatRate(pair: string, rate: number): string {
  if (pair.includes("VND")) {
    return rate.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return rate.toFixed(4);
}

function Sparkline({ data, isUp }: { data: number[]; isUp: boolean }) {
  const chartData = data.map((v) => ({ v }));
  const color = isUp ? "#22c55e" : "#ef4444";
  const fillColor = isUp ? "#22c55e" : "#ef4444";

  return (
    <div className="w-16 h-6">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 1, right: 0, bottom: 1, left: 0 }}>
          <defs>
            <linearGradient id={`grad-${isUp ? "up" : "down"}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={fillColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#grad-${isUp ? "up" : "down"})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function RateRow({ entry }: { entry: RateEntry }) {
  const change = entry.dailyChange;
  const isPositive = change !== null && change > 0;
  const isNegative = change !== null && change < 0;
  const isUp = change !== null ? change >= 0 : true;

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs font-medium text-gray-500 dark:text-zinc-400 w-16">
        {entry.pair}
      </span>

      <Sparkline data={entry.sparkline} isUp={isUp} />

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-900 dark:text-white tabular-nums">
          {formatRate(entry.pair, entry.rate)}
        </span>
        <div className="flex items-center gap-0.5 w-14 justify-end">
          {change !== null ? (
            <>
              {isPositive && <TrendingUp className="h-2.5 w-2.5 text-green-500" />}
              {isNegative && <TrendingDown className="h-2.5 w-2.5 text-red-500" />}
              {!isPositive && !isNegative && <Minus className="h-2.5 w-2.5 text-gray-400" />}
              <span
                className={`text-[10px] font-medium tabular-nums ${
                  isPositive
                    ? "text-green-600 dark:text-green-400"
                    : isNegative
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-500 dark:text-zinc-400"
                }`}
              >
                {isPositive ? "+" : ""}
                {change.toFixed(2)}%
              </span>
            </>
          ) : (
            <span className="text-[10px] text-gray-400 dark:text-zinc-500">—</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ExchangeRateCards() {
  const [data, setData] = useState<ExchangeRateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch("/api/dashboard/exchange-rates");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          setError(null);
        } else {
          setError(json.error || "Failed to load exchange rates");
        }
      } catch {
        setError("Failed to load exchange rates");
      } finally {
        setIsLoading(false);
      }
    }
    fetchRates();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-4 py-3 shadow-sm animate-pulse h-fit">
        <div className="h-3.5 w-24 rounded bg-gray-200 dark:bg-zinc-700 mb-2.5" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-3 w-14 rounded bg-gray-200 dark:bg-zinc-700" />
              <div className="h-5 w-16 rounded bg-gray-200 dark:bg-zinc-700" />
              <div className="h-3 w-20 rounded bg-gray-200 dark:bg-zinc-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-4 py-3 shadow-sm h-fit">
        <div className="flex items-center gap-1.5 text-red-500">
          <RefreshCw className="h-3 w-3" />
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-4 py-3 shadow-sm h-fit card-hover-glow">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-xs font-semibold text-gray-800 dark:text-zinc-200">
          Exchange Rates
        </h3>
        <span className="text-[10px] text-gray-400 dark:text-zinc-500">Live</span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
        {data.rates.map((entry) => (
          <RateRow key={entry.pair} entry={entry} />
        ))}
      </div>
    </div>
  );
}
