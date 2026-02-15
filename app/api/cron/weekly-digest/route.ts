import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWeeklyDigest } from "@/lib/digest";

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true },
    });

    const results: Record<string, { sent: number; skipped: number; errors: number }> = {};

    for (const org of organizations) {
      results[org.name] = await sendWeeklyDigest(org.id);
    }

    return NextResponse.json({ success: true, data: results });
  } catch (err) {
    console.error("Weekly digest cron failed:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
