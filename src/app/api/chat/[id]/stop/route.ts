import { chatIdSchema } from "@/features/demo/ai/schema/ai-chat-schema"
import { stopChatStream } from "@/features/demo/ai/server/chat"
import { getSessionOnServer } from "@/lib/auth-utils"
import { setLogUserId } from "@/lib/logging/context"
import { withRequestLogging } from "@/lib/logging/request-logging"

export const POST = withRequestLogging(
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

    return Response.json({
      stopped: stopChatStream(session.user.id, parsedId.data),
    })
  },
)
