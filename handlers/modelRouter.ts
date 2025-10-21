// content/modelRouter.ts
import { Storage } from "@plasmohq/storage"

import {
  askWithSession as apiAsk,
  suggestRefactor as apiRefactor,
  reviewCode as apiReview,
  checkSecurity as apiSecurity,
  generateTests as apiTests
} from "./geminiHandlers"
import {
  askWithSession as localAsk,
  answerAi as localRefactor,
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
export async function askWithSessionSmart(
  question: string,
  context?: string
): Promise<string> {
  const mode = await getApiMode()
  return mode === "local"
    ? localAsk(question, context)
    : apiAsk(question, context)
}

export async function reviewCodeSmart(text: string): Promise<string> {
  const mode = await getApiMode()
  console.log("Mode on Review", mode)
  return mode === "local" ? localReview(text) : apiReview(text)
}

export async function answerAiSmart(text: string): Promise<string> {
  const mode = await getApiMode()
  return mode === "local" ? localRefactor(text) : apiRefactor(text)
}

export async function checkSecuritySmart(text: string): Promise<string> {
  const mode = await getApiMode()
  return mode === "local" ? localSecurity(text) : apiSecurity(text)
}

export async function generateTestsSmart(text: string): Promise<string> {
  const mode = await getApiMode()
  return mode === "local" ? localTests(text) : apiTests(text)
}
