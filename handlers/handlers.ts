// content/handlers.ts
// All handler functions for the action buttons.
// Uses Chrome built-in Gemini Nano via the Prompt API — no external API calls needed.

/**
 * Send notification event to notify.tsx via background.ts
 */
function notify(message: string, sound?: "start" | "success" | "error") {
  chrome.runtime.sendMessage({
    type: "SHOW_NOTIFICATION",
    payload: { message, sound }
  })
}

/**
 * Utility to create or reuse a LanguageModel session with a custom system prompt.
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

export async function createCodeSession(code: string) {
  try {
    const session = await createSession(
      "You are an AI coding assistant who answers code-related questions clearly and concisely, " +
        "explaining reasoning and giving short examples when useful."
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
 * Ask a question using an existing session (keeps conversation history).
 */
export async function askWithSession(
  session: any,
  question: string
): Promise<string> {
  try {
    if (!session) throw new Error("No session provided to askWithSession")
    notify("Asking Gemini...", "start")
    const res = await session.prompt(question)
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
    const session = await createSession(
      "You are an expert senior software engineer. Provide a clear, concise code review: list bugs, performance, and style issues, and suggest improvements."
    )

    const prompt = `Please review this code:\n\n\`\`\`\n${text}\n\`\`\`\n`
    const res = await session.prompt(prompt)
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
    const session = await createSession(
      "You are an expert software architect. Suggest clean, maintainable, and efficient refactor ideas for the following code. Provide short examples where useful."
    )

    const prompt = `Suggest refactor and optimization improvements for this code:\n\n\`\`\`\n${text}\n\`\`\`\n`
    const res = await session.prompt(prompt)
    notify("Refactor suggestions ready!", "success")
    return res
  } catch (err: any) {
    notify("Refactor suggestion failed.", "error")
    return `suggestRefactor error: ${err.message || err}`
  }
}

/**
 * Ask a question about code
 */
export async function ask(text: string, question?: string): Promise<string> {
  notify("Gemini is analyzing your code...", "start")
  try {
    const session = await createSession(
      "You are an AI coding assistant who answers code-related questions clearly and concisely, explaining reasoning and giving examples when relevant."
    )

    const q = question || "Explain what this code does and its purpose."
    const prompt = `${q}\n\nCode:\n\`\`\`\n${text}\n\`\`\`\n`
    const res = await session.prompt(prompt)
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
    const session = await createSession(
      "You are an expert QA engineer and test writer. Write simple, maintainable unit tests for given code using Jest syntax (or generic test format)."
    )

    const prompt = `Generate relevant unit tests for this code:\n\n\`\`\`\n${text}\n\`\`\`\n`
    const res = await session.prompt(prompt)
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
    const session = await createSession(
      "You are a security analyst specializing in application code audits. Find security vulnerabilities, unsafe code, or potential exploits. Suggest safer alternatives briefly."
    )

    const prompt = `Perform a security review of this code:\n\n\`\`\`\n${text}\n\`\`\`\n`
    const res = await session.prompt(prompt)
    notify("Security review completed!", "success")
    return res
  } catch (err: any) {
    notify("Security review failed.", "error")
    return `checkSecurity error: ${err.message || err}`
  }
}
