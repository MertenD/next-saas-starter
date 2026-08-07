import { createResumableStreamContext } from "resumable-stream";

// Lazily created and cached at module scope so the AI chat streaming routes
// (`src/app/api/chat/**`) reuse a single context per server instance instead
// of reconnecting to the resumable-stream backend on every request.
let streamContext: ReturnType<typeof createResumableStreamContext> | undefined;

/**
 * Returns the shared resumable-stream context used to make AI chat
 * responses resumable across client reconnects (e.g. a page refresh mid-
 * stream). See the `demo/ai` feature's chat route for usage.
 */
export function getStreamContext() {
  if (!streamContext) {
    streamContext = createResumableStreamContext({ waitUntil: null });
  }
  return streamContext;
}
