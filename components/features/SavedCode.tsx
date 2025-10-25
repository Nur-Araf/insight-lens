import { useState } from "react"

import {
  FiArrowLeft,
  FiCheck,
  FiCode,
  FiSave,
  FiTrash2
} from "~node_modules/react-icons/fi"

export function SavedCodesView({ onBack, savedCodes, onDeleteCode }) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  const handleCopy = async (code: string, name: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedItem(name)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  return (
    <div className="w-[350px] max-w-full p-3 bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] text-white shadow-2xl ring-1 ring-purple-500/20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] rounded-full blur-4xl opacity-25 animate-pulse-slow"></div>
      <div className="absolute -bottom-24 -left-24 w-24 h-24 bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] rounded-full blur-4xl opacity-20 animate-pulse-slow delay-1000"></div>

      {/* Header */}
      <header className="flex items-center gap-2 mb-4 relative z-10">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 group">
          <FiArrowLeft className="text-white/70 group-hover:text-white text-sm" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent drop-shadow-sm">
            Saved Code Snippets
          </h1>
          <p className="text-xs text-white/60">
            {Object.keys(savedCodes || {}).length} snippets saved
          </p>
        </div>
      </header>

      {/* Saved Codes List with Custom Scrollbar */}
      <div className="max-h-96 overflow-y-auto space-y-2 relative z-10 custom-scrollbar">
        {!savedCodes || Object.keys(savedCodes).length === 0 ? (
          <div className="text-center py-8 text-white/50">
            <FiSave className="text-2xl mx-auto mb-2 opacity-50" />
            <p className="text-sm">No code snippets saved yet</p>
            <p className="text-xs mt-1">Save code from the selection popup</p>
          </div>
        ) : (
          Object.entries(savedCodes).map(([name, code]) => (
            <div
              key={name}
              className="p-3 rounded-xl bg-gradient-to-br from-white/5 to-white/2 ring-1 ring-cyan-500/20 backdrop-blur-sm hover:ring-cyan-500/30 transition-all duration-300 group">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white/90 truncate">
                    {name}
                  </h3>
                  <p className="text-xs text-cyan-300/70 mt-1 line-clamp-2">
                    {typeof code === "string"
                      ? code.substring(0, 100) +
                        (code.length > 100 ? "..." : "")
                      : ""}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteCode(name)}
                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 ring-1 ring-red-500/30 hover:ring-red-500/50 transition-all duration-200 opacity-0 group-hover:opacity-100">
                  <FiTrash2 className="text-red-400 text-xs" />
                </button>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">
                  {typeof code === "string"
                    ? `${code.length} chars`
                    : "0 chars"}
                </span>
                <button
                  onClick={() => typeof code === "string" && handleCopy(code, name)}
                  className={`px-2 py-1 rounded-lg transition-all duration-200 flex items-center gap-1 ${
                    copiedItem === name
                      ? "bg-emerald-500/20 ring-1 ring-emerald-500/50 text-emerald-300"
                      : "bg-cyan-500/10 hover:bg-cyan-500/20 ring-1 ring-cyan-500/30 hover:ring-cyan-500/50 text-cyan-300"
                  }`}>
                  {copiedItem === name ? (
                    <>
                      <FiCheck className="text-xs" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <span>Copy</span>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <footer className="mt-3 pt-2 border-t border-white/10 relative z-10">
        <div className="flex items-center justify-between text-xs text-white/40">
          <div className="flex items-center gap-1">
            <FiCode className="text-cyan-400 text-xs" />
            <span>Saved Snippets</span>
          </div>
          <span>v2.0</span>
        </div>
      </footer>
    </div>
  )
}
