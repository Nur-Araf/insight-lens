// content/conversationManager.ts
type Role = "system" | "user" | "assistant"
export type Message = { id: string; role: Role; content: string; ts: number }

const conversationHistories = new Map<string, Message[]>()

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

export function startConversation(
  conversationId: string,
  systemPrompt?: string
) {
  if (!conversationId) conversationId = makeId()
  if (!conversationHistories.has(conversationId)) {
    const initial: Message[] = []
    if (systemPrompt)
      initial.push({
        id: makeId(),
        role: "system",
        content: systemPrompt,
        ts: Date.now()
      })
    conversationHistories.set(conversationId, initial)
  }
  return conversationId
}

export function addUserMessage(conversationId: string, content: string) {
  const m: Message = { id: makeId(), role: "user", content, ts: Date.now() }
  const hist = conversationHistories.get(conversationId) || []
  hist.push(m)
  conversationHistories.set(conversationId, hist)
  return m
}

export function addAssistantMessage(conversationId: string, content: string) {
  const m: Message = {
    id: makeId(),
    role: "assistant",
    content,
    ts: Date.now()
  }
  const hist = conversationHistories.get(conversationId) || []
  hist.push(m)
  conversationHistories.set(conversationId, hist)
  return m
}

export function getHistory(conversationId: string) {
  return conversationHistories.get(conversationId) || []
}

// simple trim to last N messages (could be token-based later)
export function getRecentHistory(conversationId: string, maxMessages = 8) {
  const h = getHistory(conversationId)
  if (h.length <= maxMessages) return h
  return h.slice(-maxMessages)
}

export function clearConversation(conversationId: string) {
  conversationHistories.delete(conversationId)
}
