import { prisma } from "@/lib/db";
import { IntegrationAdapter, SyncContext, SyncResult } from "../types";
import { Integration, IntegrationType, OrderStatus, StageStatus } from "@prisma/client";

// Shape of config stored in integration.config
type RestConfig = {
  baseUrl: string;
  ordersEndpoint: string;       // e.g. "/api/production-orders"
  authType: "bearer" | "basic" | "api_key" | "none";
  apiKeyHeader?: string;        // header name for api_key auth, e.g. "X-API-Key"
  fieldMap: {
    orderNumber: string;        // factory field → our orderNumber
    status?: string;            // factory field → our status
    progress?: string;          // factory field → our overallProgress
    stages?: string;            // factory field → array of stage objects
    stageNameField?: string;    // within each stage object
    stageProgressField?: string;
    stageStatusField?: string;
  };
};

// Loose shape of what a factory API returns per order
type FactoryOrder = Record<string, unknown>;

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
      const encoded = Buffer.from(
        `${credentials.username}:${credentials.password}`
      ).toString("base64");
      return { Authorization: `Basic ${encoded}` };
    }
    case "api_key":
      return { [apiKeyHeader ?? "X-API-Key"]: String(credentials.apiKey) };
    default:
      return {};
  }
}

// Map a factory status string to our OrderStatus enum
function mapOrderStatus(factoryStatus: unknown): OrderStatus | null {
  if (typeof factoryStatus !== "string") return null;

  const s = factoryStatus.toLowerCase().replace(/[\s_-]/g, "");
  if (["pending", "new", "placed", "notstarted"].includes(s)) return OrderStatus.PENDING;
  if (["inprogress", "production", "active", "manufacturing"].includes(s)) return OrderStatus.IN_PROGRESS;
  if (["delayed", "late", "behind"].includes(s)) return OrderStatus.DELAYED;
  if (["disrupted", "blocked", "stopped", "onhold"].includes(s)) return OrderStatus.DISRUPTED;
  if (["completed", "done", "finished", "complete"].includes(s)) return OrderStatus.COMPLETED;
  if (["shipped", "dispatched", "intransit"].includes(s)) return OrderStatus.SHIPPED;
  if (["delivered", "received"].includes(s)) return OrderStatus.DELIVERED;
  if (["cancelled", "canceled", "void"].includes(s)) return OrderStatus.CANCELLED;
  return null;
}

// Map a factory stage status to our StageStatus enum
function mapStageStatus(factoryStatus: unknown): StageStatus | null {
  if (typeof factoryStatus !== "string") return null;

  const s = factoryStatus.toLowerCase().replace(/[\s_-]/g, "");
  if (["notstarted", "pending", "new"].includes(s)) return StageStatus.NOT_STARTED;
  if (["inprogress", "active", "started"].includes(s)) return StageStatus.IN_PROGRESS;
  if (["completed", "done", "finished"].includes(s)) return StageStatus.COMPLETED;
  if (["skipped", "skip", "bypassed"].includes(s)) return StageStatus.SKIPPED;
  if (["delayed", "late", "behind"].includes(s)) return StageStatus.DELAYED;
  if (["blocked", "stopped", "disrupted"].includes(s)) return StageStatus.BLOCKED;
  return null;
}

export class RestAdapter implements IntegrationAdapter {
  type = IntegrationType.REST;

  async testConnection(integration: Integration): Promise<boolean> {
    const config = integration.config as RestConfig | null;
    if (!config?.baseUrl) return false;

    try {
      const res = await fetch(config.baseUrl, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
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

    // Build request
    const url = `${config.baseUrl.replace(/\/$/, "")}${config.ordersEndpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...buildAuthHeaders(config.authType, integration.credentials, config.apiKeyHeader),
    };

    // Fetch from factory API
    let factoryOrders: FactoryOrder[];
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(30000),
      });

      if (res.status === 401 || res.status === 403) {
        return { success: false, recordsSynced: 0, error: `Auth failed (${res.status}) — check credentials` };
      }
      if (!res.ok) {
        return { success: false, recordsSynced: 0, error: `Factory API returned ${res.status}` };
      }

      const body = await res.json();
      // Support both array responses and { data: [...] } wrappers
      factoryOrders = Array.isArray(body) ? body : (body.data ?? body.orders ?? body.results ?? []);

      if (!Array.isArray(factoryOrders)) {
        return { success: false, recordsSynced: 0, error: "Unexpected API response shape — expected an array" };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      return { success: false, recordsSynced: 0, error: msg };
    }

    // Sync each order
    const { fieldMap } = config;
    let recordsSynced = 0;

    for (const factoryOrder of factoryOrders) {
      const orderNumber = String(factoryOrder[fieldMap.orderNumber] ?? "");
      if (!orderNumber) continue;

      // Find matching order in our DB
      const order = await prisma.order.findUnique({
        where: { organizationId_orderNumber: { organizationId, orderNumber } },
        include: { stages: { orderBy: { sequence: "asc" } } },
      });

      if (!order) continue; // We don't auto-create orders from factory data

      const updates: Record<string, unknown> = {};

      // Map status
      if (fieldMap.status) {
        const mapped = mapOrderStatus(factoryOrder[fieldMap.status]);
        // Only overwrite if not a manually-set terminal status
        if (mapped && !["SHIPPED", "DELIVERED", "CANCELLED"].includes(order.status)) {
          updates.status = mapped;
        }
      }

      // Map progress
      if (fieldMap.progress) {
        const p = Number(factoryOrder[fieldMap.progress]);
        if (!isNaN(p) && p >= 0 && p <= 100) {
          updates.overallProgress = Math.round(p);
        }
      }

      if (Object.keys(updates).length > 0) {
        await prisma.order.update({ where: { id: order.id }, data: updates });
      }

      // Map stages if present
      if (fieldMap.stages && Array.isArray(factoryOrder[fieldMap.stages])) {
        const factoryStages = factoryOrder[fieldMap.stages] as FactoryOrder[];

        for (let i = 0; i < factoryStages.length; i++) {
          const fs = factoryStages[i];
          const stage = order.stages[i];
          if (!stage) continue;

          const stageUpdates: Record<string, unknown> = {};

          if (fieldMap.stageProgressField) {
            const p = Number(fs[fieldMap.stageProgressField]);
            if (!isNaN(p)) stageUpdates.progress = Math.round(Math.min(100, Math.max(0, p)));
          }

          if (fieldMap.stageStatusField) {
            const mapped = mapStageStatus(fs[fieldMap.stageStatusField]);
            if (mapped) stageUpdates.status = mapped;
          }

          if (Object.keys(stageUpdates).length > 0) {
            await prisma.orderStage.update({ where: { id: stage.id }, data: stageUpdates });
          }
        }
      }

      recordsSynced++;
    }

    return { success: true, recordsSynced };
  }
}
