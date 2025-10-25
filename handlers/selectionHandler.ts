// content/selectionHandler.ts

import { isLikelyCode } from "~components/helpers/functionalHelpers"

type SelectionData = {
  text: string
  x: number
  y: number
}

type SelectionCallback = (data: SelectionData | null) => void

let callback: SelectionCallback | null = null

export function attachSelectionListener(cb: SelectionCallback) {
  callback = cb

  document.addEventListener("mouseup", handleSelection)
  window.addEventListener("scroll", handleScroll)
}

export function detachSelectionListener() {
  document.removeEventListener("mouseup", handleSelection)
  window.removeEventListener("scroll", handleScroll)
  callback = null
}

function handleSelection(e: MouseEvent) {
  setTimeout(() => {
    const sel = window.getSelection()
    const selectedText = sel?.toString().trim()

    if (
      !selectedText ||
      selectedText.length < 10 ||
      !isLikelyCode(selectedText)
    ) {
      callback?.(null)
      return
    }

    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    let x = rect.right
    let y = rect.top

    if (rect.width === 0 && rect.height === 0) {
      x = e.clientX
      y = e.clientY
    }

    x += 10
    y -= 10

    // ✅ Add scroll offset — this fixes the “floating icon appears at top” bug
    const scrollX = window.scrollX || document.documentElement.scrollLeft
    const scrollY = window.scrollY || document.documentElement.scrollTop
    x += scrollX
    y += scrollY

    // Clamp to prevent overflow
    x = Math.min(document.documentElement.scrollWidth - 50, Math.max(10, x))
    y = Math.min(document.documentElement.scrollHeight - 50, Math.max(10, y))

    callback?.({
      text: selectedText,
      x,
      y
    })
  }, 50)
}

function handleScroll() {
  callback?.(null)
}
