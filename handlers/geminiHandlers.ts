// handlers/geminiHandlers.ts

import { getRecentHistory } from "~components/helpers/conversationManager"

function notify(message: string, sound?: "start" | "success" | "error") {
  try {
    chrome.runtime.sendMessage({
      type: "SHOW_NOTIFICATION",
      payload: { message, sound }
    })
  } catch (e) {
    console.log("notify:", message, sound, e)
  }
}

/**
 * callGemini
 * - type: one of "ask" | "review" | "answer" | "security" | "explain"
 * - text: the main payload (question or code)
 * - context: optional additional context (e.g., full code block or user-supplied context)
 * - conversationId: optional conversation id to include recent history
 */
export async function callGemini(
  type: "ask" | "review" | "answer" | "security" | "explain",
  text: string,
  context?: string,
  conversationId?: string
): Promise<string> {
  // Build the base instruction
  const basePrompt = getPrompt(type)

  // Fetch recent history (if conversationId provided)
  let historyText = ""
  try {
    if (conversationId) {
      const hist = getRecentHistory(conversationId, 12) // last 12 messages
      if (hist && hist.length) {
        historyText = hist
          .map((m: any) => {
            const role = m.role ? String(m.role).toUpperCase() : "MSG"
            const content =
              typeof m.content === "string"
                ? m.content
                : String(m.content || "")
            return `${role}:\n${content}`
          })
          .join("\n\n")
      }
    }
  } catch (err) {
    console.warn("[InsightLens] failed to fetch conversation history:", err)
    historyText = ""
  }

  // Compose final prompt
  let composed = `${basePrompt}\n\n`
  if (historyText) {
    composed += `Conversation history (most recent last):\n${historyText}\n\n`
  }
  if (context) {
    composed += `Context:\n${context}\n\n`
  }

  // Distinguish between code-heavy and general prompts
  if (type === "review" || type === "security" || type === "explain") {
    composed += `Code to analyze:\n\`\`\`\n${text}\n\`\`\`\n`
  } else {
    composed += `Input:\n\`\`\`\n${text}\n\`\`\`\n`
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: "fetchGeminiResponse",
        type,
        text,
        context,
        conversationId,
        prompt: composed
      },
      (res) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else if (!res?.success) {
          reject(new Error(res?.error || "InsightLens request failed"))
        } else {
          notify("Answer received from InsightLens.", "success")
          resolve(res.data)
        }
      }
    )
  })
}

function getPrompt(type: string): string {
  switch (type) {
    case "review":
      return "Please review the following code and provide concise feedback:"
    case "answer":
      return "Provide a clear, helpful, and accurate answer to the following question or code problem. If it's code, explain what it does and offer corrections or improvements if needed:"
    case "security":
      return "Analyze this code for potential security vulnerabilities and suggest improvements:"
    case "explain":
      return "Explain this code in detail — include purpose, logic flow, and what each part does in context:"
    case "ask":
    default:
      return "Answer this general programming-related question:"
  }
}

// --- Convenience wrappers ---
export const askWithSession = (
  q: string,
  ctx?: string,
  conversationId?: string
) => callGemini("ask", q, ctx, conversationId)

export const reviewCode = (code: string, conversationId?: string) =>
  callGemini("review", code, undefined, conversationId)

export const answerAi = (code: string, conversationId?: string) =>
  callGemini("answer", code, undefined, conversationId)

export const checkSecurity = (code: string, conversationId?: string) =>
  callGemini("security", code, undefined, conversationId)

export const generateExplain = (code: string, conversationId?: string) =>
  callGemini("explain", code, undefined, conversationId)
