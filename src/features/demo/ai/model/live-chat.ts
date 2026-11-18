import type { Chat } from "@ai-sdk/react"
import type { UIMessage } from "ai"
import type { ChatSession } from "@/features/demo/ai/model/chat-session"

export type LiveChat = {
  chat: Chat<UIMessage>
  /** Whether the one-time check for a running response was already made for this chat. */
  resumeTried: boolean
}

/**
 * The `Chat` of the conversation that is currently open, kept outside of React
 * so it survives navigation inside the app. When the user opens another page
 * while an answer is generated, the component is destroyed, but this object
 * keeps receiving the stream. Coming back reuses it and shows the current state
 * right away, like ChatGPT does. Creating a new `Chat` from `sessionStorage`
 * on every visit instead would leave several of them alive at once, each
 * consuming the same stream and each writing its own snapshot to
 * `sessionStorage`; whichever wrote last won, which could leave the finished
 * answer out of the stored conversation. A page reload resets this module, then
 * the chat is rebuilt from `sessionStorage` and resumed from Redis.
 */
let liveChat: LiveChat | undefined

/**
 * Returns the live chat for `session`. When the id differs from the current
 * one (first visit, or after "New chat"), `createChat` builds a new one and the
 * previous one is dropped. Used by `useAiChat`.
 */
export function getLiveChat(
  session: ChatSession,
  createChat: (session: ChatSession) => Chat<UIMessage>,
): LiveChat {
  if (liveChat?.chat.id === session.id) return liveChat
  liveChat = { chat: createChat(session), resumeTried: false }
  return liveChat
}

/**
 * Forgets the live chat, so no conversation stays in memory. Called by
 * `clearChatSession()` (new chat, sign-out).
 */
export function clearLiveChat() {
  liveChat = undefined
}
