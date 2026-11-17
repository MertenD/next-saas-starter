# Demo: AI Chat

**Route:** `/demo/ai` · **Feature module:** `src/features/demo/ai/`

## What this demonstrates

Streaming an LLM response into the UI, and specifically **resumable streams**: if the connection drops mid-response (like when the user uses a phone and the connection is lost for a moment), the client reconnects and picks the exact same stream back up server-side instead of losing the reply or starting over. The chat `id` is stored in `sessionStorage` (`model/chat-session.ts`, together with the messages), so it stays the same across page refreshes and a refresh mid-response resumes the stream. The "New chat" button clears it and creates a new id. Storage is cleared on sign-out (`useSignOut`).

## Key files

| File | Role |
|---|---|
| `model/ai-chat.ts` | `AI_SYSTEM_PROMPT` constant |
| `schema/ai-chat-schema.ts` | `chatRequestSchema` - validates the `/api/chat` request body |
| `server/chat.ts` | `startChatStream()`, `resumeChatStream()` - plain functions called by the route handlers below (raw streaming responses aren't tRPC-compatible, so this feature uses Route Handlers instead of a `server/router.ts` tRPC router) |
| `model/chat-session.ts` | `sessionStorage` helpers: load/save/clear the chat (id + messages), `countTurns()` |
| `hooks/use-ai-chat.ts` | Creates the `Chat` instance from a stored session, wraps `useChat`, mirrors messages to storage when not mid-stream |
| `components/ai-chat.tsx` | Chat container - loads the session after mount, header bar with chat id and "New chat" button, remounts per chat id |
| `components/chat-messages.tsx` | Claude/ChatGPT-style thread: centered column, user messages in a soft right-aligned bubble, assistant answers as plain text (no bubble, no avatar), a single pulsing dot until the first token, empty and error states |
| `components/chat-input.tsx` | Rounded composer: borderless auto-growing textarea (max 6 rows) + round send button; Enter sends on desktop, inserts a newline on mobile |
| `src/app/api/chat/route.ts` | POST - starts a new streamed response |
| `src/app/api/chat/[id]/stream/route.ts` | GET `?turn=N` - resumes the stream of that chat turn |
| `src/app/api/chat/[id]/stop/route.ts` | POST `?turn=N` - aborts the model generation of that turn (`stopChatStream()`) |
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
   })
   ```

2. `useChat({ chat, resume: true })` - the `resume: true` flag is what makes the hook automatically attempt to reconnect to an in-flight stream on mount, instead of only ever starting fresh ones.

3. Sending a message `POST`s to `/api/chat`, which requires a signed-in user (`getSessionOnServer()`, otherwise `401`), validates the body against `chatRequestSchema` (`400` when invalid) and calls `startChatStream(userId, body)` (`server/chat.ts`), which in turn calls `streamText()` from the `ai` package against OpenRouter:

   ```ts
   const result = streamText({ model: openrouter(AI_MODEL), system: AI_SYSTEM_PROMPT, messages: convertToModelMessages(messages) });
   ```

4. Instead of returning `result.textStream` straight to the client, `startChatStream()` wraps it: `getStreamContext().createNewResumableStream(id, () => result.textStream)`. `getStreamContext()` is backed by the `resumable-stream` package, which persists stream chunks (in Redis) keyed by user id, `chatId` and turn (the number of user messages, so a second question in the same chat never replays the first answer) as they're produced (so only the user who started a stream can resume it) - not just buffered in the Node process, which would be lost on disconnect.

5. If the client reconnects (page refresh mid-response, dropped connection), `useChat`'s `resume: true` fires a `GET /api/chat/[id]/stream?turn=N` (also authenticated), which calls `resumeChatStream(userId, id, turn)` (`server/chat.ts`), itself wrapping `ctx.resumeExistingStream(key)`. If the stream is still buffered server-side, playback continues from where it left off; if it already finished or never existed, the route returns `204` and the client just shows what it already has.

## Stop button

While an answer is generating, the send button turns into a stop button (like ChatGPT and Claude.ai). `useAiChat().stop` does two things: `useChat`'s `stop()` aborts the client request, and `POST /api/chat/[id]/stop?turn=N` aborts the model on the server through an `AbortController` kept in an in-memory map (`activeTurns` in `server/chat.ts`). The server call is needed because the resumable stream intentionally keeps generating after a disconnect (so a refresh can resume it), which means a client abort alone would let the model run on in the background. The partial answer stays in the thread and is sent to the model as context with the next message, so the user can simply keep chatting; "New chat" starts a fresh id. The map is per server instance, so with several instances the stop request must reach the instance that started the stream (or use a Redis flag instead).

## Markdown rendering

Assistant messages are rendered with `MarkdownContent` (`src/components/markdown-content.tsx`) so lists, code blocks and tables from the model show up formatted, and `AI_SYSTEM_PROMPT` (`model/ai-chat.ts`) asks the model to use Markdown. User messages stay plain text. Partial Markdown while streaming (for example an unclosed code fence) renders as plain text until the closing token arrives.

## Try it

Open `/demo/ai`, send a message, and refresh the page while it's still streaming - the response keeps going instead of restarting or disappearing.

## Requirements

- `OPENROUTER_API_KEY` - without it, the page shows a warning card (checked server-side via `env.OPENROUTER_API_KEY`) instead of rendering the chat and failing at request time.
- `REDIS_URL` reachable - the resumable-stream backing store needs it, on top of the OpenRouter key.

## Related docs

- [Integrations](../integrations.md#ai-openrouter) - the `streamText`/`openrouter` usage pattern outside this demo
- [Environment Variables](../environment-variables.md) - `OPENROUTER_API_KEY`, `AI_MODEL`, `REDIS_URL`
