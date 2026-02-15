import { prisma } from "./db";
import { sendEmail } from "./email";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  DELAYED: "Delayed",
  DISRUPTED: "Disrupted",
  COMPLETED: "Completed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#a1a1aa",
  IN_PROGRESS: "#3b82f6",
  DELAYED: "#eab308",
  DISRUPTED: "#ef4444",
  COMPLETED: "#22c55e",
  SHIPPED: "#8b5cf6",
  DELIVERED: "#22c55e",
  CANCELLED: "#71717a",
};

interface OrderStatusChangeParams {
  orderId: string;
  organizationId: string;
  orderNumber: string;
  productName: string;
  oldStatus: string;
  newStatus: string;
  factoryName?: string;
  stageName?: string; // if triggered by a stage change
}

/**
 * Send email notifications to org members when an order status changes.
 * Fires asynchronously — never blocks the API response.
 */
export async function notifyOrderStatusChange({
  orderId,
  organizationId,
  orderNumber,
  productName,
  oldStatus,
  newStatus,
  factoryName,
  stageName,
}: OrderStatusChangeParams): Promise<void> {
  try {
    // Get all org members with their notification preferences
    const users = await prisma.user.findMany({
      where: {
        organizationId,
        role: { in: ["OWNER", "ADMIN"] },
      },
      select: {
        email: true,
        notificationPreference: {
          select: {
            orderStatusEnabled: true,
            delayAlertEnabled: true,
            disruptionAlertEnabled: true,
          },
        },
      },
    });

    if (users.length === 0) return;

    const isDelay = newStatus === "DELAYED";
    const isDisruption = newStatus === "DISRUPTED";

    // Filter users based on their notification preferences
    const eligibleUsers = users.filter((user) => {
      const prefs = user.notificationPreference;
      // No preference record = all enabled (default)
      if (!prefs) return true;
      if (isDisruption && !prefs.disruptionAlertEnabled) return false;
      if (isDelay && !prefs.delayAlertEnabled) return false;
      if (!isDelay && !isDisruption && !prefs.orderStatusEnabled) return false;
      return true;
    });

    if (eligibleUsers.length === 0) return;

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const orderUrl = `${baseUrl}/orders/${orderId}`;
    const newLabel = STATUS_LABELS[newStatus] || newStatus;
    const oldLabel = STATUS_LABELS[oldStatus] || oldStatus;
    const color = STATUS_COLORS[newStatus] || "#a1a1aa";

    const isAlert = newStatus === "DELAYED" || newStatus === "DISRUPTED";
    const subject = isAlert
      ? `Alert: Order ${orderNumber} is now ${newLabel}`
      : `Order ${orderNumber} — ${newLabel}`;

    const triggerLine = stageName
      ? `<p style="color: #a1a1aa; font-size: 13px; margin: 0 0 16px;">Triggered by stage: <strong style="color: #d4d4d8;">${stageName}</strong></p>`
      : "";

    const alertBanner = isAlert
      ? `<div style="background: ${newStatus === "DISRUPTED" ? "#7f1d1d" : "#713f12"}; border-radius: 8px; padding: 12px 16px; margin: 0 0 20px;">
          <p style="color: #fff; margin: 0; font-size: 14px; font-weight: 600;">
            ${newStatus === "DISRUPTED" ? "Production is blocked and requires immediate attention." : "This order is behind schedule."}
          </p>
        </div>`
      : "";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #18181b; margin: 0 0 4px;">${productName}</h2>
        <p style="color: #71717a; margin: 0 0 20px; font-size: 14px;">Order ${orderNumber}${factoryName ? ` · ${factoryName}` : ""}</p>
        ${alertBanner}
        <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 0 0 16px;">
          <p style="color: #71717a; font-size: 13px; margin: 0 0 4px;">Status changed</p>
          <p style="margin: 0; font-size: 15px;">
            <span style="color: #52525b;">${oldLabel}</span>
            <span style="color: #a1a1aa;"> → </span>
            <span style="color: ${color}; font-weight: 600;">${newLabel}</span>
          </p>
        </div>
        ${triggerLine}
        <a href="${orderUrl}" style="display: inline-block; background: #f97316; color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          View Order
        </a>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0 16px;" />
        <p style="color: #a1a1aa; font-size: 12px; margin: 0;">SourceTrack — Production tracking for brands</p>
      </div>
    `;

    const text = [
      `${productName} (Order ${orderNumber})${factoryName ? ` — ${factoryName}` : ""}`,
      `Status: ${oldLabel} → ${newLabel}`,
      stageName ? `Triggered by stage: ${stageName}` : "",
      isAlert && newStatus === "DISRUPTED" ? "Production is blocked and requires immediate attention." : "",
      isAlert && newStatus === "DELAYED" ? "This order is behind schedule." : "",
      `View order: ${orderUrl}`,
    ].filter(Boolean).join("\n");

    // Send to all eligible users in parallel
    await Promise.all(
      eligibleUsers.map((user) => sendEmail({ to: user.email, subject, html, text }))
    );
  } catch (err) {
    // Never let notification failures break the API
    console.error("Failed to send order status notification:", err);
  }
}
