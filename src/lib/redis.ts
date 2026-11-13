import { createClient } from "redis"
import { env } from "@/config/env"

// Same global-caching trick as `src/lib/db.ts`: avoids creating a new Redis
// client (and TCP connection) on every dev hot reload.
const globalForRedis = global as unknown as {
  redis: ReturnType<typeof createClient>
}

/**
 * Creates the Redis client with an `error` listener attached. Without a
 * listener, node-redis emits an unhandled `error` event on connection loss,
 * which crashes the process; with one, the client logs and reconnects.
 */
function createRedisClient() {
  const client = createClient({ url: env.REDIS_URL })
  client.on("error", (error) => {
    console.error("[redis] client error:", error)
  })
  return client
}

const redis = globalForRedis.redis || createRedisClient()

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis
}

/**
 * Returns the shared Redis client, connecting it lazily on first use. Always
 * go through this instead of importing the default export directly when you
 * need to actually run commands, since the client isn't connected until
 * `connect()` has been called at least once.
 */
export async function getRedis() {
  if (!redis.isOpen) await redis.connect()
  return redis
}

/** The raw (possibly not-yet-connected) Redis client instance. */
export default redis
