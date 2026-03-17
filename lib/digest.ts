import { prisma } from "./db";
import { sendEmail } from "./email";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  BEHIND_SCHEDULE: "Behind Schedule",
  DELAYED: "Delayed",
  DISRUPTED: "Disrupted",
  COMPLETED: "Completed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "#3b82f6",
  BEHIND_SCHEDULE: "#eab308",
  DELAYED: "#eab308",
  DISRUPTED: "#ef4444",
  COMPLETED: "#22c55e",
  SHIPPED: "#8b5cf6",
};

interface DigestResult {
  sent: number;
  skipped: number;
  errors: number;
}

/**
 * Send a weekly digest email to all eligible users in an organization.
 * Summarizes the past 7 days of order activity.
 */
export async function sendWeeklyDigest(
  organizationId: string
): Promise<DigestResult> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get eligible users (weeklyDigestEnabled or no preference record)
  const users = await prisma.user.findMany({
    where: { organizationId },
    select: {
      email: true,
      name: true,
      notificationPreference: {
        select: { weeklyDigestEnabled: true },
      },
    },
  });

  const eligibleUsers = users.filter((u) => {
    if (!u.notificationPreference) return true;
    return u.notificationPreference.weeklyDigestEnabled;
  });

  if (eligibleUsers.length === 0) {
    return { sent: 0, skipped: users.length, errors: 0 };
  }

  // Aggregate order stats for the past 7 days
  const [
    ordersCreated,
    ordersCompleted,
    ordersDelayed,
    ordersDisrupted,
    activeOrders,
    recentEvents,
    org,
  ] = await Promise.all([
    prisma.order.count({
      where: { organizationId, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.order.count({
      where: {
        organizationId,
        status: "COMPLETED",
        updatedAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.order.count({
      where: {
        organizationId,
        status: "DELAYED",
        updatedAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.order.count({
      where: {
        organizationId,
        status: "DISRUPTED",
        updatedAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.order.count({
      where: {
        organizationId,
        status: { in: ["IN_PROGRESS", "BEHIND_SCHEDULE", "DELAYED", "DISRUPTED"] },
      },
    }),
    prisma.orderEvent.findMany({
      where: {
        order: { organizationId },
        createdAt: { gte: sevenDaysAgo },
        eventType: "STATUS_CHANGE",
      },
      include: {
        order: { select: { orderNumber: true, productName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    }),
  ]);

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const orgName = org?.name || "Your Organization";

  const weekStart = sevenDaysAgo.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const weekEnd = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Build activity highlights HTML
  const activityHtml =
    recentEvents.length > 0
      ? recentEvents
          .map((evt) => {
            const newLabel = STATUS_LABELS[evt.newValue || ""] || evt.newValue;
            const color = STATUS_COLORS[evt.newValue || ""] || "#71717a";
            return `<tr>
              <td style="padding: 8px 12px; font-size: 13px; color: #52525b; border-bottom: 1px solid #f4f4f5;">
                ${evt.order.productName} (${evt.order.orderNumber})
              </td>
              <td style="padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #f4f4f5;">
                <span style="color: ${color}; font-weight: 600;">${newLabel}</span>
              </td>
            </tr>`;
          })
          .join("")
      : `<tr><td colspan="2" style="padding: 12px; color: #a1a1aa; font-size: 13px; text-align: center;">No status changes this week</td></tr>`;

  const subject = `Weekly Digest — ${orgName} (${weekStart} – ${weekEnd})`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
      <h2 style="color: #18181b; margin: 0 0 4px;">Weekly Digest</h2>
      <p style="color: #71717a; margin: 0 0 24px; font-size: 14px;">${orgName} · ${weekStart} – ${weekEnd}</p>

      <!-- Stats Grid -->
      <div style="display: flex; gap: 12px; margin-bottom: 24px;">
        <div style="flex: 1; background: #f4f4f5; border-radius: 8px; padding: 16px; text-align: center;">
          <p style="color: #71717a; font-size: 12px; margin: 0 0 4px;">New Orders</p>
          <p style="color: #18181b; font-size: 24px; font-weight: 700; margin: 0;">${ordersCreated}</p>
        </div>
        <div style="flex: 1; background: #f0fdf4; border-radius: 8px; padding: 16px; text-align: center;">
          <p style="color: #71717a; font-size: 12px; margin: 0 0 4px;">Completed</p>
          <p style="color: #22c55e; font-size: 24px; font-weight: 700; margin: 0;">${ordersCompleted}</p>
        </div>
        <div style="flex: 1; background: #fefce8; border-radius: 8px; padding: 16px; text-align: center;">
          <p style="color: #71717a; font-size: 12px; margin: 0 0 4px;">Delayed</p>
          <p style="color: #eab308; font-size: 24px; font-weight: 700; margin: 0;">${ordersDelayed}</p>
        </div>
        <div style="flex: 1; background: #fef2f2; border-radius: 8px; padding: 16px; text-align: center;">
          <p style="color: #71717a; font-size: 12px; margin: 0 0 4px;">Disrupted</p>
          <p style="color: #ef4444; font-size: 24px; font-weight: 700; margin: 0;">${ordersDisrupted}</p>
        </div>
      </div>

      <!-- Active Orders -->
      <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="color: #71717a; font-size: 13px; margin: 0 0 4px;">Active Orders</p>
        <p style="color: #18181b; font-size: 20px; font-weight: 700; margin: 0;">${activeOrders}</p>
      </div>

      <!-- Recent Activity -->
      <h3 style="color: #18181b; font-size: 15px; margin: 0 0 12px;">Recent Activity</h3>
      <table style="width: 100%; border-collapse: collapse; background: #fafafa; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
        <thead>
          <tr style="background: #f4f4f5;">
            <th style="padding: 8px 12px; font-size: 12px; color: #71717a; text-align: left; font-weight: 500;">Order</th>
            <th style="padding: 8px 12px; font-size: 12px; color: #71717a; text-align: left; font-weight: 500;">Status</th>
          </tr>
        </thead>
        <tbody>${activityHtml}</tbody>
      </table>

      <!-- CTA -->
      <a href="${baseUrl}/dashboard" style="display: inline-block; background: #f97316; color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
        View Dashboard
      </a>

      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0 16px;" />
      <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
        SourceTrack — Production tracking for brands.
        <a href="${baseUrl}/settings" style="color: #a1a1aa;">Manage notification preferences</a>
      </p>
    </div>
  `;

  const text = [
    `Weekly Digest — ${orgName}`,
    `${weekStart} – ${weekEnd}`,
    "",
    `New Orders: ${ordersCreated}`,
    `Completed: ${ordersCompleted}`,
    `Delayed: ${ordersDelayed}`,
    `Disrupted: ${ordersDisrupted}`,
    `Active Orders: ${activeOrders}`,
    "",
    "Recent Activity:",
    ...recentEvents.map(
      (evt) =>
        `  ${evt.order.productName} (${evt.order.orderNumber}) → ${STATUS_LABELS[evt.newValue || ""] || evt.newValue}`
    ),
    "",
    `View dashboard: ${baseUrl}/dashboard`,
  ].join("\n");

  let sent = 0;
  let errors = 0;

  const results = await Promise.all(
    eligibleUsers.map((user) =>
      sendEmail({ to: user.email, subject, html, text })
    )
  );

  for (const result of results) {
    if (result.success) sent++;
    else errors++;
  }

  return { sent, skipped: users.length - eligibleUsers.length, errors };
}
