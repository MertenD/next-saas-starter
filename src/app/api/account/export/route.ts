import { buildUserDataExport } from "@/features/privacy/server/export"
import { getSessionOnServer } from "@/lib/auth-utils"
import { setLogUserId } from "@/lib/logging/context"
import { withRequestLogging } from "@/lib/logging/request-logging"

/**
 * Downloads all personal data of the signed-in user as a JSON file (GDPR Art.
 * 15 and 20). Only ever returns the caller's own data: the user id comes from
 * the session, never from the request.
 */
export const GET = withRequestLogging(async () => {
  const session = await getSessionOnServer()
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  setLogUserId(session.user.id)

  const data = await buildUserDataExport(session.user.id)
  if (!data) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const day = new Date().toISOString().slice(0, 10)
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="my-data-${day}.json"`,
      // Personal data: no shared or browser caches
      "Cache-Control": "no-store",
    },
  })
})
