import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api";
import { success, error, handleError } from "@/lib/api";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ["OWNER", "ADMIN"]);

    const body = await req.json();
    const { to } = body;

    if (!to || typeof to !== "string") {
      return error("Missing required field: to (email address)");
    }

    const result = await sendEmail({
      to,
      subject: "SourceTrack — Test Email",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #18181b;">SourceTrack Email Test</h2>
          <p style="color: #52525b;">If you're reading this, your email integration is working correctly.</p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 16px 0;" />
          <p style="color: #a1a1aa; font-size: 12px;">Sent from SourceTrack at ${new Date().toISOString()}</p>
        </div>
      `,
      text: "SourceTrack Email Test — If you're reading this, your email integration is working correctly.",
    });

    if (!result.success) {
      return error(result.error || "Failed to send email", 500);
    }

    return success({ emailId: result.data?.id }, "Test email sent successfully");
  } catch (err) {
    return handleError(err);
  }
}
