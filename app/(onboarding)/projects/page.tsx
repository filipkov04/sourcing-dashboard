import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ProjectFlow } from "@/components/projects/project-flow";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; direct?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;

  const projects = await prisma.project.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      _count: {
        select: { orders: true, factories: true },
      },
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  const isWelcome = params.welcome === "1";
  const isDirect = params.direct === "1";

  return (
    <ProjectFlow
      projects={projects.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        color: p.color,
        icon: p.icon,
        isDefault: p.isDefault,
        orderCount: p._count.orders,
        factoryCount: p._count.factories,
        startDate: p.startDate?.toISOString() ?? null,
        endDate: p.endDate?.toISOString() ?? null,
      }))}
      userName={session.user.name || "there"}
      activeProjectId={session.user.projectId}
      isWelcome={isWelcome}
      isDirect={isDirect}
      userRole={session.user.role}
    />
  );
}
