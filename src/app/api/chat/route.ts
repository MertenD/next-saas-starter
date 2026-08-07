import { env } from "@/config/env"
import { chatRequestSchema } from "@/features/demo/ai/schema/ai-chat-schema"
import { startChatStream } from "@/features/demo/ai/server/chat"

export const maxDuration = 30

export async function POST(req: Request) {
  if (!env.OPENROUTER_API_KEY) {
    return Response.json(
      { error: "OPENROUTER_API_KEY is not configured." },
      { status: 503 },
    )
  }

  const body = chatRequestSchema.parse(await req.json())
  const stream = await startChatStream(body)

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
