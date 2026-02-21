import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { getCredentials } from "@/lib/integrations/encryption";
import { transformRecords, applyToDb, FieldMap, FactoryRecord } from "@/lib/integrations/transformer";

// Webhook receiver — factories POST to /api/webhooks/[factoryId]
//
// Expected payload shape (mirrors mock factory API):
// {
//   po_number: "PO-001",          // maps via fieldMap.orderNumber
//   production_status: "delayed", // maps via fieldMap.status
//   completion_pct: 65,           // maps via fieldMap.progress
//   production_stages: [...]      // maps via fieldMap.stages (optional)
// }
//
// Config shape (integration.config):
// {
//   signatureHeader: "X-Webhook-Signature",  // header containing HMAC
//   signatureAlgorithm: "sha256",            // or "sha1"
//   fieldMap: { orderNumber: "po_number", status: "production_status", ... }
// }
//
// Credentials shape (encrypted):
// { secret: "shared-hmac-secret-from-factory" }

type WebhookConfig = {
  signatureHeader?: string;
  signatureAlgorithm?: "sha256" | "sha1";
  fieldMap: FieldMap;
};

function verifySignature(
  rawBody: string,
  signature: string,
  secret: string,
  algorithm: "sha256" | "sha1"
): boolean {
  try {
    const expected = createHmac(algorithm, secret)
      .update(rawBody, "utf8")
      .digest("hex");

    // Strip common prefixes like "sha256=" that some factories add
    const incoming = signature.replace(/^sha\d+=/, "");

    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(incoming, "hex")
    );
  } catch {
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ factoryId: string }> }
) {
  const { factoryId } = await params;

  // Find the webhook integration for this factory
  const integration = await prisma.integration.findFirst({
    where: { factoryId, type: "WEBHOOK", status: { in: ["ACTIVE", "PENDING"] } },
  });

  if (!integration) {
    return NextResponse.json({ error: "No webhook integration found" }, { status: 404 });
  }

  const config = integration.config as WebhookConfig | null;
  if (!config?.fieldMap) {
    return NextResponse.json({ error: "Integration not configured" }, { status: 500 });
  }

  // Read raw body for signature verification
  const rawBody = await request.text();

  // Verify HMAC signature if a secret is configured
  const credentials = getCredentials(integration.credentials as string | null);
  if (credentials?.secret) {
    const sigHeader = config.signatureHeader ?? "X-Webhook-Signature";
    const algorithm = config.signatureAlgorithm ?? "sha256";
    const signature = request.headers.get(sigHeader);

    if (!signature) {
      return NextResponse.json({ error: "Missing signature header" }, { status: 401 });
    }

    if (!verifySignature(rawBody, signature, String(credentials.secret), algorithm)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  // Parse payload
  let payload: FactoryRecord | FactoryRecord[];
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // Process and update DB
  try {
    const records = Array.isArray(payload) ? payload : [payload as FactoryRecord];
    const transformed = transformRecords(records, config.fieldMap);
    const synced = await applyToDb(transformed, integration.organizationId);

    // Update last sync metadata
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: "SUCCESS",
        lastSyncError: null,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ received: true, recordsSynced: synced });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Processing failed";
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncStatus: "FAILED", lastSyncError: msg },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
