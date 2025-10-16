// content/api/codeAssistantAPI.ts
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

// You can store the key in Plasmo secret or local storage
// e.g., import.meta.env.PLASMO_PUBLIC_GEMINI_KEY
const GEMINI_API_KEY = "";

// Gemini model endpoint (v1)
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent"

// Core API call handler
async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Gemini API key not found. Please set it in storage or env."
    )
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    })
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini API error: ${response.status} ${errText}`)
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
  return text.trim()
}

// ------------- AI Function Wrappers -------------

export async function askWithSession(
  question: string,
  context?: string
): Promise<string> {
  const prompt = `You are an AI code assistant. Answer the following question clearly and concisely.
  
Context:
${context || "No extra context provided"}

Question:
${question}

Answer:`
  return callGemini(prompt)
}

export async function reviewCode(code: string): Promise<string> {
  console.log("We are on gemini review system")
  const prompt = `Review the following code and point out issues, potential improvements, and quality suggestions:\n\n${code}`
  return callGemini(prompt)
}

export async function suggestRefactor(code: string): Promise<string> {
  const prompt = `Refactor this code to improve readability, maintainability, and performance while keeping behavior identical:\n\n${code}`
  return callGemini(prompt)
}

export async function checkSecurity(code: string): Promise<string> {
  const prompt = `Check this code for security vulnerabilities or unsafe patterns. Suggest fixes where needed:\n\n${code}`
  return callGemini(prompt)
}

export async function generateTests(code: string): Promise<string> {
  const prompt = `Write realistic unit tests for the following code (using Jest or similar):\n\n${code}`
  return callGemini(prompt)
}
