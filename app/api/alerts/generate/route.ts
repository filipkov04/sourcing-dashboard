import { auth } from "@/lib/auth";
import { success, unauthorized, handleError } from "@/lib/api";
import {
  generateAlertsForOrganization,
  autoResolveAlerts,
} from "@/lib/alert-generator";

// POST /api/alerts/generate — Scan orders and generate alerts
export async function POST() {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const organizationId = session.user.organizationId;

    // Auto-resolve alerts for completed orders first
    const resolvedCount = await autoResolveAlerts(organizationId);

    // Generate new alerts
    const newAlerts = await generateAlertsForOrganization(organizationId);

    return success({
      generated: newAlerts.length,
      resolved: resolvedCount,
      alerts: newAlerts,
    });
  } catch (err) {
    return handleError(err);
  }
}
