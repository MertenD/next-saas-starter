import { resumeChatStream } from "@/features/demo/ai/server/chat"
import { getSessionOnServer } from "@/lib/auth-utils"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionOnServer()
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const stream = await resumeChatStream(session.user.id, id)

  if (stream === null || stream === undefined) {
    return new Response(null, { status: 204 })
  }

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
