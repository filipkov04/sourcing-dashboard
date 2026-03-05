import { prisma } from "@/lib/db";
import { success, unauthorized, handleError , projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";

// GET /api/alerts/unread-count — Returns unread alert count for badge
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const count = await prisma.alert.count({
      where: {
        ...projectScope(session),
        read: false,
      },
    });

    return success({ count });
  } catch (err) {
    return handleError(err);
  }
}
