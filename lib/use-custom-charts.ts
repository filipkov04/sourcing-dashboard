"use client";

import { useState, useEffect, useCallback } from "react";
import { getDataSource, getMetric } from "@/lib/chart-data-sources";

export type ChartAnnotation = {
  id: string;
  chartId: string;
  content: string;
  color: string;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export type CustomChart = {
  id: string;
  organizationId: string;
  creatorId: string;
  title: string;
  chartType: string;
  dataSource: string;
  metric: string;
  config: Record<string, unknown>;
  visibility: "PERSONAL" | "SHARED";
  sortOrder: number;
  folderId: string | null;
  annotations?: ChartAnnotation[];
  createdAt: string;
  updatedAt: string;
};

export type ChartFolder = {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
  creatorId: string;
  _count: { charts: number };
  createdAt: string;
  updatedAt: string;
};

export type SavedReport = {
  id: string;
  name: string;
  description: string | null;
  schedule: "DAILY" | "WEEKLY" | "MONTHLY";
  recipients: string[];
  enabled: boolean;
  lastSentAt: string | null;
  nextSendAt: string | null;
  charts: Array<{
    id: string;
    sortOrder: number;
    chart: { id: string; title: string; chartType: string };
  }>;
  createdAt: string;
  updatedAt: string;
};

type CreateChartInput = {
  title: string;
  chartType: string;
  dataSource: string;
  metric: string;
  config: Record<string, unknown>;
  visibility: "PERSONAL" | "SHARED";
};

type UpdateChartInput = {
  title?: string;
  config?: Record<string, any>;
  visibility?: "PERSONAL" | "SHARED";
  sortOrder?: number;
  folderId?: string | null;
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
        setCharts((prev) => prev.map((c) => (c.id === id ? { ...c, ...json.data } : c)));
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

  const addAnnotation = useCallback(async (chartId: string, content: string, color?: string): Promise<ChartAnnotation | null> => {
    try {
      const res = await fetch("/api/dashboard/chart-annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, content, color }),
      });
      const json = await res.json();
      if (json.success) {
        setCharts((prev) => prev.map((c) => {
          if (c.id !== chartId) return c;
          return { ...c, annotations: [json.data, ...(c.annotations || [])] };
        }));
        return json.data;
      }
      return null;
    } catch (error) {
      console.error("Failed to add annotation:", error);
      return null;
    }
  }, []);

  const deleteAnnotation = useCallback(async (annotationId: string, chartId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/dashboard/chart-annotations/${annotationId}`, { method: "DELETE" });
      if (res.ok) {
        setCharts((prev) => prev.map((c) => {
          if (c.id !== chartId) return c;
          return { ...c, annotations: (c.annotations || []).filter((a) => a.id !== annotationId) };
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to delete annotation:", error);
      return false;
    }
  }, []);

  return { charts, loading, fetchCharts, createChart, updateChart, deleteChart, addAnnotation, deleteAnnotation };
}

export function useChartFolders() {
  const [folders, setFolders] = useState<ChartFolder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/chart-folders");
      const json = await res.json();
      if (json.success) setFolders(json.data);
    } catch (error) {
      console.error("Failed to fetch chart folders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  const createFolder = useCallback(async (name: string, color?: string): Promise<ChartFolder | null> => {
    try {
      const res = await fetch("/api/dashboard/chart-folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      const json = await res.json();
      if (json.success) {
        setFolders((prev) => [...prev, { ...json.data, _count: { charts: 0 } }]);
        return json.data;
      }
      return null;
    } catch (error) {
      console.error("Failed to create folder:", error);
      return null;
    }
  }, []);

  const updateFolder = useCallback(async (id: string, data: { name?: string; color?: string | null }): Promise<boolean> => {
    try {
      const res = await fetch(`/api/dashboard/chart-folders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, ...json.data } : f)));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to update folder:", error);
      return false;
    }
  }, []);

  const deleteFolder = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/dashboard/chart-folders/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFolders((prev) => prev.filter((f) => f.id !== id));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to delete folder:", error);
      return false;
    }
  }, []);

  return { folders, loading, fetchFolders, createFolder, updateFolder, deleteFolder };
}

export function useSavedReports() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/saved-reports");
      const json = await res.json();
      if (json.success) setReports(json.data);
    } catch (error) {
      console.error("Failed to fetch saved reports:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const createReport = useCallback(async (input: {
    name: string; description?: string; schedule: "DAILY" | "WEEKLY" | "MONTHLY";
    recipients: string[]; chartIds: string[];
  }): Promise<SavedReport | null> => {
    try {
      const res = await fetch("/api/dashboard/saved-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (json.success) {
        setReports((prev) => [json.data, ...prev]);
        return json.data;
      }
      return null;
    } catch (error) {
      console.error("Failed to create report:", error);
      return null;
    }
  }, []);

  const updateReport = useCallback(async (id: string, input: {
    name?: string; description?: string | null; schedule?: "DAILY" | "WEEKLY" | "MONTHLY";
    recipients?: string[]; chartIds?: string[]; enabled?: boolean;
  }): Promise<boolean> => {
    try {
      const res = await fetch(`/api/dashboard/saved-reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (json.success) {
        setReports((prev) => prev.map((r) => (r.id === id ? json.data : r)));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to update report:", error);
      return false;
    }
  }, []);

  const deleteReport = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/dashboard/saved-reports/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to delete report:", error);
      return false;
    }
  }, []);

  return { reports, loading, fetchReports, createReport, updateReport, deleteReport };
}

export function useChartData(dataSourceId: string, metricId: string, config?: Record<string, unknown>) {
  const [data, setData] = useState<unknown>(null);
  const [transformedData, setTransformedData] = useState<{
    chartData: Record<string, unknown>[];
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
    if (config?.period) params.set("period", String(config.period));

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
