/* content/text-actions.tsx */
import {
  isLikelyCode,
  makeDraggableFixed,
  waitForDOMReady
} from "~components/helpers/functionalHelpers"
import {
  IconAnswer,
  IconAsk,
  IconClose,
  IconCopy,
  IconReset,
  IconReview,
  IconSave,
  // IconSave,
  IconSecurity,
  IconTest
} from "~components/helpers/icons"
import {
  actionButtonBase,
  actionButtonGradient,
  actionButtonGradient2,
  actionButtonHover,
  askInputStyle,
  closeBtnStyle,
  copyBtnStyle,
  floatingIconBaseStyle,
  floatingIconHoverStyle,
  globalStylesString,
  loaderButtonStyle,
  popupButtonsRow,
  popupHeaderStyle,
  popupStyle,
  popupTextarea,
  popupTitleStyle,
  pulseKeyframes,
  rowStyle,
  spinnerKeyframes
} from "~styles/style"

import {
  answerAiSmart,
  askWithSessionSmart,
  checkSecuritySmart,
  generateTestsSmart,
  reviewCodeSmart
} from "../handlers/modelRouter"
// Import the save handler
import { saveCodeSmart } from "../handlers/saveHandler"
import { attachSelectionListener } from "~handlers/selectionHandler"

// Global state to track if popup is open
let isPopupOpen = false

// --- Floating icon ---
function createFloatingIcon(x: number, y: number, selectedText: string) {
  console.log("[InsightLens] Creating floating icon for selection")

  // Don't create icon if popup is already open
  if (isPopupOpen) {
    return
  }

  removeExistingMenu()

  const wrapper = document.createElement("div")
  wrapper.id = "insightlens-menu"
  wrapper.style.cssText = `
    position: absolute;
    z-index: 1000000;
    pointer-events: auto;
  `

  // Position with transform for better centering
  wrapper.style.left = "0"
  wrapper.style.top = "0"
  wrapper.style.transform = `translate(${x}px, ${y}px)`

  const icon = document.createElement("div")
  icon.innerHTML = "⚡"
  icon.style.cssText = floatingIconBaseStyle
  icon.title = "Code Review Actions"

  // Add pulsing animation for better visibility
  const pulseStyle = document.createElement("style")
  pulseStyle.textContent = pulseKeyframes
  document.head.appendChild(pulseStyle)
  icon.style.animation = "insightlens-pulse 2s ease-in-out"

  icon.addEventListener("click", (e) => {
    e.stopPropagation()
    e.preventDefault()
    console.log("[InsightLens] Opening popup")

    // Mark popup as open
    isPopupOpen = true

    wrapper.style.zIndex = "999900"
    icon.style.pointerEvents = "none"
    icon.style.opacity = "0.6"
    icon.style.transition = "opacity .18s ease"

    // Open popup (may pass selectedText or empty)
    openPopup(selectedText || "")
  })

  icon.addEventListener("mouseenter", () => {
    icon.style.cssText = floatingIconBaseStyle + floatingIconHoverStyle
  })

  icon.addEventListener("mouseleave", () => {
    icon.style.cssText = floatingIconBaseStyle
  })

  wrapper.appendChild(icon)
  document.body.appendChild(wrapper)

  // Add escape key handler specifically for this icon
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      removeExistingMenu()
      document.removeEventListener("keydown", handleEscape)
    }
  }
  document.addEventListener("keydown", handleEscape)
}

