// content/text-actions.tsx
import {
  isLikelyCode,
  makeDraggableFixed,
  waitForDOMReady
} from "~components/helpers/functionalHelpers"
import {
  IconAsk,
  IconClose,
  IconCopy,
  IconRefactor,
  IconReview,
  IconSecurity,
  IconTest
} from "~components/helpers/icons"
import {
  actionButtonBase,
  actionButtonGradient,
  actionButtonGradient2,
  actionButtonHover,
  closeBtnStyle,
  copyBtnStyle,
  floatingIconBaseStyle,
  floatingIconHoverStyle,
  globalStylesString,
  popupButtonsRow,
  popupHeaderStyle,
  popupStyle,
  popupTextarea,
  popupTitleStyle,
  pulseKeyframes,
  spinnerKeyframes
} from "~styles/style"

import {
  ask,
  checkSecurity,
  generateTests,
  reviewCode,
  suggestRefactor
} from "../handlers/handlers"

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
    wrapper.style.pointerEvents = "none"
    wrapper.style.opacity = "0.6" // optional: visual hint
    wrapper.style.transition = "opacity .18s ease"

    // Open popup
    openPopup(selectedText)
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

  const copyBtn = document.createElement("button")
  copyBtn.style.cssText = copyBtnStyle
  copyBtn.innerHTML = IconCopy
  copyBtn.title = "Copy code"
  copyBtn.onclick = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(selectedText)
    console.log("[InsightLens] Code copied to clipboard")
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
  controls.append(copyBtn, closeBtn)
  header.append(title, controls)

  const textarea = document.createElement("textarea")
  textarea.style.cssText =
    popupTextarea +
    `
    height: 320px;
    min-height: 320px;
    max-height: 60vh;
    resize: vertical;
  `
  textarea.value = selectedText
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
      button.innerHTML = `<div style="display:flex;align-items:center;gap:6px;">
        <div class="spinner" style="width:12px;height:12px;border:2px solid transparent;border-top:2px solid currentColor;border-radius:50%;animation:spin 1s linear infinite"></div>
        <span style="font-weight:600;font-size:13px">Processing...</span>
      </div>`

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
    reviewCode
  )
  const securityBtn = createActionButton(
    IconSecurity,
    "Security",
    actionButtonGradient2,
    checkSecurity
  )
  const refactorBtn = createActionButton(
    IconRefactor,
    "Refactor",
    actionButtonGradient,
    suggestRefactor
  )
  const testBtn = createActionButton(
    IconTest,
    "Tests",
    actionButtonGradient2,
    generateTests
  )
  const askBtn = createActionButton(
    IconAsk,
    "Ask AI",
    actionButtonGradient,
    ask
  )

  btnRow.append(reviewBtn, securityBtn, refactorBtn, testBtn, askBtn)
  popup.append(header, textarea, btnRow)
  document.body.appendChild(popup)

  // Center popup
  const rect = popup.getBoundingClientRect()
  popup.style.left = `${(window.innerWidth - rect.width) / 2}px`
  popup.style.top = `${(window.innerHeight - rect.height) / 2}px`
  popup.style.visibility = "visible"

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
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      removeExistingMenu()
      removeExistingPopup()
    }

    // Ctrl+Shift+R to trigger review on current selection
    if (e.ctrlKey && e.shiftKey && e.key === "R") {
      e.preventDefault()
      const sel = window.getSelection()
      const selectedText = sel?.toString().trim()

      if (selectedText && selectedText.length >= 10) {
        isPopupOpen = true
        openPopup(selectedText)
      }
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

// Add this to the end of your waitForDOMReady function
const globalStyles = document.createElement("style")
globalStyles.textContent = globalStylesString
document.head.appendChild(globalStyles)
