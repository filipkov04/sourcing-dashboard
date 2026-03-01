import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, handleError, created } from "@/lib/api";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { getWelcomeMessage, getCategoryLabel, type ChatType } from "@/lib/chat-constants";

// GET /api/conversations — List conversations for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const typeFilter = searchParams.get("type")?.toUpperCase();

    const conversations = await prisma.conversation.findMany({
      where: {
        organizationId: session.user.organizationId,
        participants: { some: { userId: session.user.id } },
        ...(typeFilter && ["SUPPORT", "FACTORY", "GENERAL", "DIRECT"].includes(typeFilter)
          ? { type: typeFilter as "SUPPORT" | "FACTORY" | "GENERAL" | "DIRECT" }
          : {}),
        ...(search
          ? {
              OR: [
                { subject: { contains: search, mode: "insensitive" } },
                { order: { orderNumber: { contains: search, mode: "insensitive" } } },
                { factory: { name: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
        order: { select: { id: true, orderNumber: true, productName: true } },
        factory: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, name: true } } },
        },
      },
    });

    // Attach unread count + pinned status per conversation for the current user
    const data = conversations.map((conv) => {
      const participant = conv.participants.find((p) => p.userId === session.user.id);
      return {
        ...conv,
        unreadCount: participant?.unreadCount ?? 0,
        pinned: participant?.pinned ?? false,
        lastMessage: conv.messages[0] ?? null,
        messages: undefined, // Remove full messages array from list
      };
    });

    // Sort: pinned first, then by lastMessageAt
    data.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0; // Preserve existing lastMessageAt ordering within groups
    });

    return success(data);
  } catch (err) {
    return handleError(err);
  }
}

const createSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200),
  participantIds: z.array(z.string()).default([]),
  orderId: z.string().optional(),
  factoryId: z.string().optional(),
  type: z.enum(["SUPPORT", "FACTORY", "GENERAL", "DIRECT"]).default("GENERAL"),
  category: z.string().optional(),
});

// POST /api/conversations — Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return unauthorized();


    const body = await request.json();
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      return error(validation.error.issues.map((i) => i.message).join(", "));
    }

    const { subject, participantIds, orderId, factoryId, type, category } = validation.data;

    // For DIRECT chats, require exactly one participant and prevent duplicates
    if (type === "DIRECT") {
      if (participantIds.length !== 1) {
        return error("Direct messages require exactly one other participant");
      }

      // Check for existing DIRECT conversation between these two users
      const existingDM = await prisma.conversation.findFirst({
        where: {
          organizationId: session.user.organizationId,
          type: "DIRECT",
          AND: [
            { participants: { some: { userId: session.user.id } } },
            { participants: { some: { userId: participantIds[0] } } },
          ],
        },
        include: {
          participants: {
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
          },
          order: { select: { id: true, orderNumber: true, productName: true } },
          factory: { select: { id: true, name: true } },
          messages: {
            orderBy: { createdAt: "asc" },
            include: {
              sender: { select: { id: true, name: true } },
              attachments: true,
            },
          },
        },
      });

      if (existingDM) {
        return success(existingDM, "Existing conversation returned");
      }
    }

    // For GENERAL chats, require at least one participant
    if (type === "GENERAL" && participantIds.length === 0) {
      return error("At least one participant is required for general conversations");
    }

    // Ensure all participants belong to the same organization
    if (participantIds.length > 0) {
      const participants = await prisma.user.findMany({
        where: { id: { in: participantIds }, organizationId: session.user.organizationId },
        select: { id: true },
      });
      if (participants.length !== participantIds.length) {
        return error("Some participants don't belong to your organization");
      }
    }

    // Verify order/factory belong to org if provided
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: { id: orderId, organizationId: session.user.organizationId },
      });
      if (!order) return error("Order not found in your organization", 404);
    }

    if (factoryId) {
      const factory = await prisma.factory.findFirst({
        where: { id: factoryId, organizationId: session.user.organizationId },
      });
      if (!factory) return error("Factory not found in your organization", 404);
    }

    // For FACTORY type, require factoryId
    if (type === "FACTORY" && !factoryId) {
      return error("Factory is required for factory conversations");
    }

    // Include the creator as a participant
    const allParticipantIds = [session.user.id, ...participantIds];

    // Auto-add all ADMIN/OWNER users for SUPPORT conversations
    if (type === "SUPPORT") {
      const admins = await prisma.user.findMany({
        where: {
          organizationId: session.user.organizationId,
          role: { in: ["OWNER", "ADMIN"] },
        },
        select: { id: true },
      });
      admins.forEach((a) => allParticipantIds.push(a.id));
    }

    // Deduplicate
    const uniqueParticipantIds = [...new Set(allParticipantIds)];

    // Use a transaction to create conversation + initial messages
    const conversation = await prisma.$transaction(async (tx) => {
      // Create the conversation with participants
      const conv = await tx.conversation.create({
        data: {
          organizationId: session.user.organizationId,
          subject,
          type,
          category: category ?? null,
          orderId: orderId ?? null,
          factoryId: factoryId ?? null,
          participants: {
            create: uniqueParticipantIds.map((userId) => ({ userId })),
          },
          lastMessageAt: new Date(),
        },
      });

      // Create initial messages based on type (skip for DIRECT)
      if (type === "DIRECT") {
        // No initial message for DMs
      } else if (type === "SUPPORT") {
        // BOT greeting — category will be set later via quick-reply
        await tx.message.create({
          data: {
            conversationId: conv.id,
            senderId: null,
            content: getWelcomeMessage("SUPPORT", ""),
            messageType: "BOT",
          },
        });
      } else if (type === "FACTORY") {
        // System message with category label
        if (category) {
          await tx.message.create({
            data: {
              conversationId: conv.id,
              senderId: null,
              content: `Category: ${getCategoryLabel(type as ChatType, category)}`,
              messageType: "SYSTEM",
            },
          });
        }
        // BOT welcome message
        await tx.message.create({
          data: {
            conversationId: conv.id,
            senderId: null,
            content: getWelcomeMessage(type as ChatType, category || "other"),
            messageType: "BOT",
          },
        });
      } else {
        // Default GENERAL system message
        await tx.message.create({
          data: {
            conversationId: conv.id,
            senderId: session.user.id,
            content: `${session.user.name || session.user.email} started a conversation`,
            messageType: "SYSTEM",
          },
        });
      }

      // Return full conversation with includes
      return tx.conversation.findUnique({
        where: { id: conv.id },
        include: {
          participants: {
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
          },
          order: { select: { id: true, orderNumber: true, productName: true } },
          factory: { select: { id: true, name: true } },
          messages: {
            orderBy: { createdAt: "asc" },
            include: {
              sender: { select: { id: true, name: true } },
              attachments: true,
            },
          },
        },
      });
    });

    return created(conversation, "Conversation created");
  } catch (err) {
    console.error("[POST /api/conversations] Error:", err);
    return handleError(err);
  }
}
