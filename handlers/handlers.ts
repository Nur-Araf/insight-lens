// content/Localhandlers.ts
import { Storage } from "@plasmohq/storage"

import { getRecentHistory } from "~components/helpers/conversationManager"

const storage = new Storage()

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

// --- Gemini session management (per-conversation) ---
const DEFAULT_SYSTEM_PROMPT =
  "You are an AI coding assistant who answers code-related questions clearly and concisely. Explain reasoning and give short examples when useful."

let globalSession: any = null
let globalInitPromise: Promise<void> | null = null

const conversationSessions = new Map<string, any>()
const conversationInitPromises = new Map<string, Promise<void>>()

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

// initialize or reuse a global session (backwards-compatible)
export async function initCodeAssistantSession() {
  if (globalInitPromise) return globalInitPromise

  globalInitPromise = (async () => {
    try {
      if (globalSession) {
        console.log("Gemini session already active (global).")
        return
      }
      globalSession = await createSession(DEFAULT_SYSTEM_PROMPT)
      console.log("✅ Global Code Assistant session initialized.")
    } catch (err: any) {
      console.error("❌ Failed to init global session:", err)
      globalInitPromise = null
      throw err
    }
  })()

  return globalInitPromise
}

// initialize or reuse a session for a specific conversationId
export async function initSessionForConversation(
  conversationId: string,
  systemPrompt?: string
) {
  if (!conversationId) return initCodeAssistantSession()
  if (conversationSessions.has(conversationId)) return
  if (conversationInitPromises.has(conversationId))
    return conversationInitPromises.get(conversationId)

  const p = (async () => {
    try {
      const prompt = systemPrompt || DEFAULT_SYSTEM_PROMPT
      const sess = await createSession(prompt)
      conversationSessions.set(conversationId, sess)
      console.log(`✅ Conversation session initialized: ${conversationId}`)
    } catch (err) {
      conversationInitPromises.delete(conversationId)
      throw err
    }
  })()

  conversationInitPromises.set(conversationId, p)
  return p
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

  generateKey(
    promptId: string,
    promptText: string,
    mode: string,
    conversationId?: string
  ): string {
    const snippet = (promptText || "").substring(0, 120)
    const conv = conversationId ? `conv:${conversationId}:` : ""
    return `${mode}:${conv}${promptId}:${snippet}`
  }

  clear() {
    this.cache.clear()
  }
}

// --- RequestQueue (per-conversation queues) ---
class SingleRequestQueue {
  private queue: Array<{
    prompt: string
    conversationId?: string
    resolve: (value: string) => void
    reject: (reason?: any) => void
  }> = []
  private processing = false

