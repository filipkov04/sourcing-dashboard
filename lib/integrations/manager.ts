import { prisma } from "@/lib/db";
import { integrationQueue } from "@/lib/queues/integration-queue";
import { IntegrationAdapter, SyncContext, SyncResult } from "./types";
import { encryptCredentials, getCredentials } from "./encryption";
import { IntegrationType, SyncStatus } from "@prisma/client";

class IntegrationManager {
  private adapters = new Map<IntegrationType, IntegrationAdapter>();

  // Register an adapter for a given integration type
  registerAdapter(adapter: IntegrationAdapter) {
    this.adapters.set(adapter.type, adapter);
  }

  // Enqueue a sync job — called from API routes
  async enqueueSync(integrationId: string) {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    if (integration.status === "INACTIVE") {
      throw new Error(`Integration ${integrationId} is inactive`);
    }

    const job = await integrationQueue.add("sync" as never, {
      integrationId: integration.id,
      factoryId: integration.factoryId,
      organizationId: integration.organizationId,
      type: integration.type,
    });

    return job;
  }

  // Run a sync — called by the worker
  async runSync(integrationId: string): Promise<SyncResult> {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    // Mark as in-progress
    await prisma.integration.update({
      where: { id: integrationId },
      data: { lastSyncStatus: SyncStatus.IN_PROGRESS },
    });

    // Decrypt credentials before passing to adapter
    const decryptedCredentials = getCredentials(integration.credentials as string | null);
    const context: SyncContext = {
      integration: { ...integration, credentials: decryptedCredentials },
      factoryId: integration.factoryId,
      organizationId: integration.organizationId,
    };

    let result: SyncResult;

    try {
      const adapter = this.adapters.get(integration.type);

      if (!adapter) {
        throw new Error(`No adapter registered for type: ${integration.type}`);
      }

      result = await adapter.sync(context);
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      result = { success: false, recordsSynced: 0, error };
    }

    // Persist sync result
    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: result.success ? SyncStatus.SUCCESS : SyncStatus.FAILED,
        lastSyncError: result.error ?? null,
        status: result.success ? "ACTIVE" : "ERROR",
      },
    });

    return result;
  }

  // Test a connection without running a full sync
  async testConnection(integrationId: string): Promise<boolean> {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    const adapter = this.adapters.get(integration.type);

    if (!adapter) {
      throw new Error(`No adapter registered for type: ${integration.type}`);
    }

    return adapter.testConnection(integration);
  }

  // Encrypt and store credentials for an integration
  async saveCredentials(integrationId: string, credentials: Record<string, unknown>) {
    const encrypted = encryptCredentials(credentials);
    return prisma.integration.update({
      where: { id: integrationId },
      data: { credentials: encrypted },
    });
  }

  // Get all active integrations for an org (used by the scheduler in task 7.11)
  async getActiveIntegrations(organizationId: string) {
    return prisma.integration.findMany({
      where: { organizationId, status: "ACTIVE" },
      include: { factory: { select: { name: true } } },
    });
  }
}

// Singleton
export const integrationManager = new IntegrationManager();
