import { IntegrationAdapter, SyncContext, SyncResult } from "../types";
import { parseCsv } from "../csv-parser";
import { transformRecords, applyToDb, FieldMap, FactoryRecord } from "../transformer";
import { Integration, IntegrationType } from "@prisma/client";

type SftpConfig = {
  host: string;
  port?: number;
  remotePath: string;
  fileName: string;
  fileFormat: "csv" | "json";
  fieldMap: FieldMap;
};

async function createSftpClient() {
  const SftpClient = (await import("ssh2-sftp-client")).default;
  return new SftpClient();
}

function buildConnectOptions(
  config: SftpConfig,
  credentials: Record<string, unknown> | null
) {
  return {
    host: config.host,
    port: config.port ?? 22,
    username: String(credentials?.username ?? ""),
    ...(credentials?.privateKey
      ? { privateKey: String(credentials.privateKey) }
      : { password: String(credentials?.password ?? "") }),
  };
}

export class SftpAdapter implements IntegrationAdapter {
  type = IntegrationType.SFTP;

  async testConnection(integration: Integration): Promise<boolean> {
    const config = integration.config as SftpConfig | null;
    if (!config?.host) return false;
    const { getCredentials } = await import("../encryption");
    const credentials = getCredentials(integration.credentials as string | null);
    const sftp = await createSftpClient();
    try {
      await sftp.connect(buildConnectOptions(config, credentials));
      await sftp.end();
      return true;
    } catch {
      return false;
    }
  }

  async sync(context: SyncContext): Promise<SyncResult> {
    const { integration, organizationId } = context;
    const config = integration.config as SftpConfig | null;

    if (!config?.host || !config?.remotePath || !config?.fileName) {
      return { success: false, recordsSynced: 0, error: "Missing host, remotePath, or fileName in config" };
    }

    const sftp = await createSftpClient();
    let fileContent: string;

    try {
      await sftp.connect(buildConnectOptions(config, integration.credentials));
      const remoteFile = `${config.remotePath.replace(/\/$/, "")}/${config.fileName}`;
      const buffer = await sftp.get(remoteFile) as Buffer;
      fileContent = buffer.toString("utf-8");
      await sftp.end();
    } catch (err) {
      try { await sftp.end(); } catch { /* ignore */ }
      return { success: false, recordsSynced: 0, error: err instanceof Error ? err.message : "SFTP connection failed" };
    }

    let rawRecords: FactoryRecord[];
    try {
      if (config.fileFormat === "json") {
        const parsed = JSON.parse(fileContent);
        rawRecords = Array.isArray(parsed) ? parsed : (parsed.data ?? parsed.orders ?? parsed.results ?? []);
        if (!Array.isArray(rawRecords)) throw new Error("JSON file must contain an array");
      } else {
        rawRecords = parseCsv(fileContent) as FactoryRecord[];
      }
    } catch (err) {
      return { success: false, recordsSynced: 0, error: err instanceof Error ? err.message : "Failed to parse file" };
    }

    const transformed = transformRecords(rawRecords, config.fieldMap);
    const recordsSynced = await applyToDb(transformed, organizationId);
    return { success: true, recordsSynced };
  }
}
