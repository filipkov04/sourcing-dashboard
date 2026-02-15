import { Resend } from "resend";
import { prisma } from "./db";

let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set — emails will not be sent");
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const DEFAULT_FROM = "SourceTrack <onboarding@resend.dev>";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

interface SendEmailResult {
  success: boolean;
  data?: { id: string };
  error?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailParams): Promise<SendEmailResult> {
  const client = getResendClient();
  const from = process.env.EMAIL_FROM || DEFAULT_FROM;
  const toEmail = Array.isArray(to) ? to.join(", ") : to;

  if (!client) {
    await prisma.emailLog.create({
      data: {
        toEmail,
        fromEmail: from,
        subject,
        status: "FAILED",
        error: "RESEND_API_KEY not configured",
      },
    });
    return { success: false, error: "Email service not configured" };
  }

  try {
    const payload = {
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      ...(html ? { html } : {}),
      ...(text ? { text } : {}),
    };
    const { data, error } = await client.emails.send(
      payload as Parameters<typeof client.emails.send>[0]
    );

    if (error) {
      await prisma.emailLog.create({
        data: {
          toEmail,
          fromEmail: from,
          subject,
          status: "FAILED",
          error: error.message,
        },
      });
      return { success: false, error: error.message };
    }

    await prisma.emailLog.create({
      data: {
        toEmail,
        fromEmail: from,
        subject,
        status: "SENT",
        resendId: data?.id,
      },
    });

    return { success: true, data: { id: data!.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.emailLog.create({
      data: {
        toEmail,
        fromEmail: from,
        subject,
        status: "FAILED",
        error: message,
      },
    });
    return { success: false, error: message };
  }
}
