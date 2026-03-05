import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * GET /api/dashboard/stage-duration
 * Avg duration per stage type (startedAt → completedAt), bottleneck identification.
 * Grouped by factory.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const organizationId = session.user.organizationId;
    const projectId = session.user.projectId;

    // Fetch completed stages with timing data
    const stages = await prisma.orderStage.findMany({
      where: {
        order: { organizationId, ...(projectId ? { projectId } : {}) },
        status: "COMPLETED",
        startedAt: { not: null },
        completedAt: { not: null },
      },
      select: {
        name: true,
        startedAt: true,
        completedAt: true,
        order: {
          select: {
            factory: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Group by stage name (overall)
    const byStage = new Map<string, number[]>();
    // Group by factory + stage
    const byFactoryStage = new Map<string, Map<string, number[]>>();

    for (const stage of stages) {
      const durationDays = Math.ceil(
        (new Date(stage.completedAt!).getTime() - new Date(stage.startedAt!).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // Overall stage stats
      if (!byStage.has(stage.name)) {
        byStage.set(stage.name, []);
      }
      byStage.get(stage.name)!.push(durationDays);

      // By factory
      const factoryId = stage.order.factory.id;
      if (!byFactoryStage.has(factoryId)) {
        byFactoryStage.set(factoryId, new Map());
      }
      const factoryMap = byFactoryStage.get(factoryId)!;
      if (!factoryMap.has(stage.name)) {
        factoryMap.set(stage.name, []);
      }
      factoryMap.get(stage.name)!.push(durationDays);
    }

    // Compute overall stage averages
    const stageStats = Array.from(byStage.entries())
      .map(([name, durations]) => {
        const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length * 10) / 10;
        const sorted = [...durations].sort((a, b) => a - b);
        return {
          stageName: name,
          avgDuration: avg,
          minDuration: sorted[0],
          maxDuration: sorted[sorted.length - 1],
          sampleCount: durations.length,
        };
      })
      .sort((a, b) => b.avgDuration - a.avgDuration); // Longest first (bottleneck)

    // Find bottleneck (longest average stage)
    const bottleneck = stageStats.length > 0 ? stageStats[0].stageName : null;

    // Compute by-factory breakdown
    const factoryBreakdown: Array<{
      factoryId: string;
      factoryName: string;
      stages: Array<{ stageName: string; avgDuration: number; sampleCount: number }>;
      totalAvgDuration: number;
    }> = [];

    // Get factory names
    const factoryIds = Array.from(byFactoryStage.keys());
    const factories = await prisma.factory.findMany({
      where: { id: { in: factoryIds } },
      select: { id: true, name: true },
    });
    const factoryNameMap = new Map(factories.map((f) => [f.id, f.name]));

    for (const [factoryId, stageMap] of byFactoryStage) {
      const factoryStages = Array.from(stageMap.entries()).map(([name, durations]) => ({
        stageName: name,
        avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length * 10) / 10,
        sampleCount: durations.length,
      }));

      const totalAvg = factoryStages.reduce((sum, s) => sum + s.avgDuration, 0);

      factoryBreakdown.push({
        factoryId,
        factoryName: factoryNameMap.get(factoryId) || "Unknown",
        stages: factoryStages.sort((a, b) => b.avgDuration - a.avgDuration),
        totalAvgDuration: Math.round(totalAvg * 10) / 10,
      });
    }

    factoryBreakdown.sort((a, b) => a.totalAvgDuration - b.totalAvgDuration);

    return api.success({
      overall: stageStats,
      bottleneck,
      byFactory: factoryBreakdown,
    });
  } catch (error) {
    console.error("Stage duration analytics error:", error);
    return api.error("Failed to fetch stage duration analytics");
  }
}
