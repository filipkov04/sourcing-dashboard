"use client";

import { CheckCircle2, Globe, Server, Webhook, Hand, Clock } from "lucide-react";
import type { IntegrationType } from "@prisma/client";

const TYPE_INFO: Record<string, { label: string; icon: React.ReactNode }> = {
  REST: { label: "REST API", icon: <Globe className="h-4 w-4" /> },
  SFTP: { label: "SFTP File Transfer", icon: <Server className="h-4 w-4" /> },
  WEBHOOK: { label: "Webhook Receiver", icon: <Webhook className="h-4 w-4" /> },
  MANUAL: { label: "Manual Entry", icon: <Hand className="h-4 w-4" /> },
};

type Props = {
  data: {
    name: string;
    type: IntegrationType | null;
    credentials: Record<string, string>;
    config: Record<string, unknown>;
    syncFrequency: number;
    connectionTested: boolean;
  };
  factoryName: string;
};

export function StepReview({ data, factoryName }: Props) {
  const typeInfo = TYPE_INFO[data.type ?? ""] ?? { label: "Unknown", icon: null };
  const fieldMap = (data.config.fieldMap as Record<string, string>) ?? {};
  const mappedFields = Object.entries(fieldMap).filter(([, v]) => v);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Review Integration
      </h2>
      <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
        Confirm the settings below, then click &quot;Create Integration&quot; to finish.
      </p>

      <div className="space-y-4">
        {/* General */}
        <ReviewSection title="General">
          <ReviewRow label="Name" value={data.name} />
          <ReviewRow label="Factory" value={factoryName} />
          <ReviewRow
            label="Type"
            value={
              <span className="flex items-center gap-1.5">
                {typeInfo.icon}
                {typeInfo.label}
              </span>
            }
          />
          <ReviewRow
            label="Sync Frequency"
            value={
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Every {data.syncFrequency} minutes
              </span>
            }
          />
        </ReviewSection>

        {/* Connection */}
        {data.type !== "MANUAL" && (
          <ReviewSection title="Connection">
            {data.type === "REST" && (
              <>
                <ReviewRow label="Base URL" value={(data.config.baseUrl as string) || "—"} />
                <ReviewRow label="Orders Endpoint" value={(data.config.ordersEndpoint as string) || "—"} />
                <ReviewRow label="Auth" value={(data.config.authType as string) ?? "bearer"} />
              </>
            )}
            {data.type === "SFTP" && (
              <>
                <ReviewRow label="Host" value={`${data.config.host}:${data.config.port ?? 22}`} />
                <ReviewRow label="Path" value={(data.config.remotePath as string) || "—"} />
                <ReviewRow label="File" value={`${data.config.fileName} (${(data.config.fileFormat as string) ?? "csv"})`} />
              </>
            )}
            {data.type === "WEBHOOK" && (
              <ReviewRow label="Secret" value={data.credentials.webhookSecret ? "••••" + data.credentials.webhookSecret.slice(-4) : "—"} />
            )}
            <ReviewRow
              label="Test"
              value={
                data.connectionTested ? (
                  <span className="flex items-center gap-1 text-green-500">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                  </span>
                ) : (
                  <span className="text-amber-500">Not tested</span>
                )
              }
            />
          </ReviewSection>
        )}

        {/* Field Mapping */}
        {data.type !== "MANUAL" && mappedFields.length > 0 && (
          <ReviewSection title="Field Mapping">
            {mappedFields.map(([our, their]) => (
              <ReviewRow key={our} label={our} value={`→ ${their}`} />
            ))}
          </ReviewSection>
        )}
      </div>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-zinc-200/60 dark:border-zinc-800/60 rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <h3 className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5">
      <span className="text-sm text-gray-500 dark:text-zinc-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}
