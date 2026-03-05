import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, notFound, unauthorized, handleError, error, validationError , projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";
import { z } from "zod";

// GET /api/factories/[id] - Get a single factory with its orders
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

    const factory = await prisma.factory.findFirst({
      where: {
        id,
        ...projectScope(session),
      },
      include: {
        orders: {
          orderBy: {
            expectedDate: "asc",
          },
          include: {
            stages: {
              select: {
                id: true,
                progress: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!factory) {
      return notFound("Factory not found");
    }

    return success(factory);
  } catch (err) {
    return handleError(err);
  }
}

// Validation schema for factory update
const updateFactorySchema = z.object({
  name: z.string().min(1, "Factory name is required").max(100).optional(),
  location: z.string().min(1, "Location is required").max(100).optional(),
  address: z.string().max(500).optional(),
  contactName: z.string().max(100).optional(),
  contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  contactPhone: z.string().max(50).optional(),
});

// PATCH /api/factories/[id] - Update an existing factory
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const { id } = await params;
    const body = await request.json();

    // Check if factory exists and belongs to organization
    const existingFactory = await prisma.factory.findFirst({
      where: {
        id,
        ...projectScope(session),
      },
    });

    if (!existingFactory) {
      return notFound("Factory not found");
    }

    // Validate request body
    const validation = updateFactorySchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error);
    }

    const data = validation.data;

    // Build update data
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.contactName !== undefined) updateData.contactName = data.contactName || null;
    if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail || null;
    if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone || null;

    // Update factory
    const updatedFactory = await prisma.factory.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    return success(updatedFactory, "Factory updated successfully");
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/factories/[id] - Delete a factory
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const { id } = await params;

    // Check if factory exists and belongs to organization
    const existingFactory = await prisma.factory.findFirst({
      where: {
        id,
        ...projectScope(session),
      },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!existingFactory) {
      return notFound("Factory not found");
    }

    // Check if factory has orders
    if (existingFactory._count.orders > 0) {
      return error(
        `Cannot delete factory with ${existingFactory._count.orders} existing order${
          existingFactory._count.orders === 1 ? "" : "s"
        }. Please delete or reassign all orders first.`,
        400
      );
    }

    // Delete factory
    await prisma.factory.delete({
      where: { id },
    });

    return success(null, "Factory deleted successfully");
  } catch (err) {
    return handleError(err);
  }
}
