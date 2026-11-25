import { type NextRequest, NextResponse } from "next/server"
import { REQUEST_ID_HEADER, resolveRequestId } from "@/lib/logging/request-id"

/**
 * Gives every request an id: forwarded to the app as a request header (read by
 * the loggers, see `src/lib/logging/logger.ts`) and returned as a response header, so
 * a user's bug report can be matched with the server logs. Does nothing else,
 * in particular no auth: pages and procedures guard themselves.
 */
export function proxy(request: NextRequest) {
  const requestId = resolveRequestId(request.headers.get(REQUEST_ID_HEADER))

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(REQUEST_ID_HEADER, requestId)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set(REQUEST_ID_HEADER, requestId)
  return response
}

export const config = {
  // Static assets need no id. `monitoring` is the Sentry tunnel route.
  matcher: [
    "/((?!_next/static|_next/image|monitoring|favicon.ico|sw.js|logos/).*)",
  ],
}
