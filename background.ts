// background.ts
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu item
  chrome.contextMenus.create({
    id: "review-code",
    title: "Review Code with InsightLens",
    contexts: ["selection"]
  })
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "review-code" && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      action: "openPopup",
      code: info.selectionText
    })
  }
})

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === "trigger-review") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "triggerReview" })
      }
    })
  }
})

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "SHOW_NOTIFICATION") {
    // Forward to all active tabs
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
