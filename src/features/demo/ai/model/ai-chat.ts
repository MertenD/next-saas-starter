export const AI_SYSTEM_PROMPT =
  "You are a helpful assistant built into a SaaS starter template. Be concise and friendly. Format answers with Markdown where it helps (lists, code blocks, tables)."

/**
 * Error code in the body of the `410` response of `GET /api/chat/[id]/stream`
 * when the answer was being generated but its server process is gone (restart,
 * deploy, crash). The chat UI looks for it in the error message to show a
 * friendly text instead of the raw response.
 */
export const STREAM_INTERRUPTED_CODE = "stream_interrupted"
