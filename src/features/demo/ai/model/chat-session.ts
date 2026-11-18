import { generateId, type UIMessage } from "ai"
import { clearLiveChat } from "@/features/demo/ai/model/live-chat"

/** `sessionStorage` key holding the current chat (id + messages) of this tab. */
const STORAGE_KEY = "ai-chat-session"

export type ChatSession = {
  id: string
  messages: UIMessage[]
}

/** Creates an empty chat with a fresh id (the "New chat" action). */
export function createChatSession(): ChatSession {
  return { id: generateId(), messages: [] }
}

/**
 * Reads the chat of this tab from `sessionStorage`, or starts a new one. The
 * id therefore survives a page refresh, which is what lets the demo resume an
 * in-flight stream from Redis. Client-only: call it after mount.
 */
export function loadChatSession(): ChatSession {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "id" in parsed &&
        typeof parsed.id === "string" &&
        "messages" in parsed &&
        Array.isArray(parsed.messages)
      ) {
        return { id: parsed.id, messages: parsed.messages as UIMessage[] }
      }
    }
  } catch {
    // storage unavailable or corrupt JSON: fall through to a new chat
  }
  return createChatSession()
}

/** Persists the chat of this tab; ignores quota or privacy-mode errors. */
export function saveChatSession(session: ChatSession) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // not critical, the chat just will not survive a refresh
  }
}

/**
 * Removes the stored chat and forgets the live `Chat` object (see
 * `model/live-chat.ts`). Called on "New chat" and on sign-out, so the next user
 * of this tab starts clean.
 */
export function clearChatSession() {
  clearLiveChat()
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // nothing to clear
  }
}
