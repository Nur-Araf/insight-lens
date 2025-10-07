// content/text-actions.tsx
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

// --- Icons as SVG strings ---
const IconCopy = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`
const IconClose = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
const IconReview = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>`
const IconSecurity = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`
const IconRefactor = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`
const IconTest = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>`
const IconAsk = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`

// --- Floating icon ---
function createFloatingIcon(x: number, y: number, selectedText: string) {
  console.log("[InsightLens] Creating floating icon for selection")
  removeExistingMenu()

  const wrapper = document.createElement("div")
  wrapper.id = "insightlens-menu"
  wrapper.style.cssText = menuWrapperStyle
  wrapper.style.left = `${x}px`
  wrapper.style.top = `${y}px`

  const icon = document.createElement("div")
  icon.innerHTML = "⚡"
  icon.style.cssText = iconStyle
  icon.title = "Code Review Actions"

  icon.addEventListener("click", (e) => {
    e.stopPropagation()
    console.log("[InsightLens] Opening popup")
    openPopup(selectedText)
    removeExistingMenu()
  })

  icon.addEventListener("mouseenter", () => {
    icon.style.cssText = iconStyle + iconHoverStyle
  })
  icon.addEventListener("mouseleave", () => {
    icon.style.cssText = iconStyle
  })

  wrapper.appendChild(icon)
  document.body.appendChild(wrapper)
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

// --- Selection logic ---
function attachSelectionLogic() {
  console.log("[InsightLens] Initializing selection listeners")

  document.addEventListener("mouseup", () => {
    setTimeout(() => {
      const sel = window.getSelection()
      const selectedText = sel?.toString().trim()

      if (!selectedText || selectedText.length < 5) {
        removeExistingMenu()
        return
      }

      const node = sel?.anchorNode?.parentElement
      const isCodeElement = node?.closest?.(
        "pre, code, .hljs, .language-js, .language-ts, .language-python, .language-java, .language-cpp, .programming-language"
      )

      if (isCodeElement) {
        const rect = sel.getRangeAt(0).getBoundingClientRect()
        const x = Math.min(
          window.innerWidth - 64,
          rect.right + window.scrollX + 10
        )
        const y = Math.max(8, rect.top + window.scrollY - 6)
        createFloatingIcon(x, y, selectedText)
      } else {
        removeExistingMenu()
      }
    }, 80)
  })

  window.addEventListener("scroll", removeExistingMenu)
  document.addEventListener("click", (e) => {
    const menu = document.getElementById("insightlens-menu")
    if (menu && !menu.contains(e.target as Node)) removeExistingMenu()
  })
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      removeExistingMenu()
      removeExistingPopup()
    }
  })
}

// --- Run after DOM ready ---
waitForDOMReady(() => {
  console.log("[InsightLens] DOM ready - attaching selection listeners")
  attachSelectionLogic()
})
