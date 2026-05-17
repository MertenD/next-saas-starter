import { convertToModelMessages, streamText } from "ai";
import { env } from "@/config/env";
import { AI_MODEL, openrouter } from "@/lib/ai";
import { getStreamContext } from "@/lib/stream-context";

export const maxDuration = 30;

export async function POST(req: Request) {
  if (!env.OPENROUTER_API_KEY) {
    return Response.json(
      { error: "OPENROUTER_API_KEY is not configured." },
      { status: 503 },
    );
  }

  const { messages, id: chatId } = await req.json();

  const result = streamText({
    model: openrouter(AI_MODEL),
    system:
      "You are a helpful assistant built into a SaaS starter template. Be concise and friendly.",
    messages: convertToModelMessages(messages),
  });

  const ctx = getStreamContext();
  const stream = await ctx.createNewResumableStream(
    chatId,
    () => result.textStream,
  );

  return new Response(stream ?? result.textStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
