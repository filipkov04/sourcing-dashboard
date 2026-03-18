import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

const VALID_AVATARS = ["avatar-1", "avatar-2", "avatar-3", "avatar-4", "avatar-5", "avatar-6", "avatar-7"];

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return api.unauthorized();
    }

    const body = await req.json();
    const { avatarId } = body;

    // Allow null (to clear) or a valid avatar ID
    if (avatarId !== null && !VALID_AVATARS.includes(avatarId)) {
      return api.error("Invalid avatar", 400);
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarId },
    });

    return api.success({ avatarId });
  } catch (err) {
    return api.handleError(err);
  }
}
