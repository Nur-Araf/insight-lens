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
  spinnerKeyframes
} from "~styles/style"

import {
  answerAiSmart,
  askWithSessionSmart,
  checkSecuritySmart,
  generateTestsSmart,
  reviewCodeSmart
} from "../handlers/modelRouter"

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
  controls.append(resetBtn, copyBtn, closeBtn)
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
  // We will hold the live session for this popup here
  let interactiveSession: any = null
  let askInputRow: HTMLDivElement | null = null

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
        popup.insertBefore(askInputRow, btnRow.nextSibling)
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

// --- Enhanced Selection Logic ---
function attachSelectionLogic() {
  console.log("[InsightLens] Initializing universal selection listeners")

  let lastSelectionTime = 0

  document.addEventListener("mouseup", (e) => {
    // Don't show floating icon if popup is already open
    if (isPopupOpen) {
      return
    }

    // Ignore right clicks and very quick selections
    if (e.button === 2 || Date.now() - lastSelectionTime < 100) {
      return
    }

    setTimeout(() => {
      const sel = window.getSelection()
      const selectedText = sel?.toString().trim()

      // Don't show if selection is too small or empty
      if (!selectedText || selectedText.length < 10) {
        removeExistingMenu()
        return
      }

      // Smart code detection based on content
      if (!isLikelyCode(selectedText)) {
        removeExistingMenu()
        return
      }

      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      // Enhanced positioning logic
      let x, y

      // Check if selection rectangle is valid
      if (rect.width === 0 && rect.height === 0) {
        // Fallback: Use cursor position
        x = e.clientX + window.scrollX + 10
        y = e.clientY + window.scrollY - 30
      } else {
        // Use selection position with better handling
        x = rect.right + window.scrollX + 10
        y = rect.top + window.scrollY - 6
      }

      // Ensure the icon stays within viewport bounds
      x = Math.min(window.innerWidth - 50, Math.max(10, x))
      y = Math.min(window.innerHeight - 50, Math.max(10, y))

      createFloatingIcon(x, y, selectedText)
      lastSelectionTime = Date.now()
    }, 50)
  })

  // Cleanup on scroll or click away
  window.addEventListener("scroll", () => {
    if (!isPopupOpen) {
      removeExistingMenu()
    }
  })

  document.addEventListener("click", (e) => {
    const menu = document.getElementById("insightlens-menu")
    if (menu && !isPopupOpen && !menu.contains(e.target as Node)) {
      removeExistingMenu()
    }
  })

  // Keyboard shortcuts
  document.addEventListener("keydown", async (e) => {
    // Escape clears UI
    if (e.key === "Escape") {
      removeExistingMenu()
      removeExistingPopup()
      return
    }

    // Ctrl/Command + Shift + R to trigger review — open an EMPTY popup (no clipboard)
    const isMod = e.ctrlKey || e.metaKey
    if (isMod && e.shiftKey && (e.key === "R" || e.key === "r")) {
      e.preventDefault()

      if (isPopupOpen) return

      // Intentionally open empty — do NOT access clipboard to avoid permission prompts.
      isPopupOpen = true
      openPopup("")
    }
  })
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

// --- Run after DOM ready ---
waitForDOMReady(() => {
  console.log(
    "[InsightLens] DOM ready - attaching universal selection listeners"
  )
  attachSelectionLogic()
  setupContextMenu()

  // Add global styles for consistent appearance
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
