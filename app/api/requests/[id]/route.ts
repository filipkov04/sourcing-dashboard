import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, forbidden, notFound, validationError, handleError } from "@/lib/api";

async function sendConversationMessage(
  conversationId: string,
  senderId: string | null,
  content: string,
  messageType: "TEXT" | "APPROVAL" | "REQUEST" | "SYSTEM" | "BOT",
  requestAction?: "APPROVED" | "REJECTED" | "PENDING_INFO"
) {
  try {
    await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        messageType,
        ...(requestAction ? { requestAction } : {}),
      },
    });
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        ...(senderId ? { userId: { not: senderId } } : {}),
      },
      data: { unreadCount: { increment: 1 } },
    });
  } catch (err) {
    console.error("[sendConversationMessage] Failed:", err);
  }
}

// GET /api/requests/[id] — Fetch single request by ID (org-scoped)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { id } = await params;

    const request = await prisma.request.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
        targetOrder: { select: { id: true, orderNumber: true, productName: true } },
        targetFactory: { select: { id: true, name: true, location: true } },
      },
    });

    if (!request) return notFound("Request");

    return success(request);
  } catch (err) {
    return handleError(err);
  }
}

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "NEEDS_INFO"]),
  reviewNote: z.string().max(2000).optional(),
});

const respondSchema = z.object({
  action: z.literal("respond"),
  response: z.string().min(1, "Response is required").max(2000),
});

