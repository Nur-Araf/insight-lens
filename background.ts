// background.ts
import { Storage } from "@plasmohq/storage"

import { initCodeAssistantSession } from "~handlers/handlers"

const storage = new Storage()

async function getGeminiApiKey() {
  const userKey = await storage.get("userGeminiKey")
  return userKey || process.env.PLASMO_PUBLIC_GEMINI_KEY
}

// 🔹 Run once when the extension is installed
async function tryInitSessionEarly() {
  try {
    await initCodeAssistantSession()
    console.log("🚀 Pre-initialized Gemini session at startup/install.")
  } catch (err) {
    console.warn("⚠️ Early session init failed:", err)
  }
}

// 🔹 Run once when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log("🔹 Extension installed.")
  tryInitSessionEarly() //  start session early
  chrome.contextMenus.create({
    id: "review-code",
    title: "Review Code with InsightLens",
    contexts: ["selection"]
  })
})

// 🔹 Run every time the browser starts
chrome.runtime.onStartup.addListener(() => {
  console.log("🔹 Browser startup.")
  tryInitSessionEarly() // warm-up session again
})
// 🔹 Wake Gemini if popup or content needs it
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  try {
    // 1️⃣ Handle Gemini wake request
    if (msg.type === "WAKE_GEMINI") {
      await initCodeAssistantSession().catch(console.error)
    }

    // 2️⃣ Handle Notifications
    if (msg.type === "SHOW_NOTIFICATION") {
      const isNotification = await storage.get<boolean>("isNotification")

      // If disabled, stop here
      if (!isNotification) {
        console.log("🔕 Notifications are disabled in settings.")
        return
      }

      const { message, sound } = msg.payload || {}

      // Send notification message safely to all active tabs
      const tabs = await chrome.tabs.query({})

      for (const tab of tabs) {
        if (!tab.id) continue

        chrome.tabs
          .sendMessage(tab.id, {
            type: "SHOW_NOTIFICATION",
            payload: { message, sound }
          })
          .catch((err) => {
            // Tab may not have content script injected
            if (
              err.message?.includes("Receiving end does not exist") ||
              err.message?.includes("No tab with id")
            ) {
              // just ignore
              return
            }
            console.warn("⚠️ Notification message failed:", err)
          })
      }
    }
  } catch (err) {
    console.error("❌ Error in onMessage handler:", err)
  }
})
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchGeminiResponse") {
    ;(async () => {
      try {
        const { type, text, context, prompt } = request

        // 🔹 Get Gemini API key dynamically (from storage or env)
        const userKey = await storage.get("userGeminiKey")
        const GEMINI_API_KEY = userKey || process.env.PLASMO_PUBLIC_GEMINI_KEY

        if (!GEMINI_API_KEY) {
          sendResponse({
            success: false,
            error:
              "No Gemini API key found. Please add your key in settings first."
          })
          return
        }

        // 🔹 Prepare request body
        const body = {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${prompt}\n\n${text}${
                    context ? `\n\nContext:\n${context}` : ""
                  }`
                }
              ]
            }
          ]
        }

        // 🔹 Send Gemini request
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          }
        )

        if (!response.ok) {
          const err = await response.text()
          throw new Error(`Gemini request failed: ${err}`)
        }

        const data = await response.json()
        const reply =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "No response received from Gemini."

        sendResponse({ success: true, data: reply })
      } catch (error) {
        console.error("❌ Gemini API error:", error)
        sendResponse({ success: false, error: error.message })
      }
    })()

    return true // keep the message channel open for async
  }
})

// 🔹 Context menu click → send selected code to popup
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "review-code" && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      action: "openPopup",
      code: info.selectionText
    })
  }
})

// background.js
// Service worker that forwards the "trigger-review" command to the active tab.

chrome.commands.onCommand.addListener((command) => {
  console.log("[InsightLens][background] command received:", command)
  if (command === "trigger-review") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0]
      if (!tab || !tab.id) {
        console.warn("[InsightLens][background] no active tab found")
        return
      }
      try {
        chrome.tabs.sendMessage(
          tab.id,
          { action: "open-insightlens" },
          (resp) => {
            const err = chrome.runtime.lastError
            if (err) {
              console.warn(
                "[InsightLens][background] sendMessage error:",
                err.message
              )
            } else {
              console.log(
                "[InsightLens][background] message sent to tab",
                tab.id
              )
            }
          }
        )
      } catch (e) {
        console.error("[InsightLens][background] failed to send message:", e)
      }
    })
  }
})
