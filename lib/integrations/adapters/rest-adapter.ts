import { IntegrationAdapter, SyncContext, SyncResult } from "../types";
import { transformRecords, applyToDb, FieldMap } from "../transformer";
import { Integration, IntegrationType } from "@prisma/client";

type RestConfig = {
  baseUrl: string;
  ordersEndpoint: string;
  authType: "bearer" | "basic" | "api_key" | "none";
  apiKeyHeader?: string;
  fieldMap: FieldMap;
};

type FactoryResponse = Record<string, unknown>;

function buildAuthHeaders(
  authType: RestConfig["authType"],
  credentials: Record<string, unknown> | null,
  apiKeyHeader?: string
): Record<string, string> {
  if (!credentials) return {};
  switch (authType) {
    case "bearer":
      return { Authorization: `Bearer ${credentials.bearerToken}` };
    case "basic": {
      const encoded = Buffer.from(`${credentials.username}:${credentials.password}`).toString("base64");
      return { Authorization: `Basic ${encoded}` };
    }
    case "api_key":
      return { [apiKeyHeader ?? "X-API-Key"]: String(credentials.apiKey) };
    default:
      return {};
  }
}

export class RestAdapter implements IntegrationAdapter {
  type = IntegrationType.REST;

  async testConnection(integration: Integration): Promise<boolean> {
    const config = integration.config as RestConfig | null;
    if (!config?.baseUrl) return false;
    try {
      const res = await fetch(config.baseUrl, { method: "GET", signal: AbortSignal.timeout(5000) });
      return res.status < 500;
    } catch {
      return false;
    }
  }

  async sync(context: SyncContext): Promise<SyncResult> {
    const { integration, organizationId } = context;
    const config = integration.config as RestConfig | null;

    if (!config?.baseUrl || !config?.ordersEndpoint) {
      return { success: false, recordsSynced: 0, error: "Missing baseUrl or ordersEndpoint in config" };
    }

    const url = `${config.baseUrl.replace(/\/$/, "")}${config.ordersEndpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...buildAuthHeaders(config.authType, integration.credentials, config.apiKeyHeader),
    };

    let rawRecords: FactoryResponse[];
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
      if (res.status === 401 || res.status === 403) {
        return { success: false, recordsSynced: 0, error: `Auth failed (${res.status}) — check credentials` };
      }
      if (!res.ok) {
        return { success: false, recordsSynced: 0, error: `Factory API returned ${res.status}` };
      }
      const body = await res.json();
      rawRecords = Array.isArray(body) ? body : (body.data ?? body.orders ?? body.results ?? []);
      if (!Array.isArray(rawRecords)) {
        return { success: false, recordsSynced: 0, error: "Unexpected API response shape — expected an array" };
      }
    } catch (err) {
      return { success: false, recordsSynced: 0, error: err instanceof Error ? err.message : "Network error" };
    }

    const transformed = transformRecords(rawRecords, config.fieldMap);
    const recordsSynced = await applyToDb(transformed, organizationId);
    return { success: true, recordsSynced };
  }
}
