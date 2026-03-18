"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  CheckCheck,
  RefreshCw,
} from "lucide-react";
import { type Alert, notifyAlertsChanged } from "@/lib/use-alerts";

type SeverityFilter = "ALL" | "CRITICAL" | "ERROR" | "WARNING" | "INFO";
type StatusFilter = "ALL" | "UNREAD" | "READ" | "RESOLVED";

function severityEmoji(severity: Alert["severity"]) {
  switch (severity) {
    case "CRITICAL": return "\u{1F6D1}";
    case "ERROR": return "\u{1F534}";
    case "WARNING": return "\u{1F514}";
    case "INFO":
    default: return "\u2705";
  }
}

function formatTimestamp(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (isToday) return `Today at ${time}`;
  if (isYesterday) return `Yesterday at ${time}`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ` at ${time}`;
}

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const prevAlertCountRef = useRef<number | null>(null);

  const playAlertSound = useCallback(() => {
    if (localStorage.getItem("alertSoundEnabled") !== "true") return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // AudioContext may not be available
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts?limit=100");
      if (res.ok) {
        const json = await res.json();
        const newAlerts: Alert[] = json.data;
        const newUnread = newAlerts.filter((a) => !a.read).length;

        // Play sound if new unread alerts appeared (not on initial load)
        if (prevAlertCountRef.current !== null && newUnread > prevAlertCountRef.current) {
          playAlertSound();
        }
        prevAlertCountRef.current = newUnread;

        setAlerts(newAlerts);
      }
    } catch {
      console.error("Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  }, [playAlertSound]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/alerts/generate", { method: "POST" });
      if (res.ok) {
        await fetchAlerts();
      }
    } catch {
      console.error("Failed to generate alerts");
    } finally {
      setGenerating(false);
    }
  }

  async function handleMarkRead(id: string) {
    await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
    notifyAlertsChanged();
  }

  async function handleResolve(id: string) {
    await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved: true, read: true }),
    });
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, resolved: true, read: true, resolvedAt: new Date().toISOString() } : a
      )
    );
    notifyAlertsChanged();
  }

  async function handleMarkAllRead() {
    const unread = filteredAlerts.filter((a) => !a.read);
    if (unread.length === 0) return;
    const ids = unread.map((a) => a.id);
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, read: true }),
    });
    setAlerts((prev) =>
      prev.map((a) => (ids.includes(a.id) ? { ...a, read: true } : a))
    );
    notifyAlertsChanged();
  }

  // Apply filters — "ALL" hides resolved by default so they don't clutter the feed
  const filteredAlerts = useMemo(() => alerts.filter((alert) => {
    if (severityFilter !== "ALL" && alert.severity !== severityFilter) return false;
    if (statusFilter === "ALL" && alert.resolved) return false;
    if (statusFilter === "UNREAD" && alert.read) return false;
    if (statusFilter === "READ" && (!alert.read || alert.resolved)) return false;
    if (statusFilter === "RESOLVED" && !alert.resolved) return false;
    return true;
  }), [alerts, severityFilter, statusFilter]);

  const unreadCount = useMemo(() => alerts.filter((a) => !a.read).length, [alerts]);
  const resolvedCount = useMemo(() => alerts.filter((a) => a.resolved).length, [alerts]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 text-sm">
                {unreadCount} unread
              </Badge>
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            Monitor delays, disruptions, and order issues
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllRead}
              className="border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Scanning..." : "Scan for alerts"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as SeverityFilter)}>
          <SelectTrigger className="w-[140px] bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All severities</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="ERROR">Error</SelectItem>
            <SelectItem value="WARNING">Warning</SelectItem>
            <SelectItem value="INFO">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[130px] bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="UNREAD">Unread</SelectItem>
            <SelectItem value="READ">Read</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-400 dark:text-zinc-500">
          {filteredAlerts.length} notification{filteredAlerts.length !== 1 ? "s" : ""}
          {statusFilter === "ALL" && resolvedCount > 0 && (
            <span className="ml-1">
              ({resolvedCount} resolved hidden)
            </span>
          )}
        </span>
      </div>

      {/* Alert List */}
      {filteredAlerts.length === 0 ? (
        <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] flex flex-col items-center justify-center py-16 text-center">
          <Bell className="h-12 w-12 text-gray-200 dark:text-zinc-700 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-zinc-400">No notifications</h3>
          <p className="text-sm text-gray-400 dark:text-zinc-500 mt-1">
            {alerts.length > 0
              ? "No alerts match the current filters"
              : "Click \"Scan for alerts\" to check for issues"}
          </p>
        </div>
      ) : (
        <>
        <p className="hud-section-label font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
          Alert Feed
        </p>
        <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] divide-y divide-gray-50 dark:divide-zinc-800/50 overflow-hidden card-hover-glow hud-corners">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`relative flex gap-4 px-5 py-5 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/30 ${
                alert.resolved ? "opacity-50" : ""
              }`}
            >
              {/* Unread dot */}
              {!alert.read && (
                <span className="absolute left-1.5 top-6 h-2 w-2 rounded-full bg-gradient-to-b from-[#FFB21A] via-[#FF4D15] to-[#FF4D15]" />
              )}

              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 dark:bg-zinc-700">
                <span className="text-xs font-bold text-white">ST</span>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 space-y-2">
                <p className={`text-sm leading-tight ${alert.read ? "text-gray-500 dark:text-zinc-400" : "font-semibold text-gray-900 dark:text-white"}`}>
                  {severityEmoji(alert.severity)} {alert.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                  {alert.message}
                </p>

                {/* Actions row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {alert.orderId && (
                    <button
                      onClick={() => router.push(`/orders/${alert.orderId}`)}
                      className="inline-block rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                      View Order
                    </button>
                  )}
                  {alert.factoryId && !alert.orderId && (
                    <button
                      onClick={() => router.push(`/factories/${alert.factoryId}`)}
                      className="inline-block rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                      View Factory
                    </button>
                  )}
                  {!alert.resolved && !alert.read && (
                    <button
                      onClick={() => handleMarkRead(alert.id)}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                    >
                      Mark read
                    </button>
                  )}
                  {!alert.resolved && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="text-xs text-gray-400 hover:text-green-600 dark:text-zinc-500 dark:hover:text-green-400"
                    >
                      Set as resolved
                    </button>
                  )}
                  {alert.resolved && (
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-xs">
                      Resolved
                    </Badge>
                  )}
                </div>

                {/* Timestamp + source */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 dark:text-zinc-500">
                    {formatTimestamp(alert.createdAt)}
                  </span>
                  {alert.factory && (
                    <span className="text-xs text-gray-400 dark:text-zinc-500 italic">
                      {alert.factory.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
