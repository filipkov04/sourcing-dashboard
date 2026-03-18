"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plug,
  Globe,
  Server,
  Webhook,
  Hand,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Factory,
  Settings,
  Play,
  Trash2,
  Save,
} from "lucide-react";

type Integration = {
  id: string;
  name: string;
  type: string;
  status: string;
  syncFrequency: number;
  lastSyncAt: string | null;
  lastSyncStatus: string;
  lastSyncError: string | null;
  config: Record<string, unknown> | null;
  credentials: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  factory: { id: string; name: string; location: string };
};

type SyncLog = {
  timestamp: string;
  status: string;
  error: string | null;
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  REST: <Globe className="h-4 w-4" />,
  SFTP: <Server className="h-4 w-4" />,
  WEBHOOK: <Webhook className="h-4 w-4" />,
  MANUAL: <Hand className="h-4 w-4" />,
  CARRIER_TRACKING: <RefreshCw className="h-4 w-4" />,
};

const TYPE_LABEL: Record<string, string> = {
  REST: "REST API",
  SFTP: "SFTP",
  WEBHOOK: "Webhook",
  MANUAL: "Manual",
  CARRIER_TRACKING: "Carrier Tracking",
};

const STATUS_BADGE: Record<string, { class: string; icon: React.ReactNode }> = {
  ACTIVE: {
    class: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  INACTIVE: {
    class: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
    icon: <Clock className="h-3 w-3" />,
  },
  ERROR: {
    class: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    icon: <XCircle className="h-3 w-3" />,
  },
  PENDING: {
    class: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
};

export default function IntegrationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const isAdminOrOwner = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";
  const integrationId = params.id as string;

  const [integration, setIntegration] = useState<Integration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; recordsSynced?: number; error?: string } | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  // Settings form
  const [editName, setEditName] = useState("");
  const [editFrequency, setEditFrequency] = useState(15);
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const fetchIntegration = useCallback(async () => {
    try {
      const res = await fetch(`/api/integrations/${integrationId}`);
      const json = await res.json();
      if (json.success) {
        setIntegration(json.data);
        setEditName(json.data.name);
        setEditFrequency(json.data.syncFrequency);
        setEditStatus(json.data.status);

        // Build sync log from the integration's last sync data
        // In a full implementation this would come from a dedicated SyncLog table
        if (json.data.lastSyncAt) {
          setSyncLogs((prev) => {
            const existing = prev.find((l) => l.timestamp === json.data.lastSyncAt);
            if (existing) return prev;
            return [
              {
                timestamp: json.data.lastSyncAt,
                status: json.data.lastSyncStatus,
                error: json.data.lastSyncError,
              },
              ...prev,
            ].slice(0, 20);
          });
        }
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [integrationId]);

  useEffect(() => {
    fetchIntegration();
  }, [fetchIntegration]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setSyncResult(json.data);
        // Add to sync logs
        setSyncLogs((prev) => [
          {
            timestamp: new Date().toISOString(),
            status: json.data.success ? "SUCCESS" : "FAILED",
            error: json.data.error ?? null,
          },
          ...prev,
        ].slice(0, 20));
        // Refresh integration data
        await fetchIntegration();
      } else {
        setSyncResult({ success: false, error: json.error });
      }
    } catch {
      setSyncResult({ success: false, error: "Network error" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/integrations/${integrationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          syncFrequency: editFrequency,
          status: editStatus,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setSaveMsg("Settings saved");
        setIntegration(json.data);
        setTimeout(() => setSaveMsg(null), 3000);
      } else {
        setSaveMsg(json.error || "Failed to save");
      }
    } catch {
      setSaveMsg("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this integration? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/integrations/${integrationId}`, { method: "DELETE" });
      router.push("/settings/integrations");
    } catch {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!integration) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/settings/integrations")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <p className="text-zinc-400">Integration not found.</p>
      </div>
    );
  }

  const statusBadge = STATUS_BADGE[integration.status] ?? STATUS_BADGE.PENDING;
  const fieldMap = (integration.config as Record<string, unknown>)?.fieldMap as Record<string, string> | undefined;

  return (
    <div className="relative max-w-4xl mx-auto space-y-6">
      {/* HUD Grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-0 dark:opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,77,21,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,21,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push("/settings/integrations")}
          className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Integrations
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            {TYPE_ICON[integration.type] ?? <Plug className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {integration.name}
              </h1>
              <Badge className={`text-[10px] px-1.5 py-0 ${statusBadge.class}`}>
                <span className="flex items-center gap-1">
                  {statusBadge.icon}
                  {integration.status}
                </span>
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
              <Link
                href={`/factories/${integration.factory.id}`}
                className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
              >
                <Factory className="h-3 w-3" />
                {integration.factory.name}
              </Link>
              <span>{TYPE_LABEL[integration.type] ?? integration.type}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ── LEFT: Sync & Logs ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Manual Sync */}
          <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-[#FF4D15]" />
                <h2 className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Manual Sync
                </h2>
              </div>
              {isAdminOrOwner && (
                <Button
                  onClick={handleSync}
                  disabled={isSyncing}
                  size="sm"
                  className="bg-[#FF4D15] hover:bg-[#e0440f] text-white"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      Sync Now
                    </>
                  )}
                </Button>
              )}
            </div>

            {syncResult && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  syncResult.success
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                }`}
              >
                {syncResult.success ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Synced {syncResult.recordsSynced ?? 0} records successfully
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" />
                    {syncResult.error}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-3">
              <Clock className="h-3 w-3" />
              {integration.lastSyncAt
                ? `Last sync: ${formatDate(integration.lastSyncAt)}`
                : "Never synced"}
              <span>·</span>
              <span>Auto-syncs every {integration.syncFrequency} minutes</span>
            </div>
          </div>

          {/* Sync Logs */}
          <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-zinc-500" />
              <h2 className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                Sync History
              </h2>
            </div>

            {syncLogs.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4 text-center">
                No sync history yet. Run a sync to see results here.
              </p>
            ) : (
              <div className="space-y-2">
                {syncLogs.map((log, i) => (
                  <div
                    key={`${log.timestamp}-${i}`}
                    className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full flex-shrink-0 ${
                          log.status === "SUCCESS"
                            ? "bg-green-500"
                            : log.status === "FAILED"
                            ? "bg-red-500"
                            : "bg-blue-500 animate-pulse"
                        }`}
                      />
                      <span className="text-xs text-gray-600 dark:text-zinc-300">
                        {formatDate(log.timestamp)}
                      </span>
                      {log.status === "FAILED" && log.error && (
                        <span className="text-[11px] text-red-400 truncate max-w-[300px]">
                          {log.error}
                        </span>
                      )}
                    </div>
                    <Badge
                      className={`text-[10px] px-1.5 py-0 ${
                        log.status === "SUCCESS"
                          ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                          : log.status === "FAILED"
                          ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                          : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      }`}
                    >
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Field Mapping (read-only view) */}
          {fieldMap && Object.keys(fieldMap).length > 0 && (
            <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Plug className="h-4 w-4 text-zinc-500" />
                <h2 className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Field Mapping
                </h2>
              </div>
              <div className="space-y-1.5">
                {Object.entries(fieldMap).map(([our, their]) => (
                  <div
                    key={our}
                    className="flex items-center justify-between py-1.5 px-3 rounded-md bg-zinc-50 dark:bg-zinc-800/50 text-xs"
                  >
                    <span className="text-gray-600 dark:text-zinc-400">{our}</span>
                    <span className="text-gray-900 dark:text-white font-medium">→ {their}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Settings ── */}
        <div className="space-y-4">
          {/* Settings Card */}
          <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-4 w-4 text-zinc-500" />
              <h2 className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                Settings
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-gray-600 dark:text-zinc-400">Name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={!isAdminOrOwner}
                  className="mt-1 text-sm"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-600 dark:text-zinc-400">
                  Sync Frequency (minutes)
                </Label>
                <Input
                  type="number"
                  min={5}
                  max={1440}
                  value={editFrequency}
                  onChange={(e) => setEditFrequency(parseInt(e.target.value) || 15)}
                  disabled={!isAdminOrOwner}
                  className="mt-1 text-sm w-full"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-600 dark:text-zinc-400">Status</Label>
                <div className="flex gap-2 mt-1">
                  {(["ACTIVE", "INACTIVE"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => isAdminOrOwner && setEditStatus(s)}
                      disabled={!isAdminOrOwner}
                      className={`flex-1 px-3 py-1.5 text-xs rounded-md border transition-colors ${
                        editStatus === s
                          ? s === "ACTIVE"
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                            : "border-zinc-400 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-400"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {isAdminOrOwner && (
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="w-full bg-[#FF4D15] hover:bg-[#e0440f] text-white"
                  size="sm"
                >
                  {isSaving ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Save Settings
                </Button>
              )}

              {saveMsg && (
                <p className={`text-xs text-center ${saveMsg === "Settings saved" ? "text-green-500" : "text-red-500"}`}>
                  {saveMsg}
                </p>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-3">
              Details
            </h3>
            <div className="space-y-2 text-xs">
              <InfoRow label="Type" value={TYPE_LABEL[integration.type] ?? integration.type} />
              <InfoRow label="Factory" value={integration.factory.name} />
              <InfoRow label="Location" value={integration.factory.location} />
              <InfoRow label="Created" value={formatDate(integration.createdAt)} />
              {integration.config && typeof (integration.config as Record<string, unknown>).baseUrl === "string" && (
                <InfoRow label="Base URL" value={(integration.config as Record<string, unknown>).baseUrl as string} />
              )}
              {integration.config && typeof (integration.config as Record<string, unknown>).host === "string" && (
                <InfoRow label="SFTP Host" value={(integration.config as Record<string, unknown>).host as string} />
              )}
            </div>
          </div>

          {/* Danger Zone */}
          {isAdminOrOwner && (
            <div className="bg-white dark:bg-zinc-900/80 border border-red-200/60 dark:border-red-900/30 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3">
                Danger Zone
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
              >
                {isDeleting ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                )}
                Delete Integration
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400 dark:text-zinc-500">{label}</span>
      <span className="text-gray-700 dark:text-zinc-300 text-right truncate max-w-[140px]">{value}</span>
    </div>
  );
}
