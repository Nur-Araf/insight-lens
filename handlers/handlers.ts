// All handler functions for the action buttons.
// Uses Chrome built-in Gemini Nano via the Prompt API — no external API calls needed.

/**
 * Send notification to notify.tsx via background.ts
 */
function notify(message: string, sound?: "start" | "success" | "error") {
  chrome.runtime.sendMessage({
    type: "SHOW_NOTIFICATION",
    payload: { message, sound }
  })
}

// --- Performance Optimizations ---
class ResponseCache {
  private cache = new Map<string, { response: string; timestamp: number }>()
  private ttl = 5 * 60 * 1000 // 5 minutes

  get(key: string): string | null {
    const item = this.cache.get(key)
    if (item && Date.now() - item.timestamp < this.ttl) {
      return item.response
    }
    return null
  }

  set(key: string, response: string): void {
    this.cache.set(key, { response, timestamp: Date.now() })
  }

  generateKey(prompt: string, context?: string): string {
    // Simple key generator; consider a fast hash for very long strings
    return `${prompt.substring(0, 50)}-${context ? context.length : "no-context"}`
  }
}

class RequestQueue {
  private queue: Array<{
    prompt: string
    resolve: (value: string) => void
    reject: (reason?: any) => void
  }> = []
  private processing = false

  async add(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.queue.push({ prompt, resolve, reject })
      this.processNext()
    })
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) return
    this.processing = true

    const { prompt, resolve, reject } = this.queue.shift()!
    try {
      if (!codeAssistantSession) {
        await initCodeAssistantSession()
      }
      const response = await codeAssistantSession.prompt(prompt)
      resolve(response)
    } catch (err) {
      reject(err)
    } finally {
      this.processing = false
      this.processNext()
    }
  }
}

const responseCache = new ResponseCache()
const requestQueue = new RequestQueue()

// --- Optimized Prompts ---
const OPTIMIZED_PROMPTS = {
  review: "Brief code review focusing on critical issues:",
  refactor: "Suggest key refactors (max 3):",
  explain: "Explain concisely:",
  tests: "Generate essential test cases:",
  security: "Check major security risks:"
}

// --- Core Session Logic ---
let codeAssistantSession: any = null
let sessionInitializationPromise: Promise<void> | null = null

// 🔹 Create the main Gemini session once — used by all features
export async function initCodeAssistantSession() {
  // Prevent multiple simultaneous initializations
  if (sessionInitializationPromise) {
    return sessionInitializationPromise
  }

  sessionInitializationPromise = (async () => {
    try {
      if (codeAssistantSession) {
        console.log("Gemini session already active.")
        return
      }

      codeAssistantSession = await createSession(
        "You are an AI coding assistant who answers code-related questions clearly and concisely. Explain reasoning and give short examples when useful."
      )

      console.log("✅ Code Assistant session initialized.")
    } catch (err: any) {
      console.error("❌ Failed to init session:", err)
      sessionInitializationPromise = null // Reset on failure to allow retry
      throw err
    }
  })()

  return sessionInitializationPromise
}

/**
 * Utility to create a LanguageModel session with a custom system prompt.
 */
async function createSession(systemPrompt: string) {
  const LM = (globalThis as any).LanguageModel ?? (window as any).LanguageModel
  if (!LM)
    throw new Error("Built-in Gemini Nano (LanguageModel) not available.")

  const availability = await LM.availability()
  if (availability === "unavailable")
    throw new Error("Gemini Nano is unavailable on this device.")

  const session = await LM.create({
    expectedInputs: [{ type: "text", languages: ["en"] }],
    expectedOutputs: [{ type: "text", languages: ["en"] }],
    initialPrompts: [{ role: "system", content: systemPrompt }],
    monitor(m: any) {
      m.addEventListener?.("downloadprogress", (e: any) =>
        console.log("Model download progress:", e?.loaded)
      )
    }
  })
  return session
}

// --- Optimized Handler Functions ---

/**
 * Ask a question using the main (persistent) session
 */
export async function askWithSession(
  question: string,
  codeContext?: string
): Promise<string> {
  // 1. Check Cache First
  const cacheKey = responseCache.generateKey(question, codeContext)
  const cachedResponse = responseCache.get(cacheKey)
  if (cachedResponse) {
    notify("Answer received from Gemini.", "success")
    return cachedResponse
  }

  notify("Asking Gemini...", "start")

  // 2. Use optimized prompt
  const optimizedContext = codeContext?.substring(0, 1500) // Limit input size
  const prompt = optimizedContext?.trim()
    ? `Context:\n\`\`\`\n${optimizedContext}\n\`\`\`\n\nQuestion: ${question}`
    : question

  // 3. Use Queued Request
  try {
    const res = await requestQueue.add(prompt)
    // 4. Cache result
    responseCache.set(cacheKey, res)
    notify("Answer received from Gemini.", "success")
    return res
  } catch (err: any) {
    notify("Failed to get response from Gemini.", "error")
    return `askWithSession error: ${err?.message ?? err}`
  }
}

