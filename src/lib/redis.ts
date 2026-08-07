import { createClient } from "redis";
import { env } from "@/config/env";

// Same global-caching trick as `src/lib/db.ts`: avoids creating a new Redis
// client (and TCP connection) on every dev hot reload.
const globalForRedis = global as unknown as {
  redis: ReturnType<typeof createClient>;
};

const redis = globalForRedis.redis || createClient({ url: env.REDIS_URL });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

/**
 * Returns the shared Redis client, connecting it lazily on first use. Always
 * go through this instead of importing the default export directly when you
 * need to actually run commands, since the client isn't connected until
 * `connect()` has been called at least once.
 */
export async function getRedis() {
  if (!redis.isOpen) await redis.connect();
  return redis;
}

/** The raw (possibly not-yet-connected) Redis client instance. */
export default redis;
