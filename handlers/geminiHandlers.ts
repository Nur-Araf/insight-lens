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
 * - type: one of "ask" | "review" | "answer" | "security" | "test"
 * - text: the main payload (question or code)
 * - context: optional additional context (e.g., full code block or user-supplied context)
 * - conversationId: optional conversation id to include recent history
 */
export async function callGemini(
  type: "ask" | "review" | "answer" | "security" | "test",
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
      const hist = getRecentHistory(conversationId, 12) // last 12 messages (adjust as needed)
      if (hist && hist.length) {
        // Format history in a compact readable way
        historyText = hist
          .map((m: any) => {
            // guard roles/fields
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

  // Compose final prompt text carefully: include instruction, history, context, and the primary text.
  // We keep named sections so a downstream model handler can parse them better.
  let composed = `${basePrompt}\n\n`
  if (historyText) {
    composed += `Conversation history (most recent last):\n${historyText}\n\n`
  }

  if (context) {
    composed += `Context:\n${context}\n\n`
  }

  // Distinguish between code-heavy actions and generic text/questions
  if (type === "review" || type === "security" || type === "test") {
    composed += `Code to analyze:\n\`\`\`\n${text}\n\`\`\`\n`
  } else {
    // ask / answer generic
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
    case "test":
      return "Generate relevant unit tests for this code:"
    case "ask":
    default:
      return "Answer this general programming-related question:"
  }
}

// Convenience wrappers (each now accepts conversationId optional)
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
export const generateTests = (code: string, conversationId?: string) =>
  callGemini("test", code, undefined, conversationId)
