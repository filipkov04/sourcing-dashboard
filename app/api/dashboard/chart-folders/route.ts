import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";
import { z } from "zod";

const createFolderSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return api.unauthorized();

    const folders = await prisma.chartFolder.findMany({
      where: {
        ...api.projectScope(session),
        creatorId: session.user.id,
      },
      include: { _count: { select: { charts: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return api.success(folders);
  } catch (error) {
    console.error("Chart folders list error:", error);
    return api.error("Failed to fetch chart folders");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return api.unauthorized();

    const body = await request.json();
    const parsed = createFolderSchema.safeParse(body);
    if (!parsed.success) return api.validationError(parsed.error);

    const folder = await prisma.chartFolder.create({
      data: {
        ...api.projectScope(session),
        creatorId: session.user.id,
        name: parsed.data.name,
        color: parsed.data.color,
      },
    });

    return api.created(folder);
  } catch (error) {
    console.error("Chart folder create error:", error);
    return api.error("Failed to create chart folder");
  }
}
