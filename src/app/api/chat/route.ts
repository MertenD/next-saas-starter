import { env } from "@/config/env"
import { chatRequestSchema } from "@/features/demo/ai/schema/ai-chat-schema"
import { startChatStream } from "@/features/demo/ai/server/chat"
import { getSessionOnServer } from "@/lib/auth-utils"
import { setLogUserId } from "@/lib/logging/context"
import { withRequestLogging } from "@/lib/logging/request-logging"

export const maxDuration = 30

export const POST = withRequestLogging(async (req: Request) => {
  const session = await getSessionOnServer()
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  setLogUserId(session.user.id)

  if (!env.OPENROUTER_API_KEY) {
    return Response.json(
      { error: "OPENROUTER_API_KEY is not configured." },
      { status: 503 },
    )
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = chatRequestSchema.safeParse(json)
  if (!parsed.success) {
    return Response.json({ error: "Invalid chat request." }, { status: 400 })
  }

  const stream = await startChatStream(session.user.id, parsed.data)

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
})
