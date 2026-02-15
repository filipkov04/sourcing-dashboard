import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return api.unauthorized();
    }

    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    });

    // Create default preferences if none exist
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId: session.user.id },
      });
    }

    return api.success({
      orderStatusEnabled: prefs.orderStatusEnabled,
      delayAlertEnabled: prefs.delayAlertEnabled,
      disruptionAlertEnabled: prefs.disruptionAlertEnabled,
      weeklyDigestEnabled: prefs.weeklyDigestEnabled,
    });
  } catch (err) {
    console.error("Notification preferences fetch error:", err);
    return api.serverError("Failed to fetch notification preferences");
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return api.unauthorized();
    }

    const body = await req.json();

    // Only allow known boolean fields
    const allowedFields = [
      "orderStatusEnabled",
      "delayAlertEnabled",
      "disruptionAlertEnabled",
      "weeklyDigestEnabled",
    ] as const;

    const updateData: Record<string, boolean> = {};
    for (const field of allowedFields) {
      if (typeof body[field] === "boolean") {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return api.error("No valid fields to update", 400);
    }

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: { userId: session.user.id, ...updateData },
    });

    return api.success({
      orderStatusEnabled: prefs.orderStatusEnabled,
      delayAlertEnabled: prefs.delayAlertEnabled,
      disruptionAlertEnabled: prefs.disruptionAlertEnabled,
      weeklyDigestEnabled: prefs.weeklyDigestEnabled,
    });
  } catch (err) {
    console.error("Notification preferences update error:", err);
    return api.serverError("Failed to update notification preferences");
  }
}
