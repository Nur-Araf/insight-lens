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

import { ask, proofread, rewrite, summarize, translate } from "../handlers/handlers" // keep your handlers

// SVG icons (currentColor)...
const IconCopy = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle; display:inline-block;"><path d="M9 9H7a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const IconClose = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle; display:inline-block;"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const IconZap = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle; display:inline-block;"><path d="M13 2L3 14h7l-1 8L21 10h-7l-1-8z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const IconTranslate = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle; display:inline-block;"><path d="M3 4h6M3 8h4M21 4h-6M21 8h-4M7 20l5-16 5 16" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const IconRewrite = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle; display:inline-block;"><path d="M3 12a9 9 0 1 0 9-9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const IconProof = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle; display:inline-block;"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const IconAsk = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle; display:inline-block;"><path d="M12 2v1M4 7v6a8 8 0 0 0 16 0V7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`

function createFloatingIcon(x: number, y: number, selectedText: string) {
  removeExistingMenu()

  const wrapper = document.createElement("div")
  wrapper.id = "insightlens-menu"
  wrapper.style.cssText = menuWrapperStyle
  wrapper.style.left = `${x}px`
  wrapper.style.top = `${y}px`

  const icon = document.createElement("div")
  icon.innerHTML = "⚡"
  icon.style.cssText = iconStyle
  icon.title = "InsightLens actions"

  icon.addEventListener("click", (e) => {
    e.stopPropagation()
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

// === CENTERED POPUP (robust) ===
function openPopup(selectedText: string) {
  removeExistingPopup()

  const popup = document.createElement("div")
  popup.id = "insightlens-popup"

  // ensure fixed position and start hidden to measure before placing
  popup.style.position = "fixed"
  popup.style.visibility = "hidden"
  popup.style.cssText += popupStyle

  // header
  const header = document.createElement("div")
  header.style.cssText = popupHeaderStyle

  const title = document.createElement("h4")
  title.style.cssText = popupTitleStyle
  title.textContent = "InsightLens"

  const controls = document.createElement("div")
  controls.style.display = "flex"
  controls.style.gap = "8px"
  controls.style.alignItems = "center"

  const copyBtn = document.createElement("button")
  copyBtn.style.cssText = copyBtnStyle
  copyBtn.innerHTML = `${IconCopy} Copy`
  copyBtn.title = "Copy selected text"

  const closeBtn = document.createElement("button")
  closeBtn.style.cssText = closeBtnStyle
  closeBtn.innerHTML = `${IconClose}`
  closeBtn.title = "Close"
  closeBtn.onclick = () => popup.remove()

  controls.appendChild(copyBtn)
  controls.appendChild(closeBtn)

  header.appendChild(title)
  header.appendChild(controls)

  // textarea
  const textarea = document.createElement("textarea")
  textarea.style.cssText = popupTextarea
  textarea.value = selectedText || ""
  textarea.setAttribute("aria-label", "Selected text")
  textarea.tabIndex = 0
  textarea.addEventListener("click", (e) => e.stopPropagation())

  // buttons row & helper (calls handlers and populates textarea)
  const btnRow = document.createElement("div")
  btnRow.style.cssText = popupButtonsRow

  function makeActionBtn(
    svg: string,
    label: string,
    gradient: string,
    handler: (t: string) => Promise<string>
  ) {
    const b = document.createElement("button")
    b.style.cssText = actionButtonBase + gradient + " color: #fff;"
    b.innerHTML = `${svg} <span style="margin-left:6px; font-weight:700;">${label}</span>`

    const originalInner = b.innerHTML
    async function onClick(e: MouseEvent) {
      e.stopPropagation()
      try {
        b.disabled = true
        b.style.opacity = "0.7"
        b.innerHTML = "…"
        const result = await handler(textarea.value)
        textarea.value = result
      } catch (err) {
        console.error("handler error", err)
        alert("Handler error, check console.")
      } finally {
        b.disabled = false
        b.style.opacity = "1"
        b.innerHTML = originalInner
        textarea.focus()
      }
    }

    b.addEventListener("click", onClick)
    b.onmouseenter = () =>
      (b.style.cssText =
        actionButtonBase + gradient + actionButtonHover + " color: #fff;")
    b.onmouseleave = () =>
      (b.style.cssText = actionButtonBase + gradient + " color: #fff;")
    return b
  }

  const summarizeBtn = makeActionBtn(
    IconZap,
    "Summarize",
    actionButtonGradient,
    summarize
  )
  const translateBtn = makeActionBtn(
    IconTranslate,
    "Translate",
    actionButtonGradient2,
    translate
  )
  const rewriteBtn = makeActionBtn(
    IconRewrite,
    "Rewrite",
    actionButtonGradient,
    rewrite
  )
  const proofBtn = makeActionBtn(
    IconProof,
    "Proofread",
    actionButtonGradient2,
    proofread
  )
  const askBtn = makeActionBtn(IconAsk, "Ask", actionButtonGradient, (t) =>
    ask(t)
  )

  // copy logic
  copyBtn.onclick = (e) => {
    e.stopPropagation()
    try {
      navigator.clipboard.writeText(textarea.value)
    } catch {
      const temp = document.createElement("textarea")
      temp.value = textarea.value
      document.body.appendChild(temp)
      temp.select()
      document.execCommand("copy")
      temp.remove()
    }
  }

  btnRow.appendChild(summarizeBtn)
  btnRow.appendChild(translateBtn)
  btnRow.appendChild(rewriteBtn)
  btnRow.appendChild(proofBtn)
  btnRow.appendChild(askBtn)

  popup.appendChild(header)
  popup.appendChild(textarea)
  popup.appendChild(btnRow)
  document.body.appendChild(popup)

  // --- Measure then center precisely in viewport (no scroll offsets) ---
  // ensure layout is applied
  const pRect = popup.getBoundingClientRect()
  const left = Math.max(12, Math.round((window.innerWidth - pRect.width) / 2))
  const top = Math.max(12, Math.round((window.innerHeight - pRect.height) / 2))

  // set final position relative to viewport (fixed)
  popup.style.left = `${left}px`
  popup.style.top = `${top}px`
  popup.style.transform = "none"
  popup.style.visibility = "visible" // show only after correct placement

  // focus textarea
  setTimeout(() => {
    try {
      textarea.focus()
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
    } catch {}
  }, 40)

  // draggable (fixed coordinate system)
  makeDraggableFixed(popup, header)
}

// draggable helper tuned for position:fixed popup (no initial jump)
function makeDraggableFixed(el: HTMLElement, handle: HTMLElement) {
  let isDown = false
  let startX = 0
  let startY = 0
  let origX = 0
  let origY = 0

  function onMouseMove(e: MouseEvent) {
    if (!isDown) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    el.style.left = `${origX + dx}px`
    el.style.top = `${origY + dy}px`
  }

  function onMouseUp() {
    isDown = false
    handle.style.cursor = "grab"
    window.removeEventListener("mousemove", onMouseMove)
    window.removeEventListener("mouseup", onMouseUp)
  }

  handle.addEventListener("mousedown", (ev) => {
    ev.preventDefault()
    const rect = el.getBoundingClientRect() // fixed coordinates relative to viewport
    origX = rect.left
    origY = rect.top

    isDown = true
    handle.style.cursor = "grabbing"
    startX = ev.clientX
    startY = ev.clientY
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
  })

  handle.addEventListener("touchstart", (ev) => {
    const t = ev.touches[0]
    const rect = el.getBoundingClientRect()
    origX = rect.left
    origY = rect.top

    isDown = true
    startX = t.clientX
    startY = t.clientY
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("touchend", onTouchEnd)
  })

  function onTouchMove(e: TouchEvent) {
    if (!isDown) return
    e.preventDefault()
    const t = e.touches[0]
    const dx = t.clientX - startX
    const dy = t.clientY - startY
    el.style.left = `${origX + dx}px`
    el.style.top = `${origY + dy}px`
  }
  function onTouchEnd() {
    isDown = false
    window.removeEventListener("touchmove", onTouchMove)
    window.removeEventListener("touchend", onTouchEnd)
  }
}

// helpers
function removeExistingMenu() {
  const old = document.getElementById("insightlens-menu")
  if (old) old.remove()
}
function removeExistingPopup() {
  const old = document.getElementById("insightlens-popup")
  if (old) old.remove()
}

// selection listener: show icon when text selected
document.addEventListener("mouseup", () => {
  setTimeout(() => {
    const selection = window.getSelection()
    const selectedText = selection?.toString().trim()
    if (selectedText && selectedText.length > 0) {
      try {
        const range = selection!.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        const x = Math.min(
          window.innerWidth - 64,
          rect.right + window.scrollX + 10
        )
        const y = Math.max(8, rect.top + window.scrollY - 6)
        createFloatingIcon(x, y, selectedText)
      } catch {
        createFloatingIcon(
          window.innerWidth - 100,
          window.innerHeight - 140,
          selectedText
        )
      }
    } else {
      removeExistingMenu()
    }
  }, 60)
})

window.addEventListener("scroll", () => removeExistingMenu())
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
