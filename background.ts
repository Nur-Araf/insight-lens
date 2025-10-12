import { initCodeAssistantSession } from "~handlers/handlers"

// 🔹 Run once when the extension is installed
chrome.runtime.onInstalled.addListener(async () => {
  console.log("🔹 Extension installed — initializing Gemini session...")
  await initCodeAssistantSession()

  // Create context menu item
  chrome.contextMenus.create({
    id: "review-code",
    title: "Review Code with InsightLens",
    contexts: ["selection"]
  })
})

// 🔹 Run every time the browser starts
chrome.runtime.onStartup.addListener(async () => {
  console.log("🔹 Browser startup — initializing Gemini session...")
  await initCodeAssistantSession()
})

// 🔹 Wake Gemini if popup or content needs it
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "WAKE_GEMINI") initCodeAssistantSession()
  if (msg.type === "SHOW_NOTIFICATION") {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id)
          chrome.tabs.sendMessage(tab.id, {
            type: "SHOW_NOTIFICATION",
            payload: msg.payload
          })
      }
    })
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
