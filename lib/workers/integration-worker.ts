import { Worker, Job } from "bullmq";
import { bullmqConnection } from "../queues/connection";
import { IntegrationJobData } from "../queues/integration-queue";
import { integrationManager } from "../integrations/manager";
import "../integrations/adapters"; // registers all adapters

async function processIntegrationJob(job: Job<IntegrationJobData>) {
  const { integrationId } = job.data;

  console.log(`[integration-worker] Job ${job.id}: syncing integration ${integrationId}`);
  await job.updateProgress(10);

  const result = await integrationManager.runSync(integrationId);

  await job.updateProgress(100);

  if (!result.success) {
    throw new Error(result.error ?? "Sync failed");
  }

  console.log(`[integration-worker] Job ${job.id}: synced ${result.recordsSynced} records`);
  return result;
}

export function startIntegrationWorker() {
  const worker = new Worker<IntegrationJobData>(
    "integration-sync",
    processIntegrationJob,
    { connection: bullmqConnection, concurrency: 3 }
  );

  worker.on("completed", (job) => {
    console.log(`[integration-worker] ✓ Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[integration-worker] ✗ Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
