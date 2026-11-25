import { isPolarEnabled, polarClient } from "@/lib/polar"
import { getRedis } from "@/lib/redis"

/** Whether an error from the Polar SDK is an HTTP 404 (e.g. no customer exists for this user). */
export function isPolarNotFound(error: unknown) {
  return (
    error instanceof Error && "statusCode" in error && error.statusCode === 404
  )
}

/**
 * Deletes the user's Polar customer. Polar cancels the customer's active
 * subscriptions immediately and revokes their benefits when it does this, and
 * it does NOT refund anything automatically. A missing customer (404) is fine,
 * any other failure is thrown so the caller can abort the local deletion:
 * better to keep the account than to leave a customer that is still billed
 * without a local account. Does nothing when Polar is not configured.
 *
 * Used by the account deletion flow (`beforeDelete` in `src/lib/auth.ts`) and
 * by the admin "delete user" action (`src/features/admin/server/router.ts`).
 */
export async function deletePolarCustomer(userId: string) {
  if (!isPolarEnabled || !polarClient) return

  try {
    await polarClient.customers.deleteExternal({ externalId: userId })
  } catch (error) {
    if (isPolarNotFound(error)) return
    throw error
  }
}

/**
 * Removes the user's temporary data from Redis: the resumable AI chat streams
 * (their chunks contain the conversation) and the pointers to them. These keys
 * expire by themselves after 24 hours, this just does not wait for that.
 * Best effort: a Redis problem (or Redis taking longer than 3 seconds, the
 * client would otherwise retry forever) is logged and never blocks a deletion.
 */
export async function deleteUserRedisData(userId: string) {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Redis timed out")), 3000).unref?.()
  })

  try {
    await Promise.race([removeRedisKeys(userId), timeout])
  } catch (error) {
    console.error("Error deleting the user's Redis data:", error)
  }
}

/** Scans for every key that contains the user id and deletes them. */
async function removeRedisKeys(userId: string) {
  const redis = await getRedis()
  const keys: string[] = []

  for await (const batch of redis.scanIterator({
    MATCH: `*${userId}*`,
    COUNT: 200,
  })) {
    keys.push(...(Array.isArray(batch) ? batch : [batch]))
  }

  if (keys.length > 0) await redis.del(keys)
}
