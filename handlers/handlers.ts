// filename: codeAssistant.ts
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

// --- Notification helper ---
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

// --- Gemini session management ---
let codeAssistantSession: any = null
let sessionInitializationPromise: Promise<void> | null = null

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

export async function initCodeAssistantSession() {
  if (sessionInitializationPromise) return sessionInitializationPromise

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
      sessionInitializationPromise = null
      throw err
    }
  })()

  return sessionInitializationPromise
}

// --- Response cache (mode aware) ---
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

  generateKey(promptId: string, promptText: string, mode: string): string {
    const snippet = (promptText || "").substring(0, 120)
    return `${mode}:${promptId}:${snippet}`
  }

  clear() {
    this.cache.clear()
  }
}

// --- RequestQueue (serializes model calls) ---
class RequestQueue {
  private queue: Array<{
    prompt: string
    resolve: (value: string) => void
    reject: (reason?: any) => void
  }> = []
  private processing = false

  add(prompt: string): Promise<string> {
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
      if (codeAssistantSession?.prompt) {
        const response = await codeAssistantSession.prompt(prompt)
        resolve(response)
      } else {
        const transient = await createSession(
          "Transient assistant for single request."
        )
        const response = await transient.prompt(prompt)
        resolve(response)
      }
    } catch (err) {
      reject(err)
    } finally {
      this.processing = false
      this.processNext()
    }
  }
}

// --- instantiate and export ---
export const responseCache = new ResponseCache()
export const requestQueue = new RequestQueue()

// --- responseStyle helpers ---
// NOTE: do NOT cache responseStyle in-memory permanently. Always read current storage state.
export async function getResponseStyle(): Promise<"short" | "long"> {
  try {
    const s = (await storage.get("responseStyle")) as string | null
    console.log("Response type", s)
    return s === "detailed" ? "long" : "short"
  } catch (e) {
    return "short"
  }
}

/**
 * setResponseStyle(mode)
 * - writes storage
 * - clears the response cache to avoid accidental reuse of old-mode answers
 * - returns the written value
 */
export async function setResponseStyle(
  mode: "short" | "long"
): Promise<"short" | "long"> {
  try {
    await storage.set("responseStyle", mode)
  } catch (e) {
    console.warn("Failed to set responseStyle in storage:", e)
  }
  // Defensive: clear cached responses so UI gets fresh results immediately after toggle
  responseCache.clear()
  return mode
}

// --- Prompt templates for both modes (same as before) ---
const PROMPT_TEMPLATES: Record<
  string,
  { short: (payload: string) => string; long: (payload: string) => string }
> = {
  review: {
    short: (code) =>
      `Brief code review — top 3 critical issues only. Keep it concise (<=3 bullets).\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    long: (code) =>
      `Detailed code review. Use Markdown headings: 
## Summary — one-line
## Findings — numbered list with severity (P0/P1/P2)
## Fixes — include code patches or suggested changes (fenced code blocks)
## Tests — suggested unit tests
## Impact & Alternatives — tradeoffs, performance, and risks.

Code:
\`\`\`
${code}
\`\`\`
Please be thorough (300-800 words), include at least one code example and a minimal patch.`
  },

  refactor: {
    short: (code) =>
      `Top 3 refactor suggestions (short bullets). For each suggestion include the benefit. Code:\n\`\`\`\n${code}\n\`\`\``,
    long: (code) =>
      `Full refactor plan. Use headings:
## Goal
## Suggested changes — step-by-step with small code snippets
## Migration plan — incremental steps and tests
## Benchmarks & complexity
Include precise code snippets, explain tradeoffs, and give a small refactor patch.

Code:
\`\`\`
${code}
\`\`\``
  },

  explain: {
    short: (code) =>
      `Explain concisely what this does in 2-3 short sentences.\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    long: (code) =>
      `Explain thoroughly. Use headings:
## TL;DR (one line)
## Line-by-line explanation
## Purpose & contexts
## Edge cases & failure modes
## Example usage (fenced code)
Keep it structured and include at least one example and recommended improvements.

Code:
\`\`\`
${code}
\`\`\``
  },

  tests: {
    short: (code) =>
      `Generate 3 essential unit tests (titles + short description). Code:\n\`\`\`\n${code}\n\`\`\``,
    long: (code) =>
      `Generate comprehensive unit tests. Provide:
1) a table of test cases (name, input, expected)
2) ready-to-run test code (Jest or preferred)
3) mocks/stubs and edge-case tests
Place test code in fenced blocks.

Code:
\`\`\`
${code}
\`\`\``
  },

  security: {
    short: (code) =>
      `Top 3 security issues and a one-line remediation each. Code:\n\`\`\`\n${code}\n\`\`\``,
    long: (code) =>
      `Perform a security review. Use headings:
## Summary
## Vulnerabilities (detailed) — CWE-like explanation & severity
## Exact fix (code snippet) for each vulnerability
## Tests & verification steps
## Residual risks & mitigations
Return fenced code blocks and a short checklist to verify.

Code:
\`\`\`
${code}
\`\`\``
  }
}

// --- build prompt by action & mode ---
async function buildPrompt(action: string, payload: string) {
  const mode = await getResponseStyle()
  const tpl = PROMPT_TEMPLATES[action]
  if (!tpl) {
    return mode === "long"
      ? `Provide a detailed answer (Markdown, examples). Input:\n\`\`\`\n${payload}\n\`\`\``
      : `Provide a brief answer. Input:\n\`\`\`\n${payload}\n\`\`\``
  }
  return mode === "long" ? tpl.long(payload) : tpl.short(payload)
}

