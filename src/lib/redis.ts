import { createClient } from "redis";
import { env } from "@/config/env";

const globalForRedis = global as unknown as {
  redis: ReturnType<typeof createClient>;
};

const redis = globalForRedis.redis || createClient({ url: env.REDIS_URL });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export async function getRedis() {
  if (!redis.isOpen) await redis.connect();
  return redis;
}

export default redis;
