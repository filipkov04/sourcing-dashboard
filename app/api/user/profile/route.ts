import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return api.unauthorized();
  }

  const body = await req.json();
  const { name } = body;

  if (typeof name !== "string") {
    return api.error("Name must be a string");
  }

  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 100) {
    return api.error("Name must be between 1 and 100 characters");
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { name: trimmed },
    select: { id: true, name: true, email: true },
  });

  return api.success(updated);
}
