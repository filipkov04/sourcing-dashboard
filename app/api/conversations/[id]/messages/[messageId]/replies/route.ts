import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, notFound, unauthorized, forbidden, handleError, created } from "@/lib/api";
import { auth } from "@/lib/auth";
import { getChatAttachmentUrl } from "@/lib/supabase";
import { supabase, CHAT_ATTACHMENT_BUCKET } from "@/lib/supabase";
import { CHAT_ALLOWED_FILE_TYPES, CHAT_MAX_FILE_SIZE } from "@/lib/chat-constants";
import crypto from "crypto";
import { serverBroadcast } from "@/lib/realtime";

type RouteParams = { params: Promise<{ id: string; messageId: string }> };

const MAX_MESSAGE_LENGTH = 5000;
const MAX_FILES_PER_MESSAGE = 5;

// GET /api/conversations/[id]/messages/[messageId]/replies — Fetch thread replies
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { id, messageId } = await params;

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        userId: session.user.id,
        conversation: { organizationId: session.user.organizationId },
      },
    });

    if (!participant) return notFound("Conversation");

    // Verify parent message exists
    const parentMessage = await prisma.message.findFirst({
      where: { id: messageId, conversationId: id },
    });

    if (!parentMessage) return notFound("Message");

    const replies = await prisma.message.findMany({
      where: { parentId: messageId, conversationId: id },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, name: true, email: true, image: true } },
        readBy: { select: { userId: true, readAt: true } },
        reactions: { orderBy: { createdAt: "asc" } },
        attachments: true,
      },
    });

    const data = replies.map((msg) => ({
      ...msg,
      attachments: msg.attachments.map((att) => ({
        ...att,
        url: getChatAttachmentUrl(att.storagePath),
      })),
    }));

    return success(data);
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/conversations/[id]/messages/[messageId]/replies — Reply in thread
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    if (session.user.role === "VIEWER") {
      return forbidden("Viewers cannot send messages");
    }

    const { id, messageId } = await params;

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        userId: session.user.id,
        conversation: { organizationId: session.user.organizationId },
      },
    });

    if (!participant) return notFound("Conversation");

    // Verify parent message exists and is a top-level message
    const parentMessage = await prisma.message.findFirst({
      where: { id: messageId, conversationId: id, parentId: null },
    });

    if (!parentMessage) return notFound("Parent message");

    // Parse content (JSON or FormData)
    const contentType = request.headers.get("content-type") || "";
    let content = "";
    let files: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      content = (formData.get("content") as string) || "";
      const formFiles = formData.getAll("files");
      files = formFiles.filter((f): f is File => f instanceof File);
    } else {
      const body = await request.json();
      content = body.content || "";
    }

    if ((!content || content.trim().length === 0) && files.length === 0) {
      return error("Reply content or files are required");
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      return error(`Message must be ${MAX_MESSAGE_LENGTH} characters or less`);
    }

    if (files.length > MAX_FILES_PER_MESSAGE) {
      return error(`Maximum ${MAX_FILES_PER_MESSAGE} files per message`);
    }

    // Validate and upload files
    const uploadedFiles: Array<{
      fileName: string;
      fileType: string;
      fileSize: number;
      storagePath: string;
    }> = [];

    for (const file of files) {
      if (file.size > CHAT_MAX_FILE_SIZE) {
        return error(`File "${file.name}" exceeds 10MB limit`);
      }
      if (!CHAT_ALLOWED_FILE_TYPES.includes(file.type)) {
        return error(`File type "${file.type}" is not allowed`);
      }

      const sanitizedName = file.name
        .replace(/[/\\]/g, "_")
        .replace(/\.\./g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 200);

      const fileId = crypto.randomUUID();
      const storagePath = `${id}/${fileId}-${sanitizedName}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from(CHAT_ATTACHMENT_BUCKET)
        .upload(storagePath, buffer, { contentType: file.type, upsert: false });

      if (uploadError) {
        return error(`Upload failed for "${file.name}": ${uploadError.message}`, 500);
      }

      uploadedFiles.push({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        storagePath,
      });
    }

    // Create reply and increment thread count in a transaction
    const reply = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId: id,
          senderId: session.user.id,
          content: content.trim() || `Shared ${files.length} file${files.length > 1 ? "s" : ""}`,
          messageType: "TEXT",
          parentId: messageId,
          ...(uploadedFiles.length > 0
            ? {
                attachments: {
                  create: uploadedFiles.map((f) => ({
                    ...f,
                    uploadedById: session.user.id,
                  })),
                },
              }
            : {}),
        },
        include: {
          sender: { select: { id: true, name: true, email: true, image: true } },
          reactions: true,
          attachments: true,
        },
      });

      // Increment thread count on parent
      await tx.message.update({
        where: { id: messageId },
        data: { threadCount: { increment: 1 } },
      });

      // Mark sender as having read their reply
      await tx.messageRead.create({
        data: { messageId: msg.id, userId: session.user.id },
      });

      // Update conversation lastMessageAt
      await tx.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date() },
      });

      // Increment unread count for other participants
      await tx.conversationParticipant.updateMany({
        where: {
          conversationId: id,
          userId: { not: session.user.id },
        },
        data: { unreadCount: { increment: 1 } },
      });

      return msg;
    });

    const replyWithUrls = {
      ...reply,
      attachments: (reply.attachments || []).map((att: { storagePath: string }) => ({
        ...att,
        url: getChatAttachmentUrl(att.storagePath),
      })),
    };

    serverBroadcast(id, {
      type: "new_message",
      messageId: reply.id,
      userId: session.user.id,
      payload: { parentId: messageId },
    }).catch(() => {});

    return created(replyWithUrls, "Reply sent");
  } catch (err) {
    return handleError(err);
  }
}