// --- Public API functions (mode-aware, cache-aware) ---
export async function askWithSession(
  question: string,
  codeContext?: string
): Promise<string> {
  const mode = await getResponseStyle()
  const promptText = codeContext
    ? `Context:\n\`\`\`\n${codeContext}\n\`\`\`\n\nQuestion: ${question}`
    : question
  const cacheKey = responseCache.generateKey("ask", promptText, mode)
  const cached = responseCache.get(cacheKey)
  if (cached) {
    notify("Answer received from Gemini (cache).", "success")
    return cached
  }

  notify("Asking Gemini...", "start")
  try {
    const prompt = await buildPrompt("explain", promptText)
    const res = await requestQueue.add(prompt)
    responseCache.set(cacheKey, res)
    notify("Answer received from Gemini.", "success")
    return res
  } catch (err: any) {
    notify("Failed to get response from Gemini.", "error")
    return `askWithSession error: ${err?.message ?? err}`
  }
}

export async function reviewCode(text: string): Promise<string> {
  const mode = await getResponseStyle()
  const cacheKey = responseCache.generateKey("review", text, mode)
  const cached = responseCache.get(cacheKey)
  if (cached) {
    notify("Code review completed!", "success")
    return cached
  }

  notify("Gemini is reviewing your code...", "start")
  try {
    const optimizedText = text.substring(0, 3000)
    const prompt = await buildPrompt("review", optimizedText)
    const res = await requestQueue.add(prompt)
    responseCache.set(cacheKey, res)
    notify("Code review completed!", "success")
    return res
  } catch (err: any) {
    notify("Code review failed.", "error")
    return `reviewCode error: ${err.message || err}`
  }
}

export async function suggestRefactor(text: string): Promise<string> {
  const mode = await getResponseStyle()
  const cacheKey = responseCache.generateKey("refactor", text, mode)
  const cached = responseCache.get(cacheKey)
  if (cached) {
    notify("Refactor suggestions ready!", "success")
    return cached
  }

  notify("Gemini is analyzing refactor opportunities...", "start")
  try {
    const prompt = await buildPrompt("refactor", text.substring(0, 3000))
    const res = await requestQueue.add(prompt)
    responseCache.set(cacheKey, res)
    notify("Refactor suggestions ready!", "success")
    return res
  } catch (err: any) {
    notify("Refactor suggestion failed.", "error")
    return `suggestRefactor error: ${err.message || err}`
  }
}

export async function ask(text: string, question?: string): Promise<string> {
  const mode = await getResponseStyle()
  const cacheKey = responseCache.generateKey(
    "explain",
    text + (question || ""),
    mode
  )
  const cached = responseCache.get(cacheKey)
  if (cached) {
    notify("Explanation ready!", "success")
    return cached
  }

  notify("Gemini is analyzing your code...", "start")
  try {
    if (!codeAssistantSession) await initCodeAssistantSession()
    const q = question || "Explain what this code does and its purpose."
    const prompt = await buildPrompt(
      "explain",
      `${q}\n\nCode:\n\`\`\`\n${text}\n\`\`\``
    )
    const res = await requestQueue.add(prompt)
    responseCache.set(cacheKey, res)
    notify("Explanation ready!", "success")
    return res
  } catch (err: any) {
    notify("Gemini failed to answer your question.", "error")
    return `ask error: ${err.message || err}`
  }
}

export async function generateTests(text: string): Promise<string> {
  const mode = await getResponseStyle()
  const cacheKey = responseCache.generateKey("tests", text, mode)
  const cached = responseCache.get(cacheKey)
  if (cached) {
    notify("Test generation completed!", "success")
    return cached
  }

  notify("Generating unit tests...", "start")
  try {
    if (!codeAssistantSession) await initCodeAssistantSession()
    const prompt = await buildPrompt(
      "tests",
      `Generate relevant unit tests for this code:\n\n\`\`\`\n${text}\n\`\`\``
    )
    const res = await requestQueue.add(prompt)
    responseCache.set(cacheKey, res)
    notify("Test generation completed!", "success")
    return res
  } catch (err: any) {
    notify("Test generation failed.", "error")
    return `generateTests error: ${err.message || err}`
  }
}

export async function checkSecurity(text: string): Promise<string> {
  const mode = await getResponseStyle()
  const cacheKey = responseCache.generateKey("security", text, mode)
  const cached = responseCache.get(cacheKey)
  if (cached) {
    notify("Security review completed!", "success")
    return cached
  }

  notify("Checking code for vulnerabilities...", "start")
  try {
    if (!codeAssistantSession) await initCodeAssistantSession()
    const prompt = await buildPrompt(
      "security",
      `Perform a security review of this code:\n\n\`\`\`\n${text}\n\`\`\``
    )
    const res = await requestQueue.add(prompt)
    responseCache.set(cacheKey, res)
    notify("Security review completed!", "success")
    return res
  } catch (err: any) {
    notify("Security review failed.", "error")
    return `checkSecurity error: ${err.message || err}`
  }
}

// Utility to forcibly clear cache
export function clearResponseCache() {
  responseCache.clear()
}
