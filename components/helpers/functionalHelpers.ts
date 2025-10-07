export function isLikelyCode(text: string): boolean {
  if (!text || text.length < 10) return false

  const lines = text.split("\n")
  const trimmedText = text.trim()

  // Code indicators (weighted scoring)
  let score = 0

  // Structural patterns (strong indicators)
  if (trimmedText.includes("{") && trimmedText.includes("}")) score += 3
  if (trimmedText.includes("(") && trimmedText.includes(")")) score += 2
  if (trimmedText.includes(";")) score += 2
  if (trimmedText.includes("=") && trimmedText.includes(";")) score += 2
  if (trimmedText.includes("=>")) score += 2 // Arrow functions
  if (trimmedText.includes("function")) score += 3

  // Language-specific patterns
  const codeKeywords = [
    "function",
    "def ",
    "class ",
    "import ",
    "export ",
    "const ",
    "let ",
    "var ",
    "return ",
    "if ",
    "for ",
    "while ",
    "switch ",
    "case ",
    "break ",
    "continue ",
    "public ",
    "private ",
    "protected ",
    "void ",
    "int ",
    "string ",
    "boolean ",
    "console.log",
    "printf",
    "cout",
    "System.out",
    "<?php",
    "#include",
    "package ",
    "using ",
    "namespace ",
    "interface ",
    "extends ",
    "implements ",
    "async ",
    "await ",
    "try ",
    "catch ",
    "finally ",
    "throw ",
    "new ",
    "this ",
    "super "
  ]

  codeKeywords.forEach((keyword) => {
    if (text.toLowerCase().includes(keyword)) score += 2
  })

  // Multi-line and indentation patterns
  if (lines.length > 1) {
    const indentedLines = lines.filter(
      (line) =>
        line.startsWith("  ") ||
        line.startsWith("\t") ||
        line.startsWith("    ")
    )
    if (indentedLines.length > lines.length * 0.3) score += 3

    // Check for consistent indentation (strong code indicator)
    const hasConsistentIndentation = lines.some(
      (line) =>
        (line.startsWith("  ") || line.startsWith("\t")) &&
        line.trim().length > 0
    )
    if (hasConsistentIndentation) score += 2
  }

  // Comment patterns
  const commentPatterns = ["//", "/*", "*/", "# ", "<!--", "-->", "#!"]
  commentPatterns.forEach((pattern) => {
    if (text.includes(pattern)) score += 1
  })

  // Common code file extensions in comments or strings
  const fileExtensions = [
    ".js",
    ".ts",
    ".py",
    ".java",
    ".cpp",
    ".c",
    ".html",
    ".css",
    ".php",
    ".rb"
  ]
  fileExtensions.forEach((ext) => {
    if (text.includes(ext)) score += 1
  })

  // Avoid false positives with common prose patterns
  const proseIndicators = [
    text.split(".").length > text.split(";").length * 2, // More periods than semicolons
    text.toLowerCase().includes("the "),
    text.toLowerCase().includes("and "),
    text.split(" ").length > text.split("\n").length * 10 // Very wordy
  ]

  const proseScore = proseIndicators.filter(Boolean).length
  if (proseScore >= 2) score -= 3

  // Minimum threshold for code detection
  console.log(
    `[InsightLens] Code detection score: ${score} for text: ${text.substring(0, 50)}...`
  )
  return score >= 5
}
