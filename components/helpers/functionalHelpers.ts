import { actionButtonBase } from "~styles/style"

// --- Smart Code Detection ---

export function isLikelyCode(text: string): boolean {
  if (!text || text.length < 15) return false // Increased minimum length for better context

  const lines = text.split("\n")
  const trimmedText = text.trim()
  const lowerText = text.toLowerCase()

  // High score for very short snippets that are clearly code (e.g., variable declarations)
  if (lines.length === 1 && trimmedText.length < 30) {
    if (trimmedText.match(/^(const|let|var|int|string)\s+[\w]+\s*=\s*.*[;]$/i))
      return true
    if (trimmedText.match(/^[\w]+\s*\(\s*.*?\s*\)\s*\{?\s*$/)) return true // Function call/signature
  }

  // Code indicators (weighted scoring)
  let score = 0

  // --- 1. Structural Patterns (High Weight) ---
  // A balanced set of braces/parentheses is a strong indicator of structure.
  const openBraces = (trimmedText.match(/[\{\[\(]/g) || []).length
  const closeBraces = (trimmedText.match(/[\}\]\)]/g) || []).length
  const semicolonCount = (trimmedText.match(/;/g) || []).length

  if (Math.abs(openBraces - closeBraces) <= 1 && openBraces > 0) score += 4
  if (semicolonCount > 0 && lines.length <= semicolonCount * 2) score += 3 // High density of semicolons
  if (trimmedText.includes("=") && trimmedText.includes(";")) score += 2

  // --- 2. Universal & Language-Specific Keywords (Medium Weight) ---
  const universalKeywords = [
    // Functional/OOP
    "function",
    "def ",
    "class ",
    "interface ",
    "enum ",
    "struct ",
    "return ",
    "void ",
    "null",
    "nil",
    "None",
    // Control Flow
    "if ",
    "else ",
    "for ",
    "while ",
    "do ",
    "switch ",
    "case ",
    "break ",
    "continue ",
    "try ",
    "catch ",
    "finally ",
    "throw ",
    "except ",
    "raise ",
    // Variable/Module
    "import ",
    "export ",
    "from ",
    "package ",
    "namespace ",
    "module ",
    "using ",
    "const ",
    "let ",
    "var ",
    "final ",
    "static ",
    "new ",
    "this ",
    "self ",
    "super "
  ]
  const languageKeywords = [
    // JS/TS/PHP
    "=>",
    "async ",
    "await ",
    "yield ",
    "typeof ",
    "instanceof ",
    "declare ",
    // Python
    "elif ",
    "lambda ",
    "pass",
    // C/C++/Java/Go
    "public ",
    "private ",
    "protected ",
    "int ",
    "char ",
    "float ",
    "double ",
    "string ",
    "bool ",
    "main(",
    "#include",
    "std::",
    "go ",
    "chan "
  ]

  universalKeywords.forEach((keyword) => {
    if (lowerText.includes(keyword)) score += 2
  })
  languageKeywords.forEach((keyword) => {
    if (lowerText.includes(keyword)) score += 1
  })

  // --- 3. I/O and Debugging (Medium Weight) ---
  const ioPatterns = [
    "console.log",
    "print(",
    "printf(",
    "cout",
    "System.out.print",
    "debug",
    "log.",
    "log("
  ]
  ioPatterns.forEach((pattern) => {
    if (lowerText.includes(pattern)) score += 2
  })

  // --- 4. Multi-line and Indentation Patterns (High Weight for Clarity) ---
  if (lines.length > 1) {
    const linesWithContent = lines.filter((line) => line.trim().length > 0)
    let indentedLines = 0
    let consistentIndent = 0
    let lastIndent = 0 // Track indentation level

    linesWithContent.forEach((line) => {
      // Check for indentation using spaces or tabs
      const match = line.match(/^(\s+)/)
      const currentIndent = match ? match[1].length : 0

      if (currentIndent > 0) {
        indentedLines++
        // Check for consistent indentation increase/decrease
        if (
          currentIndent === lastIndent + 2 ||
          currentIndent === lastIndent + 4 ||
          currentIndent === lastIndent - 2 ||
          currentIndent === lastIndent - 4 ||
          currentIndent === lastIndent
        ) {
          consistentIndent++
        }
      }
      lastIndent = currentIndent
    })

    // Strong indicator: More than 30% of content lines are indented
    if (indentedLines > linesWithContent.length * 0.3) score += 3

    // Very strong indicator: Consistent indentation on most indented lines
    if (indentedLines > 1 && consistentIndent >= indentedLines * 0.5) score += 3
  }

  // --- 5. Comment and Annotation Patterns (Low Weight) ---
  const commentPatterns = [
    "//",
    "/*",
    "*/",
    "#",
    "---",
    "",
    "@interface",
    "@override"
  ]
  commentPatterns.forEach((pattern) => {
    if (text.includes(pattern)) score += 1
  })

  // --- 6. Anti-Prose Indicators (Deduction) ---
  const sentenceEnders = (trimmedText.match(/[.!?]/g) || []).length
  const codeEnders = (trimmedText.match(/[;]/g) || []).length
  const commaCount = (trimmedText.match(/,/g) || []).length

  // Deduct score if it looks like standard English prose
  if (sentenceEnders > codeEnders * 2 && lowerText.split(" ").length > 10)
    score -= 3 // More periods than semicolons/short text
  if (
    lowerText.includes("the ") &&
    lowerText.includes(" and ") &&
    lines.length < 5
  )
    score -= 2
  if (commaCount > 0 && commaCount > semicolonCount * 3) score -= 1 // High ratio of prose-style commas

  // --- Final Threshold ---
  console.log(
    `[InsightLens] Code detection score: ${score} for text: ${text.substring(0, 50)}...`
  )
  return score >= 7 // Increased threshold for a higher confidence requirement
}

export function makeDraggableFixed(el: HTMLElement, handle: HTMLElement) {
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

// --- DOM ready ---
export function waitForDOMReady(callback: () => void) {
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    callback()
  } else {
    document.addEventListener("DOMContentLoaded", callback)
  }
}
