import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, notFound, unauthorized, handleError, created } from "@/lib/api";
import { auth } from "@/lib/auth";
import { supabase, ATTACHMENT_BUCKET } from "@/lib/supabase";
import crypto from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
];

// GET /api/orders/[id]/attachments - List attachments for an order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const { id } = await params;

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

    const attachments = await prisma.orderAttachment.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "desc" },
    });

    return success(attachments);
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/orders/[id]/attachments - Upload a file attachment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const { id } = await params;

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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return error("No file provided");
    }

    if (file.size > MAX_FILE_SIZE) {
      return error("File size exceeds 10MB limit");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return error(
        "File type not allowed. Accepted: images (png, jpg, gif, webp), PDF, Word, Excel, CSV, text"
      );
    }

    // Sanitize file name: remove path traversal, special chars, keep extension
    const sanitizedName = file.name
      .replace(/[/\\]/g, "_")       // remove path separators
      .replace(/\.\./g, "_")        // remove path traversal
      .replace(/[^a-zA-Z0-9._-]/g, "_")  // only safe chars
      .slice(0, 200);               // cap length

    // Upload to Supabase Storage
    const fileId = crypto.randomUUID();
    const storagePath = `${id}/${fileId}-${sanitizedName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return error(`Upload failed: ${uploadError.message}`, 500);
    }

    // Create database record
    const attachment = await prisma.orderAttachment.create({
      data: {
        orderId: id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        storagePath,
        uploadedById: session.user.id,
      },
    });

    return created(attachment, "File uploaded successfully");
  } catch (err) {
    return handleError(err);
  }
}
