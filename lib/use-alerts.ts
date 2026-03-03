"use client";

import { useState, useEffect, useCallback } from "react";

type AlertOrder = { id: string; orderNumber: string; productName: string };
type AlertFactory = { id: string; name: string };

export type Alert = {
  id: string;
  organizationId: string;
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  orderId: string | null;
  order: AlertOrder | null;
  factoryId: string | null;
  factory: AlertFactory | null;
  read: boolean;
  resolved: boolean;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
};

/** Polls unread alert count every 30s */
export function useUnreadCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts/unread-count");
      if (res.ok) {
        const json = await res.json();
        setCount(json.data.count);
      }
    } catch {
      // Silently fail — badge just stays stale
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    // Listen for cross-component "alerts changed" events
    const onAlertsChanged = () => refresh();
    window.addEventListener("alerts-changed", onAlertsChanged);
    return () => {
      clearInterval(interval);
      window.removeEventListener("alerts-changed", onAlertsChanged);
    };
  }, [refresh]);

  return { count, refresh };
}

/** Notify all useUnreadCount listeners to refresh */
export function notifyAlertsChanged() {
  window.dispatchEvent(new Event("alerts-changed"));
}

/** Fetches recent alerts for the dropdown */
export function useRecentAlerts(limit = 5) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/alerts?limit=${limit}`);
      if (res.ok) {
        const json = await res.json();
        setAlerts(json.data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { alerts, loading, refresh };
}

/** Mark a single alert as read */
export async function markAlertRead(id: string) {
  const res = await fetch(`/api/alerts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ read: true }),
  });
  return res.ok;
}

/** Mark all unread alerts as read */
export async function markAllRead(alertIds: string[]) {
  await Promise.all(alertIds.map((id) => markAlertRead(id)));
}
