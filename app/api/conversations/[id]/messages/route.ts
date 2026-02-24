import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { error, notFound, unauthorized, forbidden, handleError, created } from "@/lib/api";
import { auth } from "@/lib/auth";
import { supabase, CHAT_ATTACHMENT_BUCKET, getChatAttachmentUrl } from "@/lib/supabase";
import { CHAT_ALLOWED_FILE_TYPES, CHAT_MAX_FILE_SIZE } from "@/lib/chat-constants";
import crypto from "crypto";
import { serverBroadcast } from "@/lib/realtime";

const MAX_MESSAGE_LENGTH = 5000;
const MAX_FILES_PER_MESSAGE = 5;

// POST /api/conversations/[id]/messages — Send a message (JSON or FormData with files)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { id } = await params;

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        userId: session.user.id,
        conversation: { organizationId: session.user.organizationId },
      },
    });

    if (!participant) return notFound("Conversation");

    // Detect content type to handle both JSON and FormData
    const contentType = request.headers.get("content-type") || "";
    let content = "";
    let messageType = "TEXT";
    let files: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      content = (formData.get("content") as string) || "";
      messageType = (formData.get("messageType") as string) || "TEXT";
      const formFiles = formData.getAll("files");
      files = formFiles.filter((f): f is File => f instanceof File);
    } else {
      const body = await request.json();
      content = body.content || "";
      messageType = body.messageType || "TEXT";
    }

    // Content is optional when files are present
    if ((!content || content.trim().length === 0) && files.length === 0) {
      return error("Message content or files are required");
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      return error(`Message must be ${MAX_MESSAGE_LENGTH} characters or less`);
    }

    if (files.length > MAX_FILES_PER_MESSAGE) {
      return error(`Maximum ${MAX_FILES_PER_MESSAGE} files per message`);
    }

    // Validate files
    for (const file of files) {
      if (file.size > CHAT_MAX_FILE_SIZE) {
        return error(`File "${file.name}" exceeds 10MB limit`);
      }
      // Strip codec params (e.g. "audio/webm;codecs=opus" → "audio/webm")
      const baseType = file.type.split(";")[0].trim();
      if (!CHAT_ALLOWED_FILE_TYPES.includes(baseType)) {
        return error(`File type "${file.type}" is not allowed`);
      }
    }

    // Upload files to Supabase if any
    const uploadedFiles: Array<{
      fileName: string;
      fileType: string;
      fileSize: number;
      storagePath: string;
    }> = [];

    for (const file of files) {
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
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

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

    // Create message and update conversation + unread counts in a transaction
    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId: id,
          senderId: session.user.id,
          content: content.trim() || (files.length > 0 ? `Shared ${files.length} file${files.length > 1 ? "s" : ""}` : ""),
          messageType: messageType === "REQUEST" ? "REQUEST" : "TEXT",
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
          attachments: true,
        },
      });

      // Mark sender as having read their own message
      await tx.messageRead.create({
        data: { messageId: msg.id, userId: session.user.id },
      });

      // Update conversation lastMessageAt
      await tx.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date() },
      });

      // Increment unread count for all other participants
      await tx.conversationParticipant.updateMany({
        where: {
          conversationId: id,
          userId: { not: session.user.id },
        },
        data: { unreadCount: { increment: 1 } },
      });

      // Reset sender's unread count
      await tx.conversationParticipant.update({
        where: { conversationId_userId: { conversationId: id, userId: session.user.id } },
        data: { unreadCount: 0, lastReadAt: new Date() },
      });

      return msg;
    });

    // Add public URLs to attachments
    const messageWithUrls = {
      ...message,
      attachments: (message.attachments || []).map((att: { storagePath: string }) => ({
        ...att,
        url: getChatAttachmentUrl(att.storagePath),
      })),
    };

    // Broadcast realtime event
    serverBroadcast(id, {
      type: "new_message",
      messageId: message.id,
      userId: session.user.id,
    }).catch(() => {});

    return created(messageWithUrls, "Message sent");
  } catch (err) {
    return handleError(err);
  }
}
