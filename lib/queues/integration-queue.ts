import { Queue } from "bullmq";
import { bullmqConnection } from "./connection";

export type IntegrationJobData = {
  integrationId: string;
  factoryId: string;
  organizationId: string;
  type: "REST" | "SFTP" | "WEBHOOK" | "MANUAL";
};

export const integrationQueue = new Queue("integration-sync", {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // 5s → 10s → 20s
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});
