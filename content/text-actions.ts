// content/text-actions.tsx
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
  iconHoverStyle,
  iconStyle,
  menuWrapperStyle,
  popupButtonsRow,
  popupHeaderStyle,
  popupStyle,
  popupTextarea,
  popupTitleStyle
} from "~styles/style"

import {
  ask,
  checkSecurity,
  generateTests,
  reviewCode,
  suggestRefactor
} from "../handlers/handlers"
import { isLikelyCode } from "~components/helpers/functionalHelpers"

// --- Smart Code Detection ---


// --- Floating icon ---
function createFloatingIcon(x: number, y: number, selectedText: string) {
  console.log("[InsightLens] Creating floating icon for selection")
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
  icon.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
    border: 2px solid white;
    pointer-events: auto;
    user-select: none;
  `
  icon.title = "Code Review Actions"

  // Add pulsing animation for better visibility
  const pulseStyle = document.createElement("style")
  pulseStyle.textContent = `
    @keyframes insightlens-pulse {
      0% { transform: scale(1); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
      50% { transform: scale(1.05); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4); }
      100% { transform: scale(1); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
    }
  `
  document.head.appendChild(pulseStyle)
  icon.style.animation = "insightlens-pulse 2s ease-in-out"

  icon.addEventListener("click", (e) => {
    e.stopPropagation()
    e.preventDefault()
    console.log("[InsightLens] Opening popup")
    openPopup(selectedText)
    removeExistingMenu()
  })

  icon.addEventListener("mouseenter", () => {
    icon.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 50%;
      font-size: 16px;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
      transform: scale(1.1);
      transition: all 0.2s ease;
      border: 2px solid white;
      pointer-events: auto;
      user-select: none;
    `
  })

  icon.addEventListener("mouseleave", () => {
    icon.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 50%;
      font-size: 16px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transform: scale(1);
      transition: all 0.2s ease;
      border: 2px solid white;
      pointer-events: auto;
      user-select: none;
    `
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
  closeBtn.onclick = () => popup.remove()

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
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Custom scrollbar for textarea */
    #insightlens-popup textarea {
      scrollbar-width: thin;
      scrollbar-color: #c1c1c1 #f5f5f5;
    }
    
    #insightlens-popup textarea::-webkit-scrollbar {
      width: 12px;
    }
    
    #insightlens-popup textarea::-webkit-scrollbar-track {
      background: #f5f5f5;
      border-radius: 6px;
    }
    
    #insightlens-popup textarea::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 6px;
      border: 2px solid #f5f5f5;
    }
    
    #insightlens-popup textarea::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
    
    #insightlens-popup textarea::-webkit-scrollbar-corner {
      background: #f5f5f5;
    }
    
    /* Smooth scrolling */
    #insightlens-popup textarea {
      scroll-behavior: smooth;
    }
  `
  document.head.appendChild(style)
}

// --- Draggable helper (fixed) ---
function makeDraggableFixed(el: HTMLElement, handle: HTMLElement) {
  let isDown = false,
    startX = 0,
    startY = 0,
    origX = 0,
    origY = 0

  handle.addEventListener("mousedown", (ev) => {
    ev.preventDefault()
    isDown = true
    const rect = el.getBoundingClientRect()
    startX = ev.clientX
    startY = ev.clientY
    origX = rect.left
    origY = rect.top
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  })
  function onMove(e: MouseEvent) {
    if (!isDown) return
    el.style.left = `${origX + (e.clientX - startX)}px`
    el.style.top = `${origY + (e.clientY - startY)}px`
  }
  function onUp() {
    isDown = false
    window.removeEventListener("mousemove", onMove)
    window.removeEventListener("mouseup", onUp)
  }
}

// --- Helpers ---
function removeExistingMenu() {
  document.getElementById("insightlens-menu")?.remove()
}
function removeExistingPopup() {
  document.getElementById("insightlens-popup")?.remove()
}

// --- Enhanced Selection Logic ---
function attachSelectionLogic() {
  console.log("[InsightLens] Initializing universal selection listeners")

  let lastSelectionTime = 0

  document.addEventListener("mouseup", (e) => {
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
  window.addEventListener("scroll", removeExistingMenu)
  document.addEventListener("click", (e) => {
    const menu = document.getElementById("insightlens-menu")
    if (menu && !menu.contains(e.target as Node)) {
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

// --- DOM ready ---
function waitForDOMReady(callback: () => void) {
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    callback()
  } else {
    document.addEventListener("DOMContentLoaded", callback)
  }
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
globalStyles.textContent = `
  #insightlens-menu {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    z-index: 1000000;
    pointer-events: none;
  }
  
  #insightlens-menu > div {
    pointer-events: auto;
  }
  
  #insightlens-popup {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    z-index: 1000001;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  
  /* Ensure it works on dark mode websites */
  #insightlens-popup textarea {
    background: white;
    color: black;
  }
  
  @media (prefers-color-scheme: dark) {
    #insightlens-popup textarea {
      background: #1e1e1e;
      color: #ffffff;
    }
  }
  
  /* Prevent interference with website styles */
  #insightlens-menu *,
  #insightlens-popup * {
    box-sizing: border-box;
    line-height: normal;
  }
`
document.head.appendChild(globalStyles)
