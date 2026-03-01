"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseAutoRefreshOptions {
  /** Interval in milliseconds */
  interval: number;
  /** Whether auto-refresh is enabled */
  enabled?: boolean;
}

/**
 * Visibility-aware polling hook.
 * Pauses when the tab is hidden, resumes when visible.
 * Returns `refresh` callback and `lastUpdated` timestamp.
 */
export function useAutoRefresh(
  fetchFn: () => Promise<void>,
  { interval, enabled = true }: UseAutoRefreshOptions
) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const refresh = useCallback(async () => {
    await fetchRef.current();
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(refresh, interval);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Refresh immediately when tab becomes visible, then resume polling
        refresh();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [interval, enabled, refresh]);

  return { refresh, lastUpdated };
}

/** Format a Date as "X ago" text */
export function formatTimeAgo(date: Date | null): string {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}
