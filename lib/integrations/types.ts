import { Integration, IntegrationType } from "@prisma/client";

// What every adapter must return after a sync
export type SyncResult = {
  success: boolean;
  recordsSynced: number;
  error?: string;
};

// What every adapter receives to run a sync (credentials already decrypted)
export type SyncContext = {
  integration: Omit<Integration, "credentials"> & {
    credentials: Record<string, unknown> | null;
  };
  factoryId: string;
  organizationId: string;
};

// Interface every adapter must implement
export interface IntegrationAdapter {
  type: IntegrationType;
  sync(context: SyncContext): Promise<SyncResult>;
  testConnection(integration: Integration): Promise<boolean>;
}
