// content/handlers.ts
// All handler functions for the action buttons.
// Uses Chrome built-in Gemini Nano via the Prompt API — no external API calls needed.

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
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
    // Create a new LM session with a helpful system prompt
    const session = await createSession(
      "You are an AI coding assistant who answers code-related questions clearly and concisely, " +
        "explaining reasoning and giving short examples when useful."
    )

    // Seed the session with the selected code as context (so follow-ups refer to it)
    // We do a prompt but ignore the returned text — it's just to store context in the session.
    await session.prompt(
      `Context (for future questions):\n\`\`\`\n${code}\n\`\`\``
    )

    return session
  } catch (err: any) {
    throw new Error(`createCodeSession error: ${err?.message ?? err}`)
  }
}

/**
 * Ask a question using an existing session (keeps conversation history).
 * `question` should be a short user query about the previously-seeded code.
 */
export async function askWithSession(
  session: any,
  question: string
): Promise<string> {
  try {
    if (!session) throw new Error("No session provided to askWithSession")
    return await session.prompt(question)
  } catch (err: any) {
    return `askWithSession error: ${err?.message ?? err}`
  }
}

/**
 * Review code (already working)
 */
export async function reviewCode(text: string): Promise<string> {
  try {
    const session = await createSession(
      "You are an expert senior software engineer. Provide a clear, concise code review: list bugs, performance, and style issues, and suggest improvements."
    )

    const prompt = `Please review this code:\n\n\`\`\`\n${text}\n\`\`\`\n`
    return await session.prompt(prompt)
  } catch (err: any) {
    return `reviewCode error: ${err.message || err}`
  }
}

/**
 * Suggest code refactor — provide cleaner structure, naming, or performance ideas.
 */
export async function suggestRefactor(text: string): Promise<string> {
  try {
    const session = await createSession(
      "You are an expert software architect. Suggest clean, maintainable, and efficient refactor ideas for the following code. Provide short examples where useful."
    )

    const prompt = `Suggest refactor and optimization improvements for this code:\n\n\`\`\`\n${text}\n\`\`\`\n`
    return await session.prompt(prompt)
  } catch (err: any) {
    return `suggestRefactor error: ${err.message || err}`
  }
}

/**
 * Ask a question about the selected code.
 */
export async function ask(text: string, question?: string): Promise<string> {
  try {
    const session = await createSession(
      "You are an AI coding assistant who answers code-related questions clearly and concisely, explaining reasoning and giving examples when relevant."
    )

    const q = question || "Explain what this code does and its purpose."
    const prompt = `${q}\n\nCode:\n\`\`\`\n${text}\n\`\`\`\n`
    return await session.prompt(prompt)
  } catch (err: any) {
    return `ask error: ${err.message || err}`
  }
}

/**
 * Generate unit tests for the provided code.
 */
export async function generateTests(text: string): Promise<string> {
  try {
    const session = await createSession(
      "You are an expert QA engineer and test writer. Write simple, maintainable unit tests for given code using Jest syntax (or generic test format)."
    )

    const prompt = `Generate relevant unit tests for this code:\n\n\`\`\`\n${text}\n\`\`\`\n`
    return await session.prompt(prompt)
  } catch (err: any) {
    return `generateTests error: ${err.message || err}`
  }
}

/**
 * Check for security vulnerabilities or risky patterns.
 */
export async function checkSecurity(text: string): Promise<string> {
  try {
    const session = await createSession(
      "You are a security analyst specializing in application code audits. Find security vulnerabilities, unsafe code, or potential exploits. Suggest safer alternatives briefly."
    )

    const prompt = `Perform a security review of this code:\n\n\`\`\`\n${text}\n\`\`\`\n`
    return await session.prompt(prompt)
  } catch (err: any) {
    return `checkSecurity error: ${err.message || err}`
  }
}