/**
 * Review code - Optimized version
 */
export async function reviewCode(text: string): Promise<string> {
  const cacheKey = responseCache.generateKey("review", text)
  const cached = responseCache.get(cacheKey)
  if (cached) {
    notify("Code review completed!", "success")
    return cached
  }

  notify("Gemini is reviewing your code...", "start")
  try {
    const optimizedText = text.substring(0, 2000) // Limit input size
    const prompt = `${OPTIMIZED_PROMPTS.review}\n\n\`\`\`\n${optimizedText}\n\`\`\`\nKeep response under 300 chars.`

    const res = await requestQueue.add(prompt)
    responseCache.set(cacheKey, res)
    notify("Code review completed!", "success")
    return res
  } catch (err: any) {
    notify("Code review failed.", "error")
    return `reviewCode error: ${err.message || err}`
  }
}

// 🔁 Apply the same optimization pattern to other functions:
// suggestRefactor, ask, generateTests, checkSecurity

/**
 * Suggest code refactor - Optimized version
 */
export async function suggestRefactor(text: string): Promise<string> {
  const cacheKey = responseCache.generateKey("refactor", text)
  const cached = responseCache.get(cacheKey)
  if (cached) {
    notify("Refactor suggestions ready!", "success")
    return cached
  }

  notify("Gemini is analyzing refactor opportunities...", "start")
  try {
    const optimizedText = text.substring(0, 2000)
    const prompt = `${OPTIMIZED_PROMPTS.refactor}\n\n\`\`\`\n${optimizedText}\n\`\`\`\nKeep response under 300 chars.`

    const res = await requestQueue.add(prompt)
    responseCache.set(cacheKey, res)
    notify("Refactor suggestions ready!", "success")
    return res
  } catch (err: any) {
    notify("Refactor suggestion failed.", "error")
    return `suggestRefactor error: ${err.message || err}`
  }
}

/**
 * Ask about code (simple explain)
 */
export async function ask(text: string, question?: string): Promise<string> {
  const cacheKey = responseCache.generateKey("explain", text)
  const cached = responseCache.get(cacheKey)
  if (cached) {
    notify("Explanation ready!", "success")
    return cached
  }

  notify("Gemini is analyzing your code...", "start")
  try {
    if (!codeAssistantSession) await initCodeAssistantSession()
    const q = question || "Explain what this code does and its purpose."
    const prompt = `${q}\n\nCode:\n\`\`\`\n${text}\n\`\`\`\n`
    const res = await codeAssistantSession.prompt(prompt)
    notify("Explanation ready!", "success")
    return res
  } catch (err: any) {
    notify("Gemini failed to answer your question.", "error")
    return `ask error: ${err.message || err}`
  }
}

/**
 * Generate unit tests
 */
export async function generateTests(text: string): Promise<string> {
  const cacheKey = responseCache.generateKey("tests", text)
  const cached = responseCache.get(cacheKey)
  if (cached) {
    notify("Test generation completed!", "success")
    return cached
  }

  notify("Generating unit tests...", "start")
  try {
    if (!codeAssistantSession) await initCodeAssistantSession()
    const prompt = `Generate relevant unit tests for this code:\n\n\`\`\`\n${text}\n\`\`\`\n`
    const res = await codeAssistantSession.prompt(prompt)
    notify("Test generation completed!", "success")
    return res
  } catch (err: any) {
    notify("Test generation failed.", "error")
    return `generateTests error: ${err.message || err}`
  }
}

/**
 * Security review
 */
export async function checkSecurity(text: string): Promise<string> {
  const cacheKey = responseCache.generateKey("security", text)
  const cached = responseCache.get(cacheKey)
  if (cached) {
    notify("Security review completed!", "success")
    return cached
  }

  notify("Checking code for vulnerabilities...", "start")
  try {
    if (!codeAssistantSession) await initCodeAssistantSession()
    const prompt = `Perform a security review of this code:\n\n\`\`\`\n${text}\n\`\`\`\n`
    const res = await codeAssistantSession.prompt(prompt)
    notify("Security review completed!", "success")
    return res
  } catch (err: any) {
    notify("Security review failed.", "error")
    return `checkSecurity error: ${err.message || err}`
  }
}
