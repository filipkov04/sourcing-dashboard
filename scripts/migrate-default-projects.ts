/**
 * Migration script: Create a "Default Project" for each organization
 * and backfill all existing rows' projectId.
 *
 * Usage: npx tsx scripts/migrate-default-projects.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting default project migration...\n");

  const organizations = await prisma.organization.findMany({
    include: { users: { where: { role: "OWNER" }, take: 1 } },
  });

  console.log(`Found ${organizations.length} organization(s)\n`);

  for (const org of organizations) {
    const creatorId = org.users[0]?.id;
    if (!creatorId) {
      console.warn(`  ⚠ Org "${org.name}" has no OWNER, skipping`);
      continue;
    }

    // Check if a default project already exists
    const existing = await prisma.project.findFirst({
      where: { organizationId: org.id, isDefault: true },
    });

    if (existing) {
      console.log(`  ✓ Org "${org.name}" already has default project "${existing.name}"`);
      // Still backfill any rows missing projectId
      await backfillProjectId(org.id, existing.id);
      continue;
    }

    // Create default project
    const project = await prisma.project.create({
      data: {
        name: "Default Project",
        slug: "default",
        description: "Default project for existing data",
        color: "#6366F1", // indigo
        organizationId: org.id,
        createdById: creatorId,
        isDefault: true,
      },
    });

    console.log(`  ✓ Created default project for org "${org.name}" (${project.id})`);

    // Backfill all scoped models
    await backfillProjectId(org.id, project.id);

    // Set all org users' activeProjectId
    await prisma.user.updateMany({
      where: { organizationId: org.id },
      data: { activeProjectId: project.id },
    });

    console.log(`  ✓ Set activeProjectId for all users in "${org.name}"\n`);
  }

  console.log("Migration complete!");
}

async function backfillProjectId(orgId: string, projectId: string) {
  const models = [
    { name: "factory", update: () => prisma.factory.updateMany({ where: { organizationId: orgId, projectId: null }, data: { projectId } }) },
    { name: "order", update: () => prisma.order.updateMany({ where: { organizationId: orgId, projectId: null }, data: { projectId } }) },
    { name: "alert", update: () => prisma.alert.updateMany({ where: { organizationId: orgId, projectId: null }, data: { projectId } }) },
    { name: "conversation", update: () => prisma.conversation.updateMany({ where: { organizationId: orgId, projectId: null }, data: { projectId } }) },
    { name: "request", update: () => prisma.request.updateMany({ where: { organizationId: orgId, projectId: null }, data: { projectId } }) },
    { name: "customChart", update: () => prisma.customChart.updateMany({ where: { organizationId: orgId, projectId: null }, data: { projectId } }) },
  ];

  for (const model of models) {
    const result = await model.update();
    if (result.count > 0) {
      console.log(`    → Backfilled ${result.count} ${model.name}(s)`);
    }
  }

  // Integration doesn't have organizationId as a relation, so filter via factory
  const factories = await prisma.factory.findMany({
    where: { organizationId: orgId },
    select: { id: true },
  });
  if (factories.length > 0) {
    const result = await prisma.integration.updateMany({
      where: {
        factoryId: { in: factories.map((f) => f.id) },
        projectId: null,
      },
      data: { projectId },
    });
    if (result.count > 0) {
      console.log(`    → Backfilled ${result.count} integration(s)`);
    }
  }
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
