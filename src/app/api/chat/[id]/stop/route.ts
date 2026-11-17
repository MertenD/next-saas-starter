import { stopChatStream } from "@/features/demo/ai/server/chat"
import { getSessionOnServer } from "@/lib/auth-utils"

export async function POST(
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
  return Response.json({ stopped: stopChatStream(session.user.id, id, turn) })
}
