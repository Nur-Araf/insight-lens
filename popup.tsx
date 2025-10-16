import logo from "data-base64:~/assets/logo.png"
import React, { useState } from "react"
import {
  FiBell,
  FiCheck,
  FiCpu,
  FiFileText,
  FiGlobe,
  FiInfo,
  FiLock,
  FiSettings,
  FiShield,
  FiZap
} from "react-icons/fi"

import { useStorage } from "@plasmohq/storage/hook"

import ExtensionDetails from "~components/features/Features"

export default function IndexPopup() {
  const [showDetails, setShowDetails] = useState(false)
  const [isNotification, setIsNotification] = useStorage<boolean>(
    "isNotification",
    (v) => (v === undefined ? true : v)
  )
  const [responseStyle, setResponseStyle] = useStorage<string>(
    "responseStyle",
    (v) => (v === undefined ? "short" : v)
  )
  const [apiMode, setApiMode] = useStorage<string>("apiMode", (v) =>
    v === undefined ? "local" : v
  )

  React.useEffect(() => {
    const initializeDefaults = async () => {
      if (isNotification === undefined) await setIsNotification(true)
      if (responseStyle === undefined) await setResponseStyle("short")
      if (apiMode === undefined) await setApiMode("local")
    }
    initializeDefaults()
  }, [])

  return (
    <div className="w-80 max-w-full p-4 bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] text-white shadow-2xl ring-1 ring-white/10 relative overflow-hidden">
      {/* Premium Glow Effects */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-full blur-3xl opacity-20 animate-pulse-slow"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] rounded-full blur-3xl opacity-15 animate-pulse-slow delay-1000"></div>

      {/* Header - More Compact */}
      <header className="flex items-center gap-3 mb-4 relative z-10">
        <div className="flex-shrink-0">
          <img
            src={logo}
            alt="InsightLens"
            className="w-10 h-10 drop-shadow-lg"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent drop-shadow-sm">
            InsightLens
          </h1>
          <p className="text-xs text-white/60 truncate leading-tight mt-0.5">
            Select code → Right click → Analyze
          </p>
        </div>

        <div className="flex-shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 ring-1 ring-green-500/20 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-green-400">Ready</span>
          </div>
        </div>
      </header>

      {/* Quick Overview - More Compact */}
      <section className="mb-4 p-3 rounded-lg bg-white/5 ring-1 ring-white/10 backdrop-blur-sm relative z-10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold mb-1.5 text-white/90 flex items-center gap-1.5">
              <FiZap className="text-[#06B6D4] text-xs" />
              Quick Start
            </h2>
            <p className="text-xs text-white/60 leading-relaxed">
              Select code, right-click, and choose "Analyze with InsightLens"
              for instant reviews.
            </p>
          </div>
          <button
            onClick={() => setShowDetails(true)}
            className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 text-xs font-medium flex items-center gap-1.5 group hover:ring-1 hover:ring-white/20">
            <FiInfo className="text-xs text-white/70 group-hover:text-white" />
            <span>Details</span>
          </button>
        </div>
      </section>

      {/* Configuration Toggles - Compact */}
      <section className="mb-4 space-y-3 relative z-10">
        {/* API Mode Toggle */}
        <div className="p-3 rounded-lg bg-white/5 ring-1 ring-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <FiCpu className="text-[#3B82F6] text-sm flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white/90 truncate">
                  Processing
                </div>
                <div className="text-xs text-white/60 truncate">
                  {apiMode === "local" ? "Local (secure)" : "Gemini (cloud)"}
                </div>
              </div>
            </div>
            <div
              className={`flex items-center p-1 rounded-lg bg-white/10 transition-all duration-200 ${apiMode === "gemini" ? "justify-end" : "justify-start"}`}>
              <button
                onClick={() => setApiMode("local")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                  apiMode === "local"
                    ? "bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white shadow-lg shadow-blue-500/25"
                    : "text-white/70 hover:text-white"
                }`}>
                <FiShield className="text-xs" />
                Local
              </button>
              <button
                onClick={() => setApiMode("gemini")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                  apiMode === "gemini"
                    ? "bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white shadow-lg shadow-blue-500/25"
                    : "text-white/70 hover:text-white"
                }`}>
                <FiGlobe className="text-xs" />
                Gemini
              </button>
            </div>
          </div>
        </div>

        {/* Response Style Toggle */}
        <div className="p-3 rounded-lg bg-white/5 ring-1 ring-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <FiFileText className="text-[#06B6D4] text-sm flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white/90 truncate">
                  Response
                </div>
                <div className="text-xs text-white/60 truncate">
                  {responseStyle === "short" ? "Quick summaries" : "Detailed"}
                </div>
              </div>
            </div>
            <div
              className={`flex items-center p-1 rounded-lg bg-white/10 transition-all duration-200 ${responseStyle === "detailed" ? "justify-end" : "justify-start"}`}>
              <button
                onClick={() => setResponseStyle("short")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                  responseStyle === "short"
                    ? "bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white shadow-lg shadow-blue-500/25"
                    : "text-white/70 hover:text-white"
                }`}>
                <FiZap className="text-xs" />
                Fast
              </button>
              <button
                onClick={() => setResponseStyle("detailed")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                  responseStyle === "detailed"
                    ? "bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white shadow-lg shadow-blue-500/25"
                    : "text-white/70 hover:text-white"
                }`}>
                <FiFileText className="text-xs" />
                Detailed
              </button>
            </div>
          </div>
        </div>

        {/* Notification Toggle */}
        <div className="p-3 rounded-lg bg-white/5 ring-1 ring-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <FiBell className="text-[#3B82F6] text-sm flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white/90 truncate">
                  Alerts
                </div>
                <div className="text-xs text-white/60 truncate">
                  {isNotification ? "Enabled" : "Disabled"}
                </div>
              </div>
            </div>
            <div
              className={`flex items-center p-1 rounded-lg bg-white/10 transition-all duration-200 ${isNotification ? "justify-end" : "justify-start"}`}>
              <button
                onClick={() => setIsNotification(false)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                  !isNotification
                    ? "bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white shadow-lg shadow-blue-500/25"
                    : "text-white/70 hover:text-white"
                }`}>
                Off
              </button>
              <button
                onClick={() => setIsNotification(true)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                  isNotification
                    ? "bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white shadow-lg shadow-blue-500/25"
                    : "text-white/70 hover:text-white"
                }`}>
                On
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Current Settings Summary - Compact */}
      <section className="p-3 rounded-lg bg-white/5 ring-1 ring-white/10 backdrop-blur-sm relative z-10">
        <h3 className="text-xs font-semibold mb-2 text-white/60 uppercase tracking-wider flex items-center gap-1.5">
          <FiSettings className="text-xs" />
          Current Settings
        </h3>
        <div className="flex items-center justify-between text-xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${apiMode === "local" ? "bg-gradient-to-r from-[#3B82F6] to-[#06B6D4]" : "bg-[#06B6D4]"}`}></div>
              <span className="text-white/80">
                {apiMode === "local" ? "Local API" : "Gemini API"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${responseStyle === "short" ? "bg-gradient-to-r from-[#3B82F6] to-[#06B6D4]" : "bg-[#06B6D4]"}`}></div>
              <span className="text-white/80">
                {responseStyle === "short"
                  ? "Fast Results"
                  : "Detailed Results"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${isNotification ? "bg-gradient-to-r from-[#3B82F6] to-[#06B6D4]" : "bg-red-400"}`}></div>
              <span className="text-white/80">
                {isNotification ? "Alerts On" : "Alerts Off"}
              </span>
            </div>
          </div>
          <div className="text-right text-xs text-white/40 space-y-1">
            <div className="flex items-center gap-1 justify-end">
              <FiLock className="text-xs" />
              <span>Privacy First</span>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <FiZap className="text-xs" />
              <span>Instant</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Compact */}
      <footer className="pt-3 mt-4 border-t border-white/10 relative z-10">
        <div className="flex items-center justify-between text-xs text-white/40">
          <div className="flex items-center gap-1">
            <FiCheck className="text-green-400 text-xs" />
            <span>Ready to analyze</span>
          </div>
          <div className="flex items-center gap-1">
            <span>v2.0</span>
          </div>
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