// --- Popup UI ---
function openPopup(selectedText: string) {
  removeExistingPopup()
  console.log("[InsightLens] Creating popup")

  const popup = document.createElement("div")
  popup.id = "insightlens-popup"
  popup.style.position = "fixed"
  popup.style.visibility = "hidden"
  popup.style.cssText += popupStyle

  // Store original text for reset functionality
  const originalText = selectedText

  // Header
  const header = document.createElement("div")
  header.style.cssText = popupHeaderStyle

  const title = document.createElement("h4")
  title.style.cssText = popupTitleStyle
  title.textContent = "InsightLens - Code Review"

  const controls = document.createElement("div")
  controls.style.display = "flex"
  controls.style.gap = "8px"
  controls.style.alignItems = "center"

  // Reset button to restore original code
  const resetBtn = document.createElement("button")
  resetBtn.style.cssText = copyBtnStyle
  resetBtn.innerHTML = IconReset
  resetBtn.title = "Reset to original code"
  resetBtn.onclick = (e) => {
    e.stopPropagation()
    textarea.value = originalText
    console.log("[InsightLens] Code reset to original")
  }

  // Save button to save the current code
  const saveBtn = document.createElement("button")
  saveBtn.style.cssText = copyBtnStyle
  saveBtn.innerHTML = IconSave // Use icon if available, fallback to emoji IconSave ||
  saveBtn.title = "Save code"
  saveBtn.onclick = (e) => {
    e.stopPropagation()

    // Toggle the save input row
    if (saveInputRow && saveInputRow.parentElement) {
      // Hide if already visible
      saveInputRow.remove()
      saveInputRow = null
    } else {
      // Show save input row
      saveInputRow = createSaveInputRow()
      // Insert it below the action buttons but above any existing ask input
      const insertBefore = askInputRow ? askInputRow : btnRow.nextSibling
      popup.insertBefore(saveInputRow, insertBefore)

      // Hide ask input if it's open to avoid overlap
      if (askInputRow) {
        askInputRow.remove()
        askInputRow = null
      }
    }
  }

  const copyBtn = document.createElement("button")
  copyBtn.style.cssText = copyBtnStyle
  copyBtn.innerHTML = IconCopy
  copyBtn.title = "Copy code"
  copyBtn.onclick = (e) => {
    e.stopPropagation()
    try {
      navigator.clipboard.writeText(textarea.value)
      console.log("[InsightLens] Code copied to clipboard")
    } catch (err) {
      // ignore clipboard errors for copy
      console.warn("[InsightLens] copy to clipboard failed:", err)
    }
  }

  const closeBtn = document.createElement("button")
  closeBtn.style.cssText = closeBtnStyle
  closeBtn.innerHTML = IconClose
  closeBtn.title = "Close"
  closeBtn.onclick = () => {
    isPopupOpen = false
    popup.remove()
    removeExistingMenu() // ensure the floating icon is actually removed
  }

  controls.append(resetBtn, saveBtn, copyBtn, closeBtn)
  header.append(title, controls)

  const textarea = document.createElement("textarea")
  textarea.style.cssText =
    popupTextarea +
    `
  height: 300px;          /* reduce so ask row is visible below */
  min-height: 300px;
  max-height: calc(60vh - 80px); /* leave space for buttons/ask row */
  resize: vertical;
`
  // IMPORTANT: we intentionally set the textarea to empty so no clipboard permission is needed
  textarea.value = selectedText || ""
  textarea.setAttribute("aria-label", "Selected code snippet")

  const btnRow = document.createElement("div")
  btnRow.style.cssText = popupButtonsRow

  // Variables to track input rows
  let askInputRow: HTMLDivElement | null = null
  let saveInputRow: HTMLDivElement | null = null

  // Create Save Input Row (similar to Ask Input Row)
  function createSaveInputRow(): HTMLDivElement {
    const row = document.createElement("div")
    row.style.cssText = rowStyle

    // Input field for snippet name
    const input = document.createElement("input")
    input.type = "text"
    input.placeholder = "Enter snippet name (e.g., utils.js, auth logic)..."
    input.style.cssText = askInputStyle
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault()
        handleSave()
      } else if (ev.key === "Escape") {
        ev.preventDefault()
        row.remove()
        saveInputRow = null
      }
    })

    // Save button
    const saveConfirmBtn = document.createElement("button")
    saveConfirmBtn.textContent = "Save"
    saveConfirmBtn.style.cssText = `
      flex: 1;
      padding: 8px 10px;
      font-weight: 600;
      color: #fff;
      ${actionButtonBase + actionButtonGradient2}
    `
    saveConfirmBtn.addEventListener("click", async (ev) => {
      ev.stopPropagation()
      await handleSave()
    })

    // Cancel button
    const cancelBtn = document.createElement("button")
    cancelBtn.textContent = "Cancel"
    cancelBtn.style.cssText = `
  flex: 1;
  padding: 8px 10px;
  font-weight: 600;
  color: #fff;
  ${actionButtonBase + actionButtonGradient}
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  opacity: 0.9;
`

    // Add hover effects
    cancelBtn.addEventListener("mouseenter", () => {
      cancelBtn.style.backgroundColor = "rgba(255, 255, 255, 0.1)"
      cancelBtn.style.borderColor = "rgba(255, 255, 255, 0.3)"
    })

    cancelBtn.addEventListener("mouseleave", () => {
      cancelBtn.style.backgroundColor = "rgba(255, 255, 255, 0.05)"
      cancelBtn.style.borderColor = "rgba(255, 255, 255, 0.2)"
    })
    cancelBtn.addEventListener("click", (ev) => {
      ev.stopPropagation()
      row.remove()
      saveInputRow = null
    })

    async function handleSave() {
      const name = input.value.trim()
      if (!name) {
        // Show validation - focus and highlight input
        input.style.borderColor = "#ef4444"
        input.focus()
        return
      }

      // Disable UI + show loader
      input.disabled = true
      saveConfirmBtn.disabled = true
      cancelBtn.disabled = true
      const originalContent = saveConfirmBtn.innerHTML
      saveConfirmBtn.innerHTML = loaderButtonStyle

      try {
        await saveCodeSmart(name, textarea.value)
        console.log("[InsightLens] Code saved successfully")

        // Show success and remove the input row
        saveConfirmBtn.innerHTML = "✓ Saved!"
        setTimeout(() => {
          row.remove()
          saveInputRow = null
        }, 1000)
      } catch (err) {
        console.error("[InsightLens] Save failed:", err)

        // Show error
        saveConfirmBtn.innerHTML = "✗ Error"
        setTimeout(() => {
          saveConfirmBtn.innerHTML = originalContent
          input.disabled = false
          saveConfirmBtn.disabled = false
          cancelBtn.disabled = false
        }, 1000)
      }
    }

    row.appendChild(input)
    row.appendChild(saveConfirmBtn)
    row.appendChild(cancelBtn)

    // Focus input immediately
    setTimeout(() => {
      input.focus()
      input.select()
    }, 0)

    return row
  }

  function createActionButton(
    svg: string,
    label: string,
    gradient: string,
    handler: (t: string) => Promise<string>
  ) {
    const button = document.createElement("button")
    button.style.cssText = actionButtonBase + gradient + " color:#fff;"

    const buttonContent = document.createElement("div")
    buttonContent.style.display = "flex"
    buttonContent.style.alignItems = "center"
    buttonContent.style.justifyContent = "center"
    buttonContent.style.gap = "6px"

    const iconWrapper = document.createElement("div")
    iconWrapper.style.display = "flex"
    iconWrapper.style.alignItems = "center"
    iconWrapper.innerHTML = svg

    const labelSpan = document.createElement("span")
    labelSpan.textContent = label
    labelSpan.style.fontWeight = "600"
    labelSpan.style.fontSize = "13px"

    buttonContent.appendChild(iconWrapper)
    buttonContent.appendChild(labelSpan)
    button.appendChild(buttonContent)

    const originalContent = button.innerHTML

    button.addEventListener("click", async (e) => {
      e.stopPropagation()
      console.log(`[InsightLens] ${label} action triggered`)

      button.disabled = true
      button.style.opacity = "0.7"
      button.innerHTML = loaderButtonStyle

      try {
        const result = await handler(textarea.value)
        textarea.value = result
        console.log(`[InsightLens] ${label} action completed`)
      } catch (err) {
        console.error(`[InsightLens] ${label} action failed:`, err)
        textarea.value = `Error in ${label}: ${err instanceof Error ? err.message : String(err)}`
      } finally {
        button.disabled = false
        button.style.opacity = "1"
        button.innerHTML = originalContent
      }
    })

    // Add hover effect
    button.addEventListener("mouseenter", () => {
      button.style.cssText =
        actionButtonBase + gradient + actionButtonHover + " color:#fff;"
    })
    button.addEventListener("mouseleave", () => {
      button.style.cssText = actionButtonBase + gradient + " color:#fff;"
    })

    return button
  }

  const reviewBtn = createActionButton(
    IconReview,
    "Review",
    actionButtonGradient,
    reviewCodeSmart
  )
  const securityBtn = createActionButton(
    IconSecurity,
    "Security",
    actionButtonGradient2,
    checkSecuritySmart
  )
  const answerBtn = createActionButton(
    IconAnswer,
    "Answer",
    actionButtonGradient,
    answerAiSmart
  )
  const testBtn = createActionButton(
    IconTest,
    "Tests",
    actionButtonGradient2,
    generateTestsSmart
  )

  // Create the Ask toggle button (similar styles to other buttons)
  function createAskInteractiveButton() {
    const button = document.createElement("button")
    button.style.cssText =
      actionButtonBase + actionButtonGradient + " color:#fff;"
    button.innerHTML = `<div style="display:flex;align-items:center;gap:6px">${IconAsk}<span style="font-weight:600;font-size:13px">Ask AI</span></div>`

    button.addEventListener("click", (e) => {
      e.stopPropagation()
      // Toggle the input row
      if (askInputRow && askInputRow.parentElement) {
        // hide
        askInputRow.remove()
        askInputRow = null
      } else {
        // show
        askInputRow = createAskInputRow()
        // place it just below the btnRow
        const insertBefore = saveInputRow ? saveInputRow : btnRow.nextSibling
        popup.insertBefore(askInputRow, insertBefore)

        // Hide save input if it's open to avoid overlap
        if (saveInputRow) {
          saveInputRow.remove()
          saveInputRow = null
        }
      }
    })

    // hover effects
    button.addEventListener("mouseenter", () => {
      button.style.cssText =
        actionButtonBase +
        actionButtonGradient +
        actionButtonHover +
        " color:#fff;"
    })
    button.addEventListener("mouseleave", () => {
      button.style.cssText =
        actionButtonBase + actionButtonGradient + " color:#fff;"
    })

    return button
  }

  function createAskInputRow() {
    const row = document.createElement("div")
    row.style.cssText = `
    margin-top: 10px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  `

    // Input field — takes 4 parts of width
    const input = document.createElement("input")
    input.type = "text"
    input.placeholder =
      "Ask a question about the code (e.g. 'What does this function do?')"
    input.style.cssText = askInputStyle
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault()
        sendAskQuestion()
      }
    })

    // Send button — takes 1 part of width
    const sendBtn = document.createElement("button")
    sendBtn.textContent = "Send"
    sendBtn.style.cssText = `
    flex: 1;
    padding: 8px 10px;
    font-weight: 600;
    color: #fff;
    ${actionButtonBase + actionButtonGradient2}
  `
    sendBtn.addEventListener("click", async (ev) => {
      ev.stopPropagation()
      await sendAskQuestion()
    })

    //  Send logic
    async function sendAskQuestion() {
      const q = input.value.trim()
      if (!q) return

      // Disable UI + show loader
      input.disabled = true
      sendBtn.disabled = true
      const originalContent = sendBtn.innerHTML
      sendBtn.innerHTML = loaderButtonStyle

      // Immediately show question and "Processing…" BEFORE any await
      const originalCode = textarea.value.trim()
      textarea.value = `${originalCode}\n\n---\nQ: ${q}\nAI: Processing...`

      try {
        // Ask the AI directly using the global session
        const response = await askWithSessionSmart(q, textarea.value)

        textarea.value = `${originalCode}\n\n---\nQ: ${q}\nAI: ${response.trim()}`

        // Reset input field
        input.value = ""
        input.focus()
      } catch (err) {
        textarea.value = `Error: ${err instanceof Error ? err.message : String(err)}`
      } finally {
        // Restore send button
        sendBtn.innerHTML = originalContent
        input.disabled = false
        sendBtn.disabled = false
      }
    }

    row.appendChild(input)
    row.appendChild(sendBtn)
    return row
  }

  // Use the interactive button instead of the old one-shot askBtn
  const askInteractiveBtn = createAskInteractiveButton()

  btnRow.append(reviewBtn, securityBtn, testBtn, answerBtn, askInteractiveBtn)
  popup.append(header, textarea, btnRow)
  document.body.appendChild(popup)

  // Center popup
  const rect = popup.getBoundingClientRect()
  popup.style.left = `${(window.innerWidth - rect.width) / 2}px`
  popup.style.top = `${(window.innerHeight - rect.height) / 2}px`
  popup.style.visibility = "visible"

  // focus the textarea so the user can type immediately
  try {
    // small timeout to ensure element is in DOM & visible before focus
    setTimeout(() => {
      textarea.focus()
      // move cursor to end
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length
    }, 0)
  } catch (err) {
    console.warn("[InsightLens] Unable to focus textarea:", err)
  }

  makeDraggableFixed(popup, header)

  // Add spinner and scrollbar animations
  const style = document.createElement("style")
  style.textContent = spinnerKeyframes
  document.head.appendChild(style)
}

