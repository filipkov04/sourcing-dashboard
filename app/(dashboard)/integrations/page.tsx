"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/animated-number";
import {
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
  Plus,
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
  createdAt: string;
  factory: { id: string; name: string; location: string };
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

const SYNC_STATUS_DOT: Record<string, string> = {
  SUCCESS: "bg-green-500",
  FAILED: "bg-red-500",
  IN_PROGRESS: "bg-blue-500 animate-pulse",
  NEVER: "bg-zinc-400",
};

export default function IntegrationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdminOrOwner = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch("/api/integrations");
        const json = await res.json();
        if (json.success) setIntegrations(json.data);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    }
    fetch_();
  }, []);

  const activeCount = integrations.filter((i) => i.status === "ACTIVE").length;
  const errorCount = integrations.filter((i) => i.status === "ERROR").length;

  const handleSync = async (integrationId: string) => {
    try {
      await fetch(`/api/integrations/${integrationId}/test`, { method: "POST" });
      // Refresh list
      const res = await fetch("/api/integrations");
      const json = await res.json();
      if (json.success) setIntegrations(json.data);
    } catch {
      // silent
    }
  };

  const handleDelete = async (integrationId: string) => {
    if (!confirm("Delete this integration?")) return;
    try {
      await fetch(`/api/integrations/${integrationId}`, { method: "DELETE" });
      setIntegrations((prev) => prev.filter((i) => i.id !== integrationId));
    } catch {
      // silent
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative space-y-6">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Integrations</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Manage factory data connections and sync status.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total" value={integrations.length} icon={<Plug className="h-4 w-4" />} />
        <StatCard label="Active" value={activeCount} icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} />
        <StatCard label="Errors" value={errorCount} icon={<XCircle className="h-4 w-4 text-red-500" />} />
        <StatCard label="Factories" value={new Set(integrations.map((i) => i.factory.id)).size} icon={<Factory className="h-4 w-4" />} />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : integrations.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl p-12 text-center">
          <Plug className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-zinc-400 mb-1">No integrations yet</p>
          <p className="text-sm text-gray-400 dark:text-zinc-500 mb-4">
            Set up an integration from a factory detail page.
          </p>
          <Link href="/factories">
            <Button className="bg-[#FF4D15] hover:bg-[#e0440f] text-white">
              <Factory className="mr-2 h-4 w-4" />
              Go to Factories
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {integrations.map((integration) => {
            const statusBadge = STATUS_BADGE[integration.status] ?? STATUS_BADGE.PENDING;
            const syncDot = SYNC_STATUS_DOT[integration.lastSyncStatus] ?? SYNC_STATUS_DOT.NEVER;

            return (
              <div
                key={integration.id}
                onClick={() => router.push(`/integrations/${integration.id}`)}
                className="bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl p-4 card-hover-glow transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex-shrink-0">
                      {TYPE_ICON[integration.type] ?? <Plug className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {integration.name}
                        </h3>
                        <Badge className={`text-[10px] px-1.5 py-0 ${statusBadge.class}`}>
                          <span className="flex items-center gap-1">
                            {statusBadge.icon}
                            {integration.status}
                          </span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Factory className="h-3 w-3" />
                          {integration.factory.name}
                        </span>
                        <span>{TYPE_LABEL[integration.type] ?? integration.type}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Every {integration.syncFrequency}m
                        </span>
                      </div>

                      {/* Last sync */}
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-400">
                        <span className={`h-1.5 w-1.5 rounded-full ${syncDot}`} />
                        {integration.lastSyncAt ? (
                          <>
                            Last sync: {formatRelativeTime(integration.lastSyncAt)}
                            {integration.lastSyncStatus === "FAILED" && integration.lastSyncError && (
                              <span className="text-red-400 truncate max-w-[200px]">
                                — {integration.lastSyncError}
                              </span>
                            )}
                          </>
                        ) : (
                          "Never synced"
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  {isAdminOrOwner && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSync(integration.id)}
                        className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
                        title="Test connection"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(integration.id)}
                        className="text-zinc-500 hover:text-red-500"
                        title="Delete"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 mb-1">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-semibold text-gray-900 dark:text-white">
        <AnimatedNumber value={value} />
      </p>
    </div>
  );
}
