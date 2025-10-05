// content/handlers.ts
// All handler functions for the action buttons.
// Replace the stubs with real API calls later.

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function summarize(text: string): Promise<string> {
  // Simulate latency
  await delay(600)
  // Simple stub: return first 3 lines or 200 chars summary
  const summary = text.length > 200 ? text.slice(0, 200).trim() + "…" : text
  return `Summary:\n${summary}`
}

export async function translate(text: string): Promise<string> {
  await delay(700)
  // Stub: pretend it's translated (in real use call translator)
  return `Translated (stub):\n${text}`
}

export async function rewrite(text: string): Promise<string> {
  await delay(650)
  // Simple rewrite stub: uppercase first sentence (example)
  const firstSentence = text.split(/[.?!]\s/)[0] || text
  return `Rewritten (stub):\n${firstSentence.trim()} — (rewritten)`
}

export async function proofread(text: string): Promise<string> {
  await delay(650)
  // Stub: return original plus note
  return `Proofread (stub):\n${text}\n\n[No major errors found (stub)]`
}

export async function ask(text: string, question?: string): Promise<string> {
  await delay(800)
  // Stub: answer the "ask" request
  return `Ask result (stub):\nYou asked about: "${(question || "quick ask").slice(0, 60)}"\nContext: ${text.slice(0, 200)}…`
}
