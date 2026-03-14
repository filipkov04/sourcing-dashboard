"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IntegrationType } from "@prisma/client";

type Props = {
  type: IntegrationType;
  credentials: Record<string, string>;
  config: Record<string, unknown>;
  name: string;
  syncFrequency: number;
  onChange: (
    credentials: Record<string, string>,
    config: Record<string, unknown>,
    name?: string,
    syncFrequency?: number
  ) => void;
};

export function StepCredentials({ type, credentials, config, name, syncFrequency, onChange }: Props) {
  const [authType, setAuthType] = useState<string>(
    (config.authType as string) ?? "bearer"
  );

  const setCred = (key: string, value: string) => {
    onChange({ ...credentials, [key]: value }, config);
  };

  const setConf = (key: string, value: unknown) => {
    onChange(credentials, { ...config, [key]: value });
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Connection Details
      </h2>
      <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
        Enter the credentials for this {type} integration.
      </p>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <Label className="text-gray-700 dark:text-zinc-300">Integration Name</Label>
          <Input
            value={name}
            onChange={(e) => onChange(credentials, config, e.target.value)}
            placeholder="e.g. Factory ERP Sync"
            className="mt-1"
          />
        </div>

        {/* Sync Frequency */}
        <div>
          <Label className="text-gray-700 dark:text-zinc-300">Sync Frequency (minutes)</Label>
          <Input
            type="number"
            min={5}
            max={1440}
            value={syncFrequency}
            onChange={(e) => onChange(credentials, config, undefined, parseInt(e.target.value) || 15)}
            className="mt-1 w-32"
          />
        </div>

        {type === "REST" && (
          <>
            <div>
              <Label className="text-gray-700 dark:text-zinc-300">Base URL</Label>
              <Input
                value={(config.baseUrl as string) ?? ""}
                onChange={(e) => setConf("baseUrl", e.target.value)}
                placeholder="https://erp.factory.com/api"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-700 dark:text-zinc-300">Orders Endpoint</Label>
              <Input
                value={(config.ordersEndpoint as string) ?? ""}
                onChange={(e) => setConf("ordersEndpoint", e.target.value)}
                placeholder="/orders"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-700 dark:text-zinc-300">Auth Type</Label>
              <div className="flex gap-2 mt-1">
                {(["bearer", "basic", "api_key", "none"] as const).map((at) => (
                  <button
                    key={at}
                    onClick={() => {
                      setAuthType(at);
                      setConf("authType", at);
                    }}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                      authType === at
                        ? "border-[#FF4D15] bg-orange-50 dark:bg-orange-950/20 text-[#FF4D15]"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {at === "api_key" ? "API Key" : at === "none" ? "None" : at.charAt(0).toUpperCase() + at.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {authType === "bearer" && (
              <div>
                <Label className="text-gray-700 dark:text-zinc-300">Bearer Token</Label>
                <Input
                  type="password"
                  value={credentials.bearerToken ?? ""}
                  onChange={(e) => setCred("bearerToken", e.target.value)}
                  placeholder="Enter token"
                  className="mt-1"
                />
              </div>
            )}
            {authType === "basic" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-700 dark:text-zinc-300">Username</Label>
                  <Input
                    value={credentials.username ?? ""}
                    onChange={(e) => setCred("username", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-zinc-300">Password</Label>
                  <Input
                    type="password"
                    value={credentials.password ?? ""}
                    onChange={(e) => setCred("password", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
            {authType === "api_key" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-700 dark:text-zinc-300">API Key</Label>
                  <Input
                    type="password"
                    value={credentials.apiKey ?? ""}
                    onChange={(e) => setCred("apiKey", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-zinc-300">Header Name</Label>
                  <Input
                    value={(config.apiKeyHeader as string) ?? "X-API-Key"}
                    onChange={(e) => setConf("apiKeyHeader", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {type === "SFTP" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-700 dark:text-zinc-300">Host</Label>
                <Input
                  value={(config.host as string) ?? ""}
                  onChange={(e) => setConf("host", e.target.value)}
                  placeholder="sftp.factory.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-700 dark:text-zinc-300">Port</Label>
                <Input
                  type="number"
                  value={(config.port as number) ?? 22}
                  onChange={(e) => setConf("port", parseInt(e.target.value) || 22)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-700 dark:text-zinc-300">Username</Label>
                <Input
                  value={credentials.username ?? ""}
                  onChange={(e) => setCred("username", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-700 dark:text-zinc-300">Password</Label>
                <Input
                  type="password"
                  value={credentials.password ?? ""}
                  onChange={(e) => setCred("password", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-gray-700 dark:text-zinc-300">Remote Path</Label>
              <Input
                value={(config.remotePath as string) ?? ""}
                onChange={(e) => setConf("remotePath", e.target.value)}
                placeholder="/exports/orders/"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-700 dark:text-zinc-300">File Name</Label>
                <Input
                  value={(config.fileName as string) ?? ""}
                  onChange={(e) => setConf("fileName", e.target.value)}
                  placeholder="orders.csv"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-700 dark:text-zinc-300">File Format</Label>
                <div className="flex gap-2 mt-1">
                  {(["csv", "json"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setConf("fileFormat", fmt)}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                        (config.fileFormat ?? "csv") === fmt
                          ? "border-[#FF4D15] bg-orange-50 dark:bg-orange-950/20 text-[#FF4D15]"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {type === "WEBHOOK" && (
          <>
            <div>
              <Label className="text-gray-700 dark:text-zinc-300">Webhook Secret</Label>
              <Input
                type="password"
                value={credentials.webhookSecret ?? ""}
                onChange={(e) => setCred("webhookSecret", e.target.value)}
                placeholder="HMAC signing secret"
                className="mt-1"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Used to verify HMAC-SHA256 signatures on incoming payloads.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-medium text-gray-700 dark:text-zinc-300">Webhook URL:</span>{" "}
                <code className="text-[11px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  {typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/{"{factoryId}"}
                </code>
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Share this URL with the factory. They send POST requests with order data.
              </p>
            </div>
          </>
        )}

        {type === "MANUAL" && (
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
            <p className="text-sm text-gray-600 dark:text-zinc-300">
              Manual integration requires no credentials. Orders are entered directly through the dashboard or uploaded via CSV.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
