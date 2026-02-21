// Pass connection OPTIONS to BullMQ so it creates its own internal ioredis instance.
// This avoids type conflicts between our ioredis and BullMQ's bundled ioredis.
export const bullmqConnection = {
  url: process.env.REDIS_URL!,
  tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
  maxRetriesPerRequest: null as null,
};
