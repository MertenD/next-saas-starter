# Demo: AI Chat

**Route:** `/demo/ai` · **Feature module:** `src/features/demo/ai/`

## What this demonstrates

Streaming an LLM response into the UI, and specifically **resumable streams**: if the connection drops or the page gets refreshed mid-response, the client reconnects and picks the exact same stream back up server-side instead of losing the reply or starting over.

## Key files

| File | Role |
|---|---|
| `src/features/demo/ai/components/ai-chat.tsx` | Chat UI, `useChat` wiring |
| `src/app/api/chat/route.ts` | POST - starts a new streamed response |
| `src/app/api/chat/[id]/stream/route.ts` | GET - resumes an existing stream by id |
| `src/lib/ai.ts` | OpenRouter provider client, `AI_MODEL` |
| `src/lib/stream-context.ts` | Resumable-stream context (backed by Redis) |
| `src/app/(dashboard)/demo/ai/page.tsx` | Page - missing-API-key handling |

## How it works

1. The client creates a `Chat` instance (`@ai-sdk/react`) with a `TextStreamChatTransport` pointed at `/api/chat`, plus a `prepareReconnectToStreamRequest` pointed at `/api/chat/${id}/stream`:

   ```tsx
   new Chat({
     id: generateId(),
     transport: new TextStreamChatTransport({
       api: "/api/chat",
       prepareReconnectToStreamRequest: ({ id }) => ({ api: `/api/chat/${id}/stream` }),
     }),
   });
   ```

2. `useChat({ chat, resume: true })` - the `resume: true` flag is what makes the hook automatically attempt to reconnect to an in-flight stream on mount, instead of only ever starting fresh ones.

3. Sending a message `POST`s to `/api/chat`, which calls `streamText()` from the `ai` package against OpenRouter:

   ```ts
   const result = streamText({ model: openrouter(AI_MODEL), messages: convertToModelMessages(messages) });
   ```

4. Instead of returning `result.textStream` straight to the client, the route wraps it: `getStreamContext().createNewResumableStream(chatId, () => result.textStream)`. `getStreamContext()` is backed by the `resumable-stream` package, which persists stream chunks (in Redis) keyed by `chatId` as they're produced - not just buffered in the Node process, which would be lost on disconnect.

5. If the client reconnects (page refresh mid-response, dropped connection), `useChat`'s `resume: true` fires a `GET /api/chat/[id]/stream`, which calls `ctx.resumeExistingStream(chatId)`. If the stream is still buffered server-side, playback continues from where it left off; if it already finished or never existed, the route returns `204` and the client just shows what it already has.

## Try it

Open `/demo/ai`, send a message, and refresh the page while it's still streaming - the response keeps going instead of restarting or disappearing.

## Requirements

- `OPENROUTER_API_KEY` - without it, the page shows a warning card (checked server-side via `env.OPENROUTER_API_KEY`) instead of rendering the chat and failing at request time.
- `REDIS_URL` reachable - the resumable-stream backing store needs it, on top of the OpenRouter key.

## Related docs

- [Integrations](../integrations.md#ai-openrouter) - the `streamText`/`openrouter` usage pattern outside this demo
- [Environment Variables](../environment-variables.md) - `OPENROUTER_API_KEY`, `AI_MODEL`, `REDIS_URL`
