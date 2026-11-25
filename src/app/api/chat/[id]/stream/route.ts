import { STREAM_INTERRUPTED_CODE } from "@/features/demo/ai/model/ai-chat"
import { chatIdSchema } from "@/features/demo/ai/schema/ai-chat-schema"
import { resumeChatStream } from "@/features/demo/ai/server/chat"
import { getSessionOnServer } from "@/lib/auth-utils"
import { setLogUserId } from "@/lib/logging/context"
import { withRequestLogging } from "@/lib/logging/request-logging"

export const GET = withRequestLogging(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const session = await getSessionOnServer()
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    setLogUserId(session.user.id)

    const parsedId = chatIdSchema.safeParse((await params).id)
    if (!parsedId.success) {
      return Response.json({ error: "Invalid chat id." }, { status: 400 })
    }
    const id = parsedId.data

    let stream: Awaited<ReturnType<typeof resumeChatStream>>
    try {
      stream = await resumeChatStream(session.user.id, id)
    } catch (error) {
      // Redis still marks the stream as running, but nothing answers for it any
      // more because the server that generated it restarted or crashed. Say so
      // explicitly instead of a bare 500, so the client can offer a retry. The
      // message is the one `resumable-stream` throws, check it after upgrading
      // that package.
      if (
        error instanceof Error &&
        error.message === "Timeout waiting for ack"
      ) {
        return Response.json(
          { error: STREAM_INTERRUPTED_CODE },
          { status: 410 },
        )
      }
      throw error
    }

    if (stream === null || stream === undefined) {
      return new Response(null, { status: 204 })
    }

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  },
)
