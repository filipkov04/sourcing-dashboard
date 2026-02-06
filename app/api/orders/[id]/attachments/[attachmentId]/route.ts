import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, notFound, unauthorized, forbidden, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";
import { supabase, ATTACHMENT_BUCKET } from "@/lib/supabase";

// DELETE /api/orders/[id]/attachments/[attachmentId] - Remove an attachment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    if (!["OWNER", "ADMIN"].includes(session.user.role)) {
      return forbidden("Only admins can delete attachments");
    }

    const { id, attachmentId } = await params;

    // Verify order belongs to organization
    const order = await prisma.order.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!order) {
      return notFound("Order");
    }

    // Find the attachment
    const attachment = await prisma.orderAttachment.findFirst({
      where: {
        id: attachmentId,
        orderId: id,
      },
    });

    if (!attachment) {
      return notFound("Attachment");
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .remove([attachment.storagePath]);

    if (deleteError) {
      return error(`Failed to delete file: ${deleteError.message}`, 500);
    }

    // Delete database record
    await prisma.orderAttachment.delete({
      where: { id: attachmentId },
    });

    return success({ id: attachmentId }, "Attachment deleted");
  } catch (err) {
    return handleError(err);
  }
}

// GET /api/orders/[id]/attachments/[attachmentId] - Get download URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const { id, attachmentId } = await params;

    // Verify order belongs to organization
    const order = await prisma.order.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!order) {
      return notFound("Order");
    }

    const attachment = await prisma.orderAttachment.findFirst({
      where: {
        id: attachmentId,
        orderId: id,
      },
    });

    if (!attachment) {
      return notFound("Attachment");
    }

    // Generate a signed URL for download (valid for 1 hour)
    const { data, error: signError } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .createSignedUrl(attachment.storagePath, 3600);

    if (signError || !data) {
      return error("Failed to generate download URL", 500);
    }

    return success({ url: data.signedUrl, fileName: attachment.fileName });
  } catch (err) {
    return handleError(err);
  }
}