// --- Helpers ---
function removeExistingMenu() {
  const menu = document.getElementById("insightlens-menu")
  console.log("[InsightLens] Removing menu:", menu)
  menu?.remove()
}

function removeExistingPopup() {
  const popup = document.getElementById("insightlens-popup")
  console.log("[InsightLens] Removing popup:", popup)
  popup?.remove()
  // Reset state when popup is removed
  isPopupOpen = false
}

// --- Context Menu Integration ---
function setupContextMenu() {
  // Listen for context menu on selections
  document.addEventListener("contextmenu", (e) => {
    const sel = window.getSelection()
    const selectedText = sel?.toString().trim()

    if (
      selectedText &&
      selectedText.length >= 10 &&
      isLikelyCode(selectedText)
    ) {
      // We can't directly modify the context menu from content script,
      // but we can store the selection for use in our context menu item
      // This would need to be implemented in the background script
    }
  })
}

waitForDOMReady(() => {
  console.log("[InsightLens] DOM ready - initializing InsightLens UI")

  // Attach new selection listener
  attachSelectionListener((selection) => {
    if (!selection) {
      removeExistingMenu()
      return
    }

    // Create the floating icon when valid code is selected
    createFloatingIcon(selection.x, selection.y, selection.text)
  })

  // Context menu setup (optional, safe to keep)
  setupContextMenu()

  // Add global styles (keep this!)
  const globalStyles = document.createElement("style")
  globalStyles.textContent = `
    #insightlens-menu, #insightlens-popup {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 1000000;
    }

    #insightlens-popup {
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
  `
  document.head.appendChild(globalStyles)
})

// Listen for background requests to open the popup (from service worker)
// background message will open an EMPTY popup (no clipboard access)
if (
  typeof chrome !== "undefined" &&
  chrome.runtime &&
  chrome.runtime.onMessage
) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.action === "open-insightlens") {
      try {
        if (isPopupOpen) {
          console.log("[InsightLens] popup already open - ignoring message")
          return
        }

        isPopupOpen = true
        openPopup("")
      } catch (err) {
        console.error(
          "[InsightLens] error handling open-insightlens message:",
          err
        )
      }
      // no synchronous response
      return
    }
  })
}

// Add this to the end of your waitForDOMReady function
const globalStyles = document.createElement("style")
globalStyles.textContent = globalStylesString
document.head.appendChild(globalStyles)
