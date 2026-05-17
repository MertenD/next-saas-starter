import { getStreamContext } from "@/lib/stream-context";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: chatId } = await params;
  const ctx = getStreamContext();
  const stream = await ctx.resumeExistingStream(chatId);

  if (stream === null || stream === undefined) {
    return new Response(null, { status: 204 });
  }

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
