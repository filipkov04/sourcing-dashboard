import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const VALID_AVATARS = ["avatar-1", "avatar-2", "avatar-3", "avatar-4", "avatar-5", "avatar-6", "avatar-7"];

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { avatarId } = body;

  // Allow null (to clear) or a valid avatar ID
  if (avatarId !== null && !VALID_AVATARS.includes(avatarId)) {
    return NextResponse.json({ success: false, error: "Invalid avatar" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarId },
  });

  return NextResponse.json({ success: true, data: { avatarId } });
}
