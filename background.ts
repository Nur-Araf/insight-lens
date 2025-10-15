// background.ts
import { Storage } from "@plasmohq/storage"

import { initCodeAssistantSession } from "~handlers/handlers"

const storage = new Storage()

// 🔹 Run once when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log("🔹 Extension installed.")
  // ⚠️ REMOVED: Session initialization from here

  // Create context menu item
  chrome.contextMenus.create({
    id: "review-code",
    title: "Review Code with InsightLens",
    contexts: ["selection"]
  })
})

// 🔹 Run every time the browser starts
chrome.runtime.onStartup.addListener(() => {
  console.log("🔹 Browser startup.")
  // ⚠️ REMOVED: Session initialization from here
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

// 🔹 Context menu click → send selected code to popup
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "review-code" && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      action: "openPopup",
      code: info.selectionText
    })
  }
})

// 🔹 Keyboard shortcut handler
chrome.commands.onCommand.addListener((command) => {
  if (command === "trigger-review") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id)
        chrome.tabs.sendMessage(tabs[0].id, { action: "triggerReview" })
    })
  }
})
