import { resumeChatStream } from "@/features/demo/ai/server/chat"
import { getSessionOnServer } from "@/lib/auth-utils"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionOnServer()
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const turn = Number(new URL(req.url).searchParams.get("turn"))
  if (!Number.isInteger(turn) || turn < 0) {
    return Response.json({ error: "Invalid turn." }, { status: 400 })
  }

  const { id } = await params
  const stream = await resumeChatStream(session.user.id, id, turn)

  if (stream === null || stream === undefined) {
    return new Response(null, { status: 204 })
  }

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
