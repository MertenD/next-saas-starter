/** Header that carries the request id from `src/proxy.ts` to the app and back to the client. */
export const REQUEST_ID_HEADER = "x-request-id"

/** Accepted shape of an id set by a reverse proxy or load balancer in front of the app. */
const VALID_REQUEST_ID = /^[A-Za-z0-9._:-]{8,128}$/

/**
 * Returns the incoming request id if it looks harmless, otherwise a new UUID.
 * The format check keeps clients from writing arbitrary or huge values into
 * the logs. Free of Node-only imports. Used by `src/proxy.ts`, the route
 * wrapper (`src/lib/logging/request-logging.ts`) and the tRPC logging middleware.
 */
export function resolveRequestId(incoming: string | null | undefined) {
  return incoming && VALID_REQUEST_ID.test(incoming)
    ? incoming
    : crypto.randomUUID()
}
