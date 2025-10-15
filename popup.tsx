import React, { useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import ExtensionDetails from "~components/features/Features"

export default function IndexPopup() {
  const [apiMode, setApiMode] = useState("local") // 'local' or 'gemini'
  const [responseStyle, setResponseStyle] = useState("short") // 'short' or 'detailed'
  const [showDetails, setShowDetails] = useState(false)

  // Persistent notification toggle (default: true)
  const [isNotification, setIsNotification] = useStorage<boolean>(
    "isNotification",
    true
  )

  return (
    <div className="w-96 max-w-full p-6 bg-gradient-to-br from-gray-900 to-black text-white rounded-2xl shadow-2xl ring-1 ring-white/10">
      {/* Header */}
      <header className="flex items-start gap-4 mb-6">
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-white/10 to-white/5 ring-1 ring-white/10 shadow-lg">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <rect
              x="2"
              y="2"
              width="28"
              height="28"
              rx="8"
              stroke="url(#gradient)"
              strokeWidth="1.5"
            />
            <path
              d="M10 12L16 8L22 12V20L16 24L10 20V12Z"
              stroke="url(#gradient)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 12L16 16L22 12"
              stroke="url(#gradient)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 16V24"
              stroke="url(#gradient)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#AAAAAA" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            InsightLens
          </h1>
          <p className="mt-1 text-sm text-white/60 leading-tight">
            Select code → Right click → Analyze instantly
          </p>
        </div>

        <div className="text-right">
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 ring-1 ring-green-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-green-400">Ready</span>
          </div>
        </div>
      </header>

      {/* Quick Overview */}
      <section className="mb-6 p-4 rounded-xl bg-white/5 ring-1 ring-white/10">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold mb-2 text-white/80">
              Quick Start
            </h2>
            <p className="text-xs text-white/60 leading-relaxed">
              Select any code, right-click, and choose "Analyze with
              InsightLens" for instant security checks, refactors, and code
              reviews.
            </p>
          </div>
          <button
            onClick={() => setShowDetails(true)}
            className="ml-4 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs font-medium flex items-center gap-1 flex-shrink-0">
            <span>ℹ️</span>
            Details
          </button>
        </div>
      </section>

      {/* Configuration Toggles */}
      <section className="mb-6 space-y-4">
        {/* API Mode Toggle */}
        <div className="p-4 rounded-xl bg-white/5 ring-1 ring-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="text-left">
              <div className="text-sm font-semibold flex items-center gap-2">
                <span>🔧</span> Processing Mode
              </div>
              <div className="text-xs text-white/60 mt-1">
                {apiMode === "local"
                  ? "Local processing (secure)"
                  : "Gemini API (internet required)"}
              </div>
            </div>
            <div
              className={`flex items-center px-1 py-1 rounded-lg bg-white/10 ${
                apiMode === "gemini" ? "justify-end" : "justify-start"
              }`}>
              <button
                onClick={() => setApiMode("local")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  apiMode === "local"
                    ? "bg-white text-black shadow-sm"
                    : "text-white/70"
                }`}>
                Local
              </button>
              <button
                onClick={() => setApiMode("gemini")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  apiMode === "gemini"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-white/70"
                }`}>
                Gemini
              </button>
            </div>
          </div>
        </div>

        {/* Response Style Toggle */}
        <div className="p-4 rounded-xl bg-white/5 ring-1 ring-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="text-left">
              <div className="text-sm font-semibold flex items-center gap-2">
                <span>📝</span> Response Style
              </div>
              <div className="text-xs text-white/60 mt-1">
                {responseStyle === "short"
                  ? "Quick summaries"
                  : "Detailed explanations"}
              </div>
            </div>
            <div
              className={`flex items-center px-1 py-1 rounded-lg bg-white/10 ${
                responseStyle === "detailed" ? "justify-end" : "justify-start"
              }`}>
              <button
                onClick={() => setResponseStyle("short")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  responseStyle === "short"
                    ? "bg-green-500 text-white shadow-sm"
                    : "text-white/70"
                }`}>
                Fast
              </button>
              <button
                onClick={() => setResponseStyle("detailed")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  responseStyle === "detailed"
                    ? "bg-purple-500 text-white shadow-sm"
                    : "text-white/70"
                }`}>
                Detailed
              </button>
            </div>
          </div>
        </div>

        {/* Notification Toggle */}
        <div className="p-4 rounded-xl bg-white/5 ring-1 ring-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="text-left">
              <div className="text-sm font-semibold flex items-center gap-2">
                <span>🔔</span> Notifications
              </div>
              <div className="text-xs text-white/60 mt-1">
                {isNotification
                  ? "Notifications enabled (with sound)"
                  : "Notifications disabled"}
              </div>
            </div>
            <div
              className={`flex items-center px-1 py-1 rounded-lg bg-white/10 ${
                isNotification ? "justify-end" : "justify-start"
              }`}>
              <button
                onClick={() => setIsNotification(false)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  !isNotification
                    ? "bg-red-500 text-white shadow-sm"
                    : "text-white/70"
                }`}>
                Off
              </button>
              <button
                onClick={() => setIsNotification(true)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  isNotification
                    ? "bg-green-500 text-white shadow-sm"
                    : "text-white/70"
                }`}>
                On
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Current Settings Summary */}
      <section className="p-4 rounded-xl bg-white/5 ring-1 ring-white/10">
        <h3 className="text-xs font-semibold mb-2 text-white/60 uppercase tracking-wide">
          Current Settings
        </h3>
        <div className="flex items-center justify-between text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  apiMode === "local" ? "bg-green-400" : "bg-blue-400"
                }`}></div>
              <span>
                {apiMode === "local"
                  ? "Local Build-in API"
                  : "Gemini Internet API"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  responseStyle === "short" ? "bg-green-400" : "bg-purple-400"
                }`}></div>
              <span>
                {responseStyle === "short"
                  ? "Short & Fast Results"
                  : "Long & Detailed Results"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isNotification ? "bg-green-400" : "bg-red-400"
                }`}></div>
              <span>
                {isNotification ? "Notifications On" : "Notifications Off"}
              </span>
            </div>
          </div>
          <div className="text-right text-xs text-white/40">
            <div>🔒 Privacy First</div>
            <div>⚡ Instant Analysis</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-4 mt-6 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-white/40">
          <div>Select code → Right click → Analyze</div>
          <div>v2.0</div>
        </div>
      </footer>

      {/* Details Modal */}
      <ExtensionDetails
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </div>
  )
}
