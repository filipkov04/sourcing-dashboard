import { IntegrationAdapter, SyncContext, SyncResult } from "../types";
import { Integration, IntegrationType } from "@prisma/client";

// Webhook integrations are push-based — the factory calls us, we don't call them.
// The actual data processing happens in /api/webhooks/[factoryId]/route.ts.
// This adapter exists so the Integration Manager can register/route webhook types
// and so testConnection() / manual sync has a defined response.

type WebhookConfig = {
  signatureHeader?: string;
  fieldMap?: Record<string, string>;
};

export class WebhookAdapter implements IntegrationAdapter {
  type = IntegrationType.WEBHOOK;

  async testConnection(integration: Integration): Promise<boolean> {
    // Can't ping a webhook — just verify it's configured
    const config = integration.config as WebhookConfig | null;
    return !!(config?.fieldMap && Object.keys(config.fieldMap).length > 0);
  }

  async sync(_context: SyncContext): Promise<SyncResult> {
    // Webhooks are push-based — there's nothing to pull
    return {
      success: true,
      recordsSynced: 0,
      error: "Webhook integrations are push-based. Data is received at /api/webhooks/[factoryId].",
    };
  }
}
