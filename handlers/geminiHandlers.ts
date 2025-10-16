// handlers/geminiHandlers.ts

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
export async function callGemini(
  type: "ask" | "review" | "refactor" | "security" | "test",
  text: string,
  context?: string
): Promise<string> {
  const prompt = getPrompt(type)

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: "fetchGeminiResponse",
        type,
        text,
        context,
        prompt
      },
      (res) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else if (!res?.success) {
          reject(new Error(res?.error || "Gemini request failed"))
        } else {
          notify("Answer received from Gemini.", "success")
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
    case "refactor":
      return "Refactor the following code for clarity, performance, and maintainability:"
    case "security":
      return "Analyze this code for potential security vulnerabilities and suggest improvements:"
    case "test":
      return "Generate relevant unit tests for this code:"
    case "ask":
    default:
      return "Answer this general programming-related question:"
  }
}

// Convenience wrappers
export const askWithSession = (q: string, ctx?: string) =>
  callGemini("ask", q, ctx)
export const reviewCode = (code: string) => callGemini("review", code)
export const suggestRefactor = (code: string) => callGemini("refactor", code)
export const checkSecurity = (code: string) => callGemini("security", code)
export const generateTests = (code: string) => callGemini("test", code)
