# Demo: AI Chat

**Route:** `/demo/ai` · **Feature module:** `src/features/demo/ai/`

## What this demonstrates

Streaming an LLM response into the UI, and specifically **resumable streams**: if the connection drops mid-response (like when the user uses a phone and the connection is lost for a moment), the client reconnects and picks the exact same stream back up server-side instead of losing the reply or starting over. The chat `id` is stored in `sessionStorage` (`model/chat-session.ts`, together with the messages), so it stays the same across page refreshes and a refresh mid-response resumes the stream. The "New chat" button clears it and creates a new id. Storage is cleared on sign-out (`useSignOut`).

## Key files

| File | Role |
|---|---|
| `model/ai-chat.ts` | `AI_SYSTEM_PROMPT`, `STREAM_INTERRUPTED_CODE` (error code of the `410` response when a stream is orphaned) |
| `schema/ai-chat-schema.ts` | `chatRequestSchema` - validates the `/api/chat` request body; `chatIdSchema` - bounds the chat id, also used by the `stream` and `stop` routes |
| `server/chat.ts` | `startChatStream()`, `resumeChatStream()`, `stopChatStream()` - plain functions called by the route handlers below (raw streaming responses aren't tRPC-compatible, so this feature uses Route Handlers instead of a `server/router.ts` tRPC router) |
| `model/chat-session.ts` | `sessionStorage` helpers: load/save/clear the chat (id + messages); `clearChatSession()` also forgets the live chat |
| `model/live-chat.ts` | `getLiveChat()` / `clearLiveChat()` - keeps the `Chat` of the open conversation outside of React, so it survives navigation |
| `hooks/use-ai-chat.ts` | Builds the `Chat` for a stored session, wraps `useChat`, resumes a running answer once, mirrors messages to storage when not mid-stream |
| `hooks/use-page-leaving.ts` | Tells whether the page is going away (reload, closing the tab), so the chat neither saves a cut-off answer nor flashes an error |
| `components/ai-chat.tsx` | Chat container - loads the session after mount, header bar with chat id and "New chat" button, remounts per chat id |
| `components/chat-messages.tsx` | Claude/ChatGPT-style thread: centered column, a single pulsing dot until the first token, smart scrolling with a scroll-to-bottom button, empty state with suggestion chips, error state with a retry button, `aria-live` log |
| `components/message-row.tsx` | One message: user messages in a soft right-aligned bubble (copy + inline edit), assistant answers as plain text (copy + regenerate) |
| `components/chat-input.tsx` | Rounded composer: borderless auto-growing textarea (max 6 rows) + round send/stop button; Enter sends on desktop, inserts a newline on mobile; keeps focus after send and stop; ArrowUp in the empty field edits the last message |
| `src/app/api/chat/route.ts` | POST - starts a new streamed response |
| `src/app/api/chat/[id]/stream/route.ts` | GET - resumes the newest generation attempt of the chat |
| `src/app/api/chat/[id]/stop/route.ts` | POST - aborts the running model generation of the chat (`stopChatStream()`) |
| `src/lib/ai.ts` | OpenRouter provider client, `AI_MODEL` |
| `src/lib/stream-context.ts` | Resumable-stream context (backed by Redis) |
| `src/app/(dashboard)/demo/ai/page.tsx` | Page - missing-API-key handling |

## How it works

1. The client creates a `Chat` instance (`@ai-sdk/react`) with a `TextStreamChatTransport` pointed at `/api/chat`, plus a `prepareReconnectToStreamRequest` pointed at `/api/chat/${id}/stream`:

   ```tsx
   new Chat({
     id, // the chat id from sessionStorage
     messages, // the stored conversation
     transport: new TextStreamChatTransport({
       api: "/api/chat",
       prepareReconnectToStreamRequest: ({ id }) => ({ api: `/api/chat/${id}/stream` }),
     }),
   })
   ```

2. On mount the hook calls `chat.resumeStream()` once per chat to reconnect to an in-flight stream, and only when the stored conversation ends with an unanswered question. It deliberately does not use `useChat({ resume: true })`: that option reconnects from an effect on mount, which can run twice (React strict mode mounts everything twice in development), and every reconnect request adds its own assistant message. Skipping the request for chats without an open question also avoids a flash of the "generating" state.

   While the page is going away (reload, closing the tab) nothing is saved to `sessionStorage` and errors are hidden (`hooks/use-page-leaving.ts`). The aborted fetch would otherwise store the half answer, and after the refresh a regenerate would send it back to the model as a prefix to continue; it would also flash a "network error" with the retry button until the page is gone.

3. Sending a message `POST`s to `/api/chat`, which requires a signed-in user (`getSessionOnServer()`, otherwise `401`), validates the body against `chatRequestSchema` (`400` when invalid) and calls `startChatStream(userId, body)` (`server/chat.ts`), which in turn calls `streamText()` from the `ai` package against OpenRouter:

   ```ts
   const result = streamText({ model: openrouter(AI_MODEL), system: AI_SYSTEM_PROMPT, messages: convertToModelMessages(messages) });
   ```

4. Instead of returning `result.textStream` straight to the client, `startChatStream()` wraps it: `getStreamContext().createNewResumableStream(streamKey(userId, id, attemptId), () => result.textStream)`. `getStreamContext()` is backed by the `resumable-stream` package, which persists the chunks in Redis as they are produced, not just in the Node process, which would lose them on disconnect.

   The key combines the user id (so only the user who started a stream can resume it), the chat id and a fresh attempt id per generation. The attempt id keeps a second question, a regenerate or a retry from replaying an older stream. The newest attempt id of each chat is stored in Redis, which is how the resume route finds the stream.

5. If the client reconnects (page refresh mid-response, dropped connection), the mount-time `resumeStream()` fires a `GET /api/chat/[id]/stream` (also authenticated), which calls `resumeChatStream(userId, id)` (`server/chat.ts`): it reads the chat's newest attempt id from Redis and wraps `ctx.resumeExistingStream(key)`. If the stream is still buffered server-side, playback continues from where it left off; if it already finished or never existed, the route returns `204` and the client just shows what it already has. If Redis still marks the stream as running but the server that generated it is gone (restart, deploy, crash), `resumable-stream` fails with `Timeout waiting for ack` after about a second; the route turns that into a `410` with the code `STREAM_INTERRUPTED_CODE` (`model/ai-chat.ts`), and the chat shows a friendly message with the retry button, which generates the answer anew. The marker in Redis stays until its TTL (24 hours) runs out.

## Leaving the page while an answer is generated

Opening another page (client-side navigation) destroys the chat component, but the answer is still being generated and streamed. So the `Chat` object lives outside of React: `getLiveChat()` in `model/live-chat.ts` keeps the `Chat` of the open conversation in a module variable. Coming back reuses it, shows the current state immediately and keeps streaming into it, with no resume request. A reload resets the module; then the chat is rebuilt from `sessionStorage` and resumed from Redis (see "How it works"). `clearChatSession()` drops it on "New chat" and on sign-out.

Why one shared object and not a fresh `Chat` per visit: every fresh one would consume the same stream, and each would write its own snapshot to `sessionStorage` (the mounted one a shortened conversation while streaming, the ones left behind the finished conversation). Whoever wrote last won, so a visit like chat, posts, chat, posts, chat could end with the question but not the answer stored. With a single object there is one writer.

`onFinish` of that `Chat` also saves the finished conversation, because while the user is on another page no component is mounted to do it, and a reload or closing the tab in that time would otherwise lose the answer. It skips aborted, disconnected and failed runs (stop, page unload, network error), which `useAiChat` handles while it is mounted.

## Stop button

While an answer is generating, the send button turns into a stop button (like ChatGPT and Claude.ai). `useAiChat().stop` does two things: `useChat`'s `stop()` aborts the client request, and `POST /api/chat/[id]/stop` aborts the model on the server through an `AbortController` kept in an in-memory map (`activeGenerations` in `server/chat.ts`). The server call is needed because the resumable stream intentionally keeps generating after a disconnect (so a refresh can resume it), which means a client abort alone would let the model run on in the background. The partial answer stays in the thread and is sent to the model as context with the next message, so the user can simply keep chatting; "New chat" starts a fresh id. The map is per server instance, so with several instances the stop request must reach the instance that started the stream (or use a Redis flag instead).

## Message actions, retry and scrolling

- **Copy** (assistant and user messages) uses the shared `CopyButton`.
- **Regenerate** (`regenerate({ messageId })`) drops that answer and everything after it and asks the model again.
- **Edit** (`sendMessage({ text, messageId })`) replaces a user message in place, drops everything after it and asks again. Start it with the pencil button or ArrowUp in the empty composer; Escape cancels.
- **Retry** is the button in the error state (`regenerate()` on the thread as it is).
- Every generation attempt (question, regenerate, edit, retry) gets its own Redis stream key, so a regenerate always produces a completely new answer instead of replaying the old, partly generated stream. Starting a new attempt aborts a still-running one of the same chat.
- **Smart scroll:** the view follows the stream only while the user is within 80px of the bottom; scrolling up stops it and shows a scroll-to-bottom button, and sending a message always jumps down.
- **Suggestion chips** in the empty chat send a prompt on click.

## Markdown rendering

Assistant messages are rendered with `MarkdownContent` (`src/components/markdown-content.tsx`) so lists, code blocks and tables from the model show up formatted, and `AI_SYSTEM_PROMPT` (`model/ai-chat.ts`) asks the model to use Markdown. User messages stay plain text. Fenced code blocks are syntax-highlighted with `rehype-highlight` (token colors live in `globals.css`, built only from existing design tokens) and have a language label and a copy button. Partial Markdown while streaming (for example an unclosed code fence) renders as plain text until the closing token arrives.

## Try it

Open `/demo/ai`, send a message, and refresh the page while it's still streaming - the response keeps going instead of restarting or disappearing.

## Requirements

- `OPENROUTER_API_KEY` - without it, the page shows a warning card (checked server-side via `env.OPENROUTER_API_KEY`) instead of rendering the chat and failing at request time.
- `REDIS_URL` reachable - the resumable-stream backing store needs it, on top of the OpenRouter key.

## Related docs

- [Integrations](../integrations.md#ai-openrouter) - the `streamText`/`openrouter` usage pattern outside this demo
- [Environment Variables](../environment-variables.md) - `OPENROUTER_API_KEY`, `AI_MODEL`, `REDIS_URL`