  add(prompt: string, conversationId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.queue.push({ prompt, conversationId, resolve, reject })
      this.processNext()
    })
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) return
    this.processing = true

    const { prompt, conversationId, resolve, reject } = this.queue.shift()!

    try {
      // Determine which session to use: per-conversation if available else global
      let sessionToUse: any = null

      if (conversationId) {
        if (!conversationSessions.has(conversationId)) {
          // try to init the conversation session; if it fails, fallback to global
          try {
            await initSessionForConversation(conversationId)
          } catch (e) {
            console.warn(
              "[InsightLens] failed to init conversation session, falling back to global:",
              e
            )
          }
        }
        sessionToUse = conversationSessions.get(conversationId)
      }

      if (!sessionToUse) {
        if (!globalSession) {
          await initCodeAssistantSession()
        }
        sessionToUse = globalSession
      }

      if (sessionToUse?.prompt) {
        const response = await sessionToUse.prompt(prompt)
        resolve(response)
      } else {
        // fallback: create a transient session for this single request
        const transient = await createSession(DEFAULT_SYSTEM_PROMPT)
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

// Manage queues keyed by conversationId (or 'global' key if no conversationId)
class QueueManager {
  private queues = new Map<string, SingleRequestQueue>()
  getQueue(conversationId?: string) {
    const key = conversationId || "__global__"
    if (!this.queues.has(key)) {
      this.queues.set(key, new SingleRequestQueue())
    }
    return this.queues.get(key)!
  }
}

export const queueManager = new QueueManager()

// --- instantiate and export ---
export const responseCache = new ResponseCache()

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

// --- Prompt templates for both modes ---
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
Please be thorough (300–800 words), include at least one code example and a minimal patch.`
  },

  answer: {
    short: (text) =>
      `Give a short and clear answer (2–4 sentences max).
Focus on the key point and avoid extra details.

Question or text:
\`\`\`
${text}
\`\`\``,
    long: (text) =>
      `Provide a detailed and helpful answer.
Use Markdown headings where relevant.
Include examples, explanations, and reasoning.
If the text is a question, answer it thoroughly; if it's a statement, expand on it with context and insights.
Keep it structured and easy to read.

Question or text:
\`\`\`
${text}
\`\`\``
  },

  explain: {
    short: (code) =>
      `Explain clearly what this code does in simple terms (2–3 sentences max).
Focus on functionality and intent, not restating syntax.

Code:
\`\`\`
${code}
\`\`\``,

    long: (code) =>
      `Provide a detailed and developer-friendly explanation of the following code.
Use Markdown headings and clear structure.

## TL;DR
Give a single-sentence summary of the code’s purpose.

## Step-by-step Explanation
Explain what happens in each key section or line group (not just paraphrasing — describe *why* it's written this way).

## Purpose & Context
Describe what kind of problem this code solves, where it would typically be used, and what its design choices imply.

## Potential Issues or Improvements
List any possible bugs, inefficiencies, or cleaner approaches.

## Example Usage
Show a short, runnable example or how another developer might use or extend this code.

Code:
\`\`\`
${code}
\`\`\`
Keep the tone educational, clear, and concise — like a senior engineer mentoring a junior developer.`
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

// --- build prompt by action & mode (now accepts conversationId to include history) ---
async function buildPrompt(
  action: string,
  payload: string,
  conversationId?: string
) {
  const mode = await getResponseStyle()
  const tpl = PROMPT_TEMPLATES[action]
  const base = tpl
    ? mode === "long"
      ? tpl.long(payload)
      : tpl.short(payload)
    : mode === "long"
      ? `Provide a detailed answer (Markdown, examples). Input:\n\`\`\`\n${payload}\n\`\`\``
      : `Provide a brief answer. Input:\n\`\`\`\n${payload}\n\`\`\``

  // If conversationId present, fetch recent history and prepend it in a clear block
  if (conversationId) {
    try {
      const hist = getRecentHistory(conversationId, 12)
      if (hist && hist.length) {
        const historyText = hist
          .map((m: any) => {
            const role = (m.role || "user").toUpperCase()
            const content =
              typeof m.content === "string"
                ? m.content
                : String(m.content || "")
            return `${role}:\n${content}`
          })
          .join("\n\n")
        return `Conversation history (most recent last):\n${historyText}\n\nInstruction:\n${base}`
      }
    } catch (err) {
      console.warn(
        "[InsightLens] buildPrompt: failed to include conversation history:",
        err
      )
      // fallback to base
    }
  }

  return base
}

// --- Public API functions (now accept optional conversationId) ---
export async function askWithSession(
  question: string,
  codeContext?: string,
  conversationId?: string
): Promise<string> {
  const mode = await getResponseStyle()
  const promptText = codeContext
    ? `Context:\n\`\`\`\n${codeContext}\n\`\`\`\n\nQuestion: ${question}`
    : question
  const cacheKey = responseCache.generateKey(
    "ask",
    promptText,
    mode,
    conversationId
  )
  const cached = responseCache.get(cacheKey)
  if (cached) {
    notify("Answer received from InsightLens (cache).", "success")
    return cached
  }

  notify("Asking InsightLens...", "start")
  try {
    const prompt = await buildPrompt("explain", promptText, conversationId)
    const res = await queueManager
      .getQueue(conversationId)
      .add(prompt, conversationId)
    responseCache.set(cacheKey, res)
    notify("Answer received from InsightLens.", "success")
    return res
  } catch (err: any) {
    notify("Failed to get response from InsightLens.", "error")
    return `askWithSession error: ${err?.message ?? err}`
  }
}

export async function reviewCode(
  text: string,
  conversationId?: string
): Promise<string> {
  const mode = await getResponseStyle()
  const cacheKey = responseCache.generateKey(
    "review",
    text,
    mode,
    conversationId
  )
  const cached = responseCache.get(cacheKey)
  if (cached) {
    notify("Code review completed!", "success")
    return cached
  }

  notify("InsightLens is reviewing your code...", "start")
  try {
    const optimizedText = text.substring(0, 3000)
    const prompt = await buildPrompt("review", optimizedText, conversationId)
    const res = await queueManager
      .getQueue(conversationId)
      .add(prompt, conversationId)
    responseCache.set(cacheKey, res)
    notify("Code review completed!", "success")
    return res
  } catch (err: any) {
    notify("Code review failed.", "error")
    return `reviewCode error: ${err.message || err}`
  }
}

export async function answerAi(
  text: string,
  conversationId?: string
): Promise<string> {
  const mode = await getResponseStyle()
  const cacheKey = responseCache.generateKey(
    "answer",
    text,
    mode,
    conversationId
  )
  const cached = responseCache.get(cacheKey)
  if (cached) {
    notify("Answer ready!", "success")
    return cached
  }

  notify("InsightLens is analyzing request...", "start")
  try {
    const prompt = await buildPrompt(
      "answer",
      text.substring(0, 3000),
      conversationId
    )
    const res = await queueManager
      .getQueue(conversationId)
      .add(prompt, conversationId)
    responseCache.set(cacheKey, res)
    notify("Answer ready!", "success")
    return res
  } catch (err: any) {
    notify("Answer failed.", "error")
    return `suggestRefactor error: ${err.message || err}`
  }
}

export async function ask(
  text: string,
  question?: string,
  conversationId?: string
): Promise<string> {
  const mode = await getResponseStyle()
  const cacheKey = responseCache.generateKey(
    "explain",
    text + (question || ""),
    mode,
    conversationId
  )
  const cached = responseCache.get(cacheKey)
  if (cached) {
    notify("Explanation ready!", "success")
    return cached
  }

  notify("InsightLens is analyzing your code...", "start")
  try {
    // Prefer to reuse a per-conversation session if available
    if (conversationId) {
      await initSessionForConversation(conversationId).catch(() => {}) // ignore init errors (will fallback)
    } else {
      if (!globalSession) await initCodeAssistantSession()
    }

    const q = question || "Explain what this code does and its purpose."
    const prompt = await buildPrompt(
      "explain",
      `${q}\n\nCode:\n\`\`\`\n${text}\n\`\`\``,
      conversationId
    )
    const res = await queueManager
      .getQueue(conversationId)
      .add(prompt, conversationId)
    responseCache.set(cacheKey, res)
    notify("Explanation ready!", "success")
    return res
  } catch (err: any) {
    notify("InsightLens failed to answer your question.", "error")
    return `ask error: ${err.message || err}`
  }
}

export async function generateExplain(
  text: string,
  conversationId?: string
): Promise<string> {
  const mode = await getResponseStyle()
  const cacheKey = responseCache.generateKey(
    "explain",
    text,
    mode,
    conversationId
  )
  const cached = responseCache.get(cacheKey)
  if (cached) {
    notify("Code explanation ready!", "success")
    return cached
  }

  notify("InsightLens is explaining your code...", "start")
  try {
    // Ensure correct session is initialized
    if (conversationId) {
      await initSessionForConversation(conversationId).catch(() => {})
    } else {
      if (!globalSession) await initCodeAssistantSession()
    }

    // Build a detailed explanation prompt
    const prompt = await buildPrompt(
      "explain",
      `Explain this code in detail:\n\n\`\`\`\n${text}\n\`\`\``,
      conversationId
    )

    const res = await queueManager
      .getQueue(conversationId)
      .add(prompt, conversationId)

    responseCache.set(cacheKey, res)
    notify("Code explanation ready!", "success")
    return res
  } catch (err: any) {
    notify("Code explanation failed.", "error")
    return `generateExplain error: ${err.message || err}`
  }
}

export async function checkSecurity(
  text: string,
  conversationId?: string
): Promise<string> {
  const mode = await getResponseStyle()
  const cacheKey = responseCache.generateKey(
    "security",
    text,
    mode,
    conversationId
  )
  const cached = responseCache.get(cacheKey)
  if (cached) {
    notify("Security review completed!", "success")
    return cached
  }

  notify("Checking code for vulnerabilities...", "start")
  try {
    if (conversationId) {
      await initSessionForConversation(conversationId).catch(() => {})
    } else {
      if (!globalSession) await initCodeAssistantSession()
    }

    const prompt = await buildPrompt(
      "security",
      `Perform a security review of this code:\n\n\`\`\`\n${text}\n\`\`\``,
      conversationId
    )
    const res = await queueManager
      .getQueue(conversationId)
      .add(prompt, conversationId)
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
