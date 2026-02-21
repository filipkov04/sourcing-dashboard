import Redis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is not set");
}

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null, // required for BullMQ
    tls: process.env.REDIS_URL.startsWith("rediss://") ? {} : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
