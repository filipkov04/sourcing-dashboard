import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, handleError } from "@/lib/api";

// DEV ONLY — Quick role switcher for testing
// Usage: PATCH /api/dev/set-role { "role": "MEMBER" }
export async function PATCH(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return error("Not available in production", 403);
  }

  try {
    const session = await auth();
    if (!session) return unauthorized();

    const body = await req.json();
    const { role } = body;

    const validRoles = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];
    if (!validRoles.includes(role)) {
      return error(`Invalid role. Must be one of: ${validRoles.join(", ")}`, 400);
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return success(user, `Role changed to ${role}`);
  } catch (err) {
    return handleError(err);
  }
}
