// content/modelRouter.ts
import { Storage } from "@plasmohq/storage"

import {
  answerAi as apiAnswer,
  askWithSession as apiAsk,
  reviewCode as apiReview,
  checkSecurity as apiSecurity,
  generateTests as apiTests
} from "./geminiHandlers"
import {
  answerAi as localAnswer,
  askWithSession as localAsk,
  reviewCode as localReview,
  checkSecurity as localSecurity,
  generateTests as localTests
} from "./handlers"

const storage = new Storage()

// --- Helper: determine which model is active ---
async function getApiMode(): Promise<"local" | "gemini"> {
  try {
    const mode = (await storage.get("apiMode")) as string
    console.log("Model", mode)
    return mode === "gemini" ? "gemini" : "local"
  } catch {
    return "local"
  }
}

// --- Smart router functions ---
// NOTE: all functions accept an optional conversationId which is forwarded to the
// Gemini (api) path. Local handlers are left unchanged (we call them with their original args).
export async function askWithSessionSmart(
  question: string,
  context?: string,
  conversationId?: string
): Promise<string> {
  const mode = await getApiMode()
  return mode === "local"
    ? localAsk(question, context)
    : apiAsk(question, context, conversationId)
}

export async function reviewCodeSmart(
  text: string,
  conversationId?: string
): Promise<string> {
  const mode = await getApiMode()
  console.log("Mode on Review", mode)
  return mode === "local" ? localReview(text) : apiReview(text, conversationId)
}

export async function answerAiSmart(
  text: string,
  conversationId?: string
): Promise<string> {
  const mode = await getApiMode()
  return mode === "local" ? localAnswer(text) : apiAnswer(text, conversationId)
}

export async function checkSecuritySmart(
  text: string,
  conversationId?: string
): Promise<string> {
  const mode = await getApiMode()
  return mode === "local"
    ? localSecurity(text)
    : apiSecurity(text, conversationId)
}

export async function generateTestsSmart(
  text: string,
  conversationId?: string
): Promise<string> {
  const mode = await getApiMode()
  return mode === "local" ? localTests(text) : apiTests(text, conversationId)
}
