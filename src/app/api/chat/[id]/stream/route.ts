import { resumeChatStream } from "@/features/demo/ai/server/chat";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const stream = await resumeChatStream(id);

  if (stream === null || stream === undefined) {
    return new Response(null, { status: 204 });
  }

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