// PATCH /api/requests/[id] — Review (admin) or respond (requester)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { id } = await params;
    const body = await req.json();

    // Find the request (org-scoped)
    const request = await prisma.request.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!request) return notFound("Request");

    // --- Requester responding to NEEDS_INFO ---
    if (body.action === "respond") {
      const validation = respondSchema.safeParse(body);
      if (!validation.success) return validationError(validation.error);

      if (request.requesterId !== session.user.id) {
        return forbidden("Only the requester can respond");
      }
      if (request.status !== "NEEDS_INFO") {
        return error("Request is not awaiting info", 409);
      }

      // Append response to data JSON and reset to PENDING
      const currentData = request.data as Record<string, unknown>;
      const responses = (currentData._responses as string[] | undefined) || [];
      responses.push(validation.data.response);

      const updated = await prisma.request.update({
        where: { id },
        data: {
          status: "PENDING",
          data: { ...currentData, _responses: responses },
          reviewedById: null,
          reviewedAt: null,
        },
        include: {
          requester: { select: { id: true, name: true, email: true } },
          reviewedBy: { select: { id: true, name: true, email: true } },
        },
      });

      // Send response text to conversation
      if (request.conversationId) {
        await sendConversationMessage(
          request.conversationId,
          session.user.id,
          validation.data.response,
          "TEXT"
        );
      }

      return success(updated, "Response submitted, request is back under review");
    }

    // --- Admin reviewing ---
    if (!["ADMIN", "OWNER"].includes(session.user.role)) {
      return forbidden("Only admins can review requests");
    }

    const validation = reviewSchema.safeParse(body);
    if (!validation.success) return validationError(validation.error);

    const { status, reviewNote } = validation.data;

    if (request.status !== "PENDING" && request.status !== "NEEDS_INFO") {
      return error("Request has already been reviewed", 409);
    }

    // For non-approval statuses, just update the request
    if (status !== "APPROVED") {
      const updated = await prisma.request.update({
        where: { id },
        data: {
          status,
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          reviewNote: reviewNote || null,
        },
        include: {
          requester: { select: { id: true, name: true, email: true } },
          reviewedBy: { select: { id: true, name: true, email: true } },
        },
      });

      // Send decision message to conversation
      if (request.conversationId) {
        const content =
          status === "REJECTED"
            ? `Request rejected${reviewNote ? ` — ${reviewNote}` : ""}`
            : `Additional information requested${reviewNote ? ` — ${reviewNote}` : ""}`;
        const requestAction = status === "REJECTED" ? "REJECTED" : "PENDING_INFO";
        await sendConversationMessage(
          request.conversationId,
          session.user.id,
          content,
          "APPROVAL",
          requestAction
        );
      }

      return success(updated);
    }

    // APPROVED — verify target entities exist, then execute inside a transaction
    const data = request.data as Record<string, unknown>;

    // Pre-check: verify target entities are still accessible
    if (request.type === "ORDER_EDIT_REQUEST" || request.type === "ORDER_DELETE_REQUEST") {
      if (!request.targetOrderId) return error("No target order linked to this request", 400);
      const targetOrder = await prisma.order.findFirst({
        where: { id: request.targetOrderId, organizationId: session.user.organizationId },
      });
      if (!targetOrder) return error("Target order no longer exists", 404);
    }
    if (request.type === "FACTORY_EDIT_REQUEST" || request.type === "FACTORY_DELETE_REQUEST") {
      if (!request.targetFactoryId) return error("No target factory linked to this request", 400);
      const targetFactory = await prisma.factory.findFirst({
        where: { id: request.targetFactoryId, organizationId: session.user.organizationId },
      });
      if (!targetFactory) return error("Target factory no longer exists", 404);
    }

    let updated;
    try {
      updated = await prisma.$transaction(async (tx) => {
        let targetOrderId = request.targetOrderId;
        let targetFactoryId = request.targetFactoryId;

        if (request.type === "ORDER_REQUEST") {
          const order = await tx.order.create({
            data: {
              productName: data.productName as string,
              productSKU: (data.productSKU as string) || null,
              orderNumber: `ORD-${Date.now()}`,
              quantity: data.quantity as number,
              unit: (data.unit as string) || "pieces",
              factoryId: data.factoryId as string,
              organizationId: session.user.organizationId,
              orderDate: data.orderDate ? new Date(data.orderDate as string) : new Date(),
              expectedDate: data.expectedDate ? new Date(data.expectedDate as string) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              priority: (data.priority as "LOW" | "NORMAL" | "HIGH" | "URGENT") || "NORMAL",
              notes: (data.notes as string) || null,
              tags: (data.tags as string[]) || [],
            },
          });
          targetOrderId = order.id;

          const stages = data.stages as Array<{ name: string; sequence: number }> | undefined;
          if (stages && stages.length > 0) {
            await tx.orderStage.createMany({
              data: stages.map((s) => ({
                orderId: order.id,
                name: s.name,
                sequence: s.sequence,
              })),
            });
          }
        } else if (request.type === "FACTORY_REQUEST") {
          const factory = await tx.factory.create({
            data: {
              name: data.name as string,
              location: data.location as string,
              address: (data.address as string) || null,
              contactName: (data.contactName as string) || null,
              contactEmail: (data.contactEmail as string) || null,
              contactPhone: (data.contactPhone as string) || null,
              organizationId: session.user.organizationId,
            },
          });
          targetFactoryId = factory.id;
        } else if (request.type === "ORDER_EDIT_REQUEST") {
          const changes = data.changes as Record<string, unknown>;
          if (changes && request.targetOrderId) {
            const currentOrder = await tx.order.findUnique({ where: { id: request.targetOrderId } });
            const allowedFields = ["productName", "productSKU", "orderNumber", "quantity", "unit", "notes", "priority", "factoryId"];
            const dateFields = ["orderDate", "expectedDate"];
            const updateData: Record<string, unknown> = {};

            for (const [key, value] of Object.entries(changes)) {
              if (allowedFields.includes(key)) {
                if (!currentOrder || String(currentOrder[key as keyof typeof currentOrder]) !== String(value)) {
                  updateData[key] = value;
                }
              }
              if (dateFields.includes(key) && typeof value === "string") {
                const newDate = new Date(value);
                const currentDate = currentOrder?.[key as keyof typeof currentOrder];
                if (!currentOrder || !currentDate || new Date(currentDate as string).getTime() !== newDate.getTime()) {
                  updateData[key] = newDate;
                }
              }
              if (key === "tags" && Array.isArray(value)) {
                updateData[key] = value;
              }
            }
            if (Object.keys(updateData).length > 0) {
              await tx.order.update({
                where: { id: request.targetOrderId },
                data: updateData,
              });
            }
          }
        } else if (request.type === "FACTORY_EDIT_REQUEST") {
          const changes = data.changes as Record<string, unknown>;
          if (changes && request.targetFactoryId) {
            const updateData: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(changes)) {
              if (["name", "location", "address", "contactName", "contactEmail", "contactPhone"].includes(key)) {
                updateData[key] = value;
              }
            }
            if (Object.keys(updateData).length > 0) {
              await tx.factory.update({
                where: { id: request.targetFactoryId },
                data: updateData,
              });
            }
          }
        } else if (request.type === "ORDER_DELETE_REQUEST") {
          if (request.targetOrderId) {
            await tx.order.delete({ where: { id: request.targetOrderId } });
            targetOrderId = null;
          }
        } else if (request.type === "FACTORY_DELETE_REQUEST") {
          if (request.targetFactoryId) {
            await tx.factory.delete({ where: { id: request.targetFactoryId } });
            targetFactoryId = null;
          }
        }

        const result = await tx.request.update({
          where: { id },
          data: {
            status: "APPROVED",
            reviewedById: session.user.id,
            reviewedAt: new Date(),
            reviewNote: reviewNote || null,
            ...(targetOrderId !== request.targetOrderId && { targetOrderId }),
            ...(targetFactoryId !== request.targetFactoryId && { targetFactoryId }),
          },
          include: {
            requester: { select: { id: true, name: true, email: true } },
            reviewedBy: { select: { id: true, name: true, email: true } },
          },
        });

        // Send APPROVAL message to conversation
        if (request.conversationId) {
          const content = `Request approved${reviewNote ? ` — ${reviewNote}` : ""}`;
          await tx.message.create({
            data: {
              conversationId: request.conversationId,
              senderId: session.user.id,
              content,
              messageType: "APPROVAL",
              requestAction: "APPROVED",
            },
          });
          await tx.conversation.update({
            where: { id: request.conversationId },
            data: { lastMessageAt: new Date() },
          });
          await tx.conversationParticipant.updateMany({
            where: { conversationId: request.conversationId, userId: { not: session.user.id } },
            data: { unreadCount: { increment: 1 } },
          });
        }

        return result;
      });
    } catch (txErr) {
      // Surface specific DB constraint errors clearly
      const msg = txErr instanceof Error ? txErr.message : String(txErr);
      if (msg.includes("Unique constraint")) {
        return error("Approval failed: a duplicate value already exists (e.g. order number)", 409);
      }
      if (msg.includes("Record to update not found") || msg.includes("Record to delete does not exist")) {
        return error("Approval failed: the target record no longer exists", 404);
      }
      return error(`Approval failed: ${msg}`, 500);
    }

    return success(updated);
  } catch (err) {
    return handleError(err);
  }
}
