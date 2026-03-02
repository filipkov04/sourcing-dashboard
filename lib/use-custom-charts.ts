"use client";

import { useState, useEffect, useCallback } from "react";
import { getDataSource, getMetric } from "@/lib/chart-data-sources";

export type CustomChart = {
  id: string;
  organizationId: string;
  creatorId: string;
  title: string;
  chartType: string;
  dataSource: string;
  metric: string;
  config: Record<string, any>;
  visibility: "PERSONAL" | "SHARED";
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type CreateChartInput = {
  title: string;
  chartType: string;
  dataSource: string;
  metric: string;
  config: Record<string, any>;
  visibility: "PERSONAL" | "SHARED";
};

type UpdateChartInput = {
  title?: string;
  config?: Record<string, any>;
  visibility?: "PERSONAL" | "SHARED";
  sortOrder?: number;
};

export function useCustomCharts() {
  const [charts, setCharts] = useState<CustomChart[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCharts = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/custom-charts");
      const json = await res.json();
      if (json.success) {
        setCharts(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch custom charts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCharts();
  }, [fetchCharts]);

  const createChart = useCallback(async (input: CreateChartInput): Promise<CustomChart | null> => {
    try {
      const res = await fetch("/api/dashboard/custom-charts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (json.success) {
        setCharts((prev) => [json.data, ...prev]);
        return json.data;
      }
      return null;
    } catch (error) {
      console.error("Failed to create chart:", error);
      return null;
    }
  }, []);

  const updateChart = useCallback(async (id: string, input: UpdateChartInput): Promise<CustomChart | null> => {
    try {
      const res = await fetch(`/api/dashboard/custom-charts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (json.success) {
        setCharts((prev) => prev.map((c) => (c.id === id ? json.data : c)));
        return json.data;
      }
      return null;
    } catch (error) {
      console.error("Failed to update chart:", error);
      return null;
    }
  }, []);

  const deleteChart = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/dashboard/custom-charts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCharts((prev) => prev.filter((c) => c.id !== id));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to delete chart:", error);
      return false;
    }
  }, []);

  return { charts, loading, fetchCharts, createChart, updateChart, deleteChart };
}

export function useChartData(dataSourceId: string, metricId: string, config?: Record<string, any>) {
  const [data, setData] = useState<any>(null);
  const [transformedData, setTransformedData] = useState<{
    chartData: any[];
    dataKeys: string[];
    nameKey: string;
    colors?: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dataSourceId || !metricId) return;

    const ds = getDataSource(dataSourceId);
    if (!ds) return;

    setLoading(true);

    const params = new URLSearchParams();
    if (config?.period) params.set("period", config.period);

    const url = params.toString() ? `${ds.endpoint}?${params}` : ds.endpoint;

    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
          const metric = getMetric(dataSourceId, metricId);
          if (metric) {
            const result = metric.transform(json.data);
            setTransformedData(result);
          }
        }
      })
      .catch((err) => console.error("Failed to fetch chart data:", err))
      .finally(() => setLoading(false));
  }, [dataSourceId, metricId, config?.period]);

  return { data, transformedData, loading };
}
