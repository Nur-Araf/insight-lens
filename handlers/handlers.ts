// content/handlers.ts
// All handler functions for the action buttons.
// Replace the stubs with real API calls later.

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function checkSecurity(text: string): Promise<string> {
  return `checkSecurity`
}

export async function generateTests(text: string): Promise<string> {
  await delay(700)
  // Stub: pretend it's translated (in real use call translator)
  return `generateTests`
}

export async function reviewCode(text: string): Promise<string> {
  await delay(650)
  // Simple rewrite stub: uppercase first sentence (example)
  const firstSentence = text.split(/[.?!]\s/)[0] || text
  return `reviewCode`
}

export async function suggestRefactor(text: string): Promise<string> {
  await delay(650)
  // Stub: return original plus note
  return `suggestRefactor`
}

export async function ask(text: string, question?: string): Promise<string> {
  await delay(800)
  // Stub: answer the "ask" request
  return `Ask result (stub):\nYou asked about: "${(question || "quick ask").slice(0, 60)}"\nContext: ${text.slice(0, 200)}…`
}
