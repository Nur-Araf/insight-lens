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

let codeAssistantSession: any = null

// 🔹 Create the main Gemini session once — used by all features
export async function initCodeAssistantSession() {
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
  }
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

/**
 * Create a new code-specific session (used for isolated tasks)
 */
export async function createCodeSession(code: string) {
  try {
    const session = await createSession(
      "You are an AI coding assistant who answers code-related questions clearly and concisely, explaining reasoning and giving short examples when useful."
    )

    await session.prompt(
      `Context (for future questions):\n\`\`\`\n${code}\n\`\`\``
    )
    return session
  } catch (err: any) {
    notify("Gemini failed to create a code session.", "error")
    throw new Error(`createCodeSession error: ${err?.message ?? err}`)
  }
}

/**
 * Ask a question using the main (persistent) session
 */
export async function askWithSession(
  question: string,
  codeContext?: string
): Promise<string> {
  try {
    if (!codeAssistantSession) {
      console.warn("Session not ready, creating one on the fly...")
      await initCodeAssistantSession()
    }

    notify("Asking Gemini...", "start")

    const prompt = codeContext?.trim()
      ? `Context:\n\`\`\`\n${codeContext}\n\`\`\`\n\nQuestion: ${question}`
      : question

    const res = await codeAssistantSession.prompt(prompt)
    notify("Answer received from Gemini.", "success")
    return res
  } catch (err: any) {
    notify("Failed to get response from Gemini.", "error")
    return `askWithSession error: ${err?.message ?? err}`
  }
}

/**
 * Review code
 */
export async function reviewCode(text: string): Promise<string> {
  notify("Gemini is reviewing your code...", "start")
  try {
    if (!codeAssistantSession) await initCodeAssistantSession()
    const prompt = `Please review this code:\n\n\`\`\`\n${text}\n\`\`\`\n`
    const res = await codeAssistantSession.prompt(prompt)
    notify("Code review completed!", "success")
    return res
  } catch (err: any) {
    notify("Code review failed.", "error")
    return `reviewCode error: ${err.message || err}`
  }
}

/**
 * Suggest code refactor
 */
export async function suggestRefactor(text: string): Promise<string> {
  notify("Gemini is analyzing refactor opportunities...", "start")
  try {
    if (!codeAssistantSession) await initCodeAssistantSession()
    const prompt = `Suggest refactor and optimization improvements for this code:\n\n\`\`\`\n${text}\n\`\`\`\n`
    const res = await codeAssistantSession.prompt(prompt)
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
