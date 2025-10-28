/* content/text-actions.tsx */
import { Storage } from "@plasmohq/storage"

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
  IconPlus,
  IconReset,
  IconReview,
  IconSave,
  IconSecurity,
  IconTest
} from "~components/helpers/icons"
import { attachSelectionListener } from "~handlers/selectionHandler"
import type { PlasmoCSConfig } from "~node_modules/plasmo/dist/type"
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

const storage = new Storage()

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

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

// Helper function to escape HTML
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// Helper function to add a new section with proper styling
function addNewSection(
  editor: HTMLDivElement,
  content: string,
  type: "user-code" | "ai-response" | "user-question" | "error" = "user-code",
  focus: boolean = true,
  scrollTo: boolean = false
) {
  const section = document.createElement("div")
  section.className = `code-section ${type}`
  section.innerHTML = escapeHtml(content)
  section.contentEditable = type === "user-code" ? "true" : "false"

  // Add subtle focus styling
  section.addEventListener("focus", () => {
    section.style.outline = "1px solid rgba(59, 130, 246, 0.5)"
    section.style.outlineOffset = "1px"
  })

  section.addEventListener("blur", () => {
    section.style.outline = "none"
  })

  // Insert separator above the new section if there is at least one section already
  // and the last child isn't already a separator
  const lastChild = editor.lastElementChild
  if (
    lastChild &&
    lastChild.classList &&
    !lastChild.classList.contains("section-separator")
  ) {
    const separator = document.createElement("div")
    separator.className = "section-separator"
    separator.innerHTML = "---"
    separator.contentEditable = "false"
    separator.style.cssText = `
    text-align: center;
    color: #6b7280;
    margin: 4px 0;
    font-style: italic;
    user-select: none;
    opacity: 0.5;
    font-size: 11px;
  `
    editor.appendChild(separator)
  }

  editor.appendChild(section)

  // Add minimal separator between sections (except for the very first section)
  if (editor.children.length > 1) {
    const separator = document.createElement("div")
    separator.className = "section-separator"
    separator.innerHTML = "---"
    separator.contentEditable = "false"
    separator.style.cssText = `
      text-align: center;
      color: #6b7280;
      margin: 4px 0;
      font-style: italic;
      user-select: none;
      opacity: 0.5;
      font-size: 11px;
    `
    editor.appendChild(separator)
  }

  // Focus the new section only if requested
  if (focus) {
    setTimeout(() => {
      section.focus()
      // Move cursor to end
      const range = document.createRange()
      range.selectNodeContents(section)
      range.collapse(false)
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
    }, 0)
  }

  // Scroll to the new section if requested
  if (scrollTo) {
    setTimeout(() => {
      section.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, 10)
  }

  return section
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
    // Clear all sections and add original code
    editor.innerHTML = ""
    addNewSection(editor, originalText, "user-code")
    console.log("[InsightLens] Code reset to original")
  }

  // Save button to save the current code
  const saveBtn = document.createElement("button")
  saveBtn.style.cssText = copyBtnStyle
  saveBtn.innerHTML = IconSave
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
      // Copy all text content from all sections
      const sections = editor.querySelectorAll(".code-section")
      let fullText = ""
      sections.forEach((section, index) => {
        if (index > 0) fullText += "\n---\n"
        fullText += section.textContent
      })
      navigator.clipboard.writeText(fullText)
      console.log("[InsightLens] Code copied to clipboard")
    } catch (err) {
      // ignore clipboard errors for copy
      console.warn("[InsightLens] copy to clipboard failed:", err)
    }
  }

  // Add new section button
  const addSectionBtn = document.createElement("button")
  addSectionBtn.style.cssText = copyBtnStyle
  addSectionBtn.innerHTML = IconPlus
  addSectionBtn.title = "Add new code section"
  addSectionBtn.onclick = (e) => {
    e.stopPropagation()
    addNewSection(
      editor,
      "// Start typing your code here...",
      "user-code",
      true,
      true
    )
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

  controls.append(resetBtn, saveBtn, addSectionBtn, copyBtn, closeBtn)
  header.append(title, controls)

  // Create the main editor container
  const editor = document.createElement("div")
  editor.style.cssText =
    popupTextarea +
    `
    height: 300px;
    min-height: 300px;
    max-height: calc(60vh - 80px);
    resize: vertical;
    overflow: auto;
    white-space: pre-wrap;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    line-height: 1.4;
    padding: 12px;
  `
  editor.setAttribute("aria-label", "Code editor with syntax coloring")

  // Add initial section with the selected text
  addNewSection(
    editor,
    selectedText || "// Paste or type your code here...",
    "user-code"
  )

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
        // Get all text content from all sections
        const sections = editor.querySelectorAll(".code-section")
        let fullCode = ""
        sections.forEach((section, index) => {
          if (index > 0) fullCode += "\n---\n"
          fullCode += section.textContent
        })

        await saveCodeSmart(name, fullCode)
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
        // Get current user code from the last user-code section
        const userSections = editor.querySelectorAll(".code-section.user-code")
        let currentCode = ""
        if (userSections.length > 0) {
          currentCode = userSections[userSections.length - 1].textContent || ""
        }

        let result = await handler(currentCode)

        // Normalize result: trim and collapse 3+ newlines to 2 newlines
        if (typeof result === "string") {
          result = result.trim().replace(/\n{3,}/g, "\n\n")
        } else {
          result = String(result)
        }

        // Add AI response as a new section
        addNewSection(editor, result, "ai-response", false, true)

        // Automatically create a new user code section for continued work (but don't focus it)
        addNewSection(
          editor,
          "// Continue your code here...",
          "user-code",
          false,
          false
        )

        console.log(`[InsightLens] ${label} action completed`)
      } catch (err) {
        console.error(`[InsightLens] ${label} action failed:`, err)

        // Show error in error section (don't focus, but scroll to it)
        addNewSection(
          editor,
          `Error in ${label}: ${err instanceof Error ? err.message : String(err)}`,
          "error",
          false,
          true
        )
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

    // Send logic
    async function sendAskQuestion() {
      const q = input.value.trim()
      if (!q) return

      // Disable UI + show loader
      input.disabled = true
      sendBtn.disabled = true
      const originalContent = sendBtn.innerHTML
      sendBtn.innerHTML = loaderButtonStyle

      try {
        // Get current code from user sections
        const userSections = editor.querySelectorAll(".code-section.user-code")
        let currentCode = ""
        userSections.forEach((section) => {
          currentCode += section.textContent + "\n"
        })

        // Add question as a new section (don't focus, but scroll to it)
        addNewSection(editor, `Q: ${q}`, "user-question", false, true)

        // Add processing message (don't focus, but scroll to it)
        const processingSection = addNewSection(
          editor,
          "AI: Processing...",
          "ai-response",
          false,
          true
        )

        // Ask the AI directly using the global session
        const response = await askWithSessionSmart(q, currentCode)

        // Replace processing message with actual response
        processingSection.innerHTML = `AI: ${escapeHtml(response.trim())}`

        // Automatically create a new user code section for continued work (but don't focus it)
        addNewSection(
          editor,
          "// Continue your code here...",
          "user-code",
          false,
          false
        )

        // Reset input field but keep focus on it for follow-up questions
        input.value = ""
        input.focus()
      } catch (err) {
        // Show error (don't focus, but scroll to it)
        addNewSection(
          editor,
          `Error: ${err instanceof Error ? err.message : String(err)}`,
          "error",
          false,
          true
        )
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
  popup.append(header, editor, btnRow)
  document.body.appendChild(popup)

  // Center popup
  const rect = popup.getBoundingClientRect()
  popup.style.left = `${(window.innerWidth - rect.width) / 2}px`
  popup.style.top = `${(window.innerHeight - rect.height) / 2}px`
  popup.style.visibility = "visible"

  // Focus the first section
  try {
    setTimeout(() => {
      const firstSection = editor.querySelector(
        ".code-section"
      ) as HTMLDivElement
      if (firstSection) {
        firstSection.focus()
      }
    }, 0)
  } catch (err) {
    console.warn("[InsightLens] Unable to focus editor:", err)
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

// Update global styles to include color coding and section styling
const enhancedGlobalStyles = `
  ${globalStylesString}
  
  /* Color coding for different text types */
  .code-section {
    padding: 6px 10px;
    margin: 2px 0;
    border-radius: 4px;
    white-space: pre-wrap;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    line-height: 1.4;
    min-height: 20px;
    outline: none;
    transition: all 0.2s ease;
  }
  
  /* Subtle focus outline */
  .code-section:focus {
    outline: 1px solid rgba(59, 130, 246, 0.5);
    outline-offset: 1px;
  }
  
  .code-section.user-code {
    color: #e5e7eb;
    background: rgba(59, 130, 246, 0.08);
    border-left: 2px solid #3b82f6;
  }
  
  .code-section.ai-response {
  color: #10b981;
  background: rgba(16, 185, 129, 0.06); /* less opacity if you want */
  border-left: 2px solid #10b981;
  padding: 4px 8px; /* smaller padding */
  margin-bottom: 2px;
}

  .code-section.error {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.08);
    border-left: 2px solid #ef4444;
  }
  
  .code-section.user-question {
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.08);
    border-left: 2px solid #f59e0b;
    font-style: italic;
  }
  
  .section-separator {
    text-align: center;
    color: #6b7280;
    margin: 4px 0;
    font-style: italic;
    user-select: none;
    opacity: 0.5;
    font-size: 11px;
  }
`

// Add enhanced global styles
const globalStyles = document.createElement("style")
globalStyles.textContent = enhancedGlobalStyles
document.head.appendChild(globalStyles)

let isInitialized = false

async function initInsightLens() {
  if (isInitialized) return
  isInitialized = true

  console.log("[InsightLens] Initializing...")

  waitForDOMReady(() => {
    console.log("[InsightLens] DOM ready - initializing InsightLens UI")

    attachSelectionListener((selection) => {
      if (!selection) {
        removeExistingMenu()
        return
      }
      createFloatingIcon(selection.x, selection.y, selection.text)
    })

    setupContextMenu()

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
}

function destroyInsightLens() {
  console.log("[InsightLens] Cleaning up UI & listeners")
  removeExistingMenu()
  removeExistingPopup()
  isPopupOpen = false
  isInitialized = false
}

// --- Initial load ---
storage.get("isExtensionEnabled").then((enabled) => {
  // Convert stored value to boolean safely
  const isEnabled =
    typeof enabled === "boolean"
      ? enabled
      : String(enabled).toLowerCase() === "true"

  if (!isEnabled) {
    console.log("[InsightLens] Extension disabled — not starting.")
  } else {
    initInsightLens()
  }
})

// --- Watch for changes ---
storage.watch({
  isExtensionEnabled: (change: any) => {
    // The watcher can pass a StorageChange object (with .newValue) or the raw value.
    const raw =
      change && typeof change === "object" && "newValue" in change
        ? change.newValue
        : change
    const isEnabled = raw === true || raw === "true"
    console.log("[InsightLens] Storage changed:", isEnabled)

    if (!isEnabled) {
      destroyInsightLens()
    } else {
      initInsightLens()
    }
  }
})
