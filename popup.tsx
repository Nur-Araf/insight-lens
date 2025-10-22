import logo from "data-base64:~/assets/logo.png"

import "./style.css"

import React, { useState } from "react"
import {
  FiBell,
  FiCheck,
  FiCpu,
  FiDownload,
  FiEye,
  FiEyeOff,
  FiFileText,
  FiGlobe,
  FiLock,
  FiMousePointer,
  FiShield,
  FiTarget,
  FiZap
} from "react-icons/fi"

import { useStorage } from "@plasmohq/storage/hook"

export default function IndexPopup() {
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

  const handleDownloadManual = async () => {
    const url =
      "https://drive.google.com/file/d/1ywq5yngv79UoDBUkcaQkwWkT9osvcXYD/view?usp=sharing"
    // Prefer chrome.tabs.create to open reliably from an extension
    chrome.tabs.create({ url })
  }

  return (
    <div className="w-[350px] max-w-full p-3 bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] text-white shadow-2xl ring-1 ring-purple-500/20 relative overflow-hidden">
      {/* Enhanced Glow Effects */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] rounded-full blur-4xl opacity-25 animate-pulse-slow"></div>
      <div className="absolute -bottom-24 -left-24 w-24 h-24 bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] rounded-full blur-4xl opacity-20 animate-pulse-slow delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-[#10B981] to-[#8B5CF6] rounded-full blur-3xl opacity-15 animate-pulse-slow delay-500"></div>

      {/* Header with Enhanced Glow */}
      <header className="flex items-center gap-2 mb-4 relative z-10">
        <div className="relative">
          <img
            src={logo}
            alt="InsightLens"
            className="w-8 h-8 drop-shadow-lg"
          />
          <div className="absolute inset-0 w-8 h-8 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] rounded-lg blur-sm opacity-50 -z-10"></div>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent drop-shadow-sm">
            InsightLens
          </h1>
          <p className="text-xs text-white/60 truncate">
            AI-Powered Code Analysis
          </p>
        </div>
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 ring-1 ring-green-500/30 backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-medium text-green-400">Active</span>
        </div>
      </header>

      {/* Analysis Settings Section */}
      <section className="mb-3 relative z-10">
        <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
          AI Analysis
        </h3>

        <div className="space-y-2">
          {/* API Mode */}
          <div className="p-2 rounded-xl bg-gradient-to-br from-white/5 to-white/2 ring-1 ring-cyan-500/20 backdrop-blur-sm hover:ring-cyan-500/30 transition-all duration-300">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <FiCpu className="text-cyan-400 text-xs" />
                <span className="text-xs font-medium text-white/90">
                  AI Provider
                </span>
              </div>
              <div
                className={`flex p-0.5 rounded-lg bg-white/5 ring-1 ring-white/10 ${apiMode === "gemini" ? "justify-end" : "justify-start"}`}>
                <button
                  onClick={() => setApiMode("local")}
                  className={`px-2 py-0.5 rounded text-xs transition-all duration-200 flex items-center gap-1 ${
                    apiMode === "local"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25"
                      : "text-white/70 hover:text-white"
                  }`}>
                  <FiShield className="text-xs" />
                  Local
                </button>
                <button
                  onClick={() => setApiMode("gemini")}
                  className={`px-2 py-0.5 rounded text-xs transition-all duration-200 flex items-center gap-1 ${
                    apiMode === "gemini"
                      ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/25"
                      : "text-white/70 hover:text-white"
                  }`}>
                  <FiGlobe className="text-xs" />
                  Gemini
                </button>
              </div>
            </div>
            <div className="text-xs text-cyan-300/70 flex items-center gap-1">
              {apiMode === "local" ? (
                <>
                  <FiLock className="text-xs" />
                  <span>Secure local processing</span>
                </>
              ) : (
                <>
                  <FiGlobe className="text-xs" />
                  <span>Cloud AI analysis</span>
                </>
              )}
            </div>
          </div>

          {/* Response Style */}
          <div className="p-2 rounded-xl bg-gradient-to-br from-white/5 to-white/2 ring-1 ring-purple-500/20 backdrop-blur-sm hover:ring-purple-500/30 transition-all duration-300">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <FiFileText className="text-purple-400 text-xs" />
                <span className="text-xs font-medium text-white/90">
                  Response Style
                </span>
              </div>
              <div
                className={`flex p-0.5 rounded-lg bg-white/5 ring-1 ring-white/10 ${responseStyle === "detailed" ? "justify-end" : "justify-start"}`}>
                <button
                  onClick={() => setResponseStyle("short")}
                  className={`px-2 py-0.5 rounded text-xs transition-all duration-200 flex items-center gap-1 ${
                    responseStyle === "short"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25"
                      : "text-white/70 hover:text-white"
                  }`}>
                  <FiZap className="text-xs" />
                  Fast
                </button>
                <button
                  onClick={() => setResponseStyle("detailed")}
                  className={`px-2 py-0.5 rounded text-xs transition-all duration-200 flex items-center gap-1 ${
                    responseStyle === "detailed"
                      ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/25"
                      : "text-white/70 hover:text-white"
                  }`}>
                  <FiFileText className="text-xs" />
                  Full
                </button>
              </div>
            </div>
            <div className="text-xs text-purple-300/70 flex items-center gap-1">
              {responseStyle === "short" ? (
                <>
                  <FiZap className="text-xs" />
                  <span>Quick summaries</span>
                </>
              ) : (
                <>
                  <FiFileText className="text-xs" />
                  <span>Detailed analysis</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Interface Settings Section */}
      <section className="mb-3 relative z-10">
        <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
          Interface
        </h3>

        <div className="space-y-2">
          {/* Notifications */}
          <div className="p-2 rounded-xl bg-gradient-to-br from-white/5 to-white/2 ring-1 ring-emerald-500/20 backdrop-blur-sm hover:ring-emerald-500/30 transition-all duration-300">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <FiBell className="text-emerald-400 text-xs" />
                <span className="text-xs font-medium text-white/90">
                  Notifications
                </span>
              </div>
              <div
                className={`flex p-0.5 rounded-lg bg-white/5 ring-1 ring-white/10 ${isNotification ? "justify-end" : "justify-start"}`}>
                <button
                  onClick={() => setIsNotification(false)}
                  className={`px-2 py-0.5 rounded text-xs transition-all duration-200 ${
                    !isNotification
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25"
                      : "text-white/70 hover:text-white"
                  }`}>
                  Off
                </button>
                <button
                  onClick={() => setIsNotification(true)}
                  className={`px-2 py-0.5 rounded text-xs transition-all duration-200 ${
                    isNotification
                      ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/25"
                      : "text-white/70 hover:text-white"
                  }`}>
                  On
                </button>
              </div>
            </div>
            <div className="text-xs text-emerald-300/70 flex items-center gap-1">
              {isNotification ? (
                <>
                  <FiBell className="text-xs" />
                  <span>Get completion alerts</span>
                </>
              ) : (
                <>
                  <FiBell className="text-xs" />
                  <span>Silent mode</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Status Summary with Glow */}
      <section className="mb-3 p-2 rounded-xl bg-gradient-to-br from-white/5 to-white/2 ring-1 ring-cyan-500/20 backdrop-blur-sm relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
            <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
            Current Settings
          </h3>
          <div className="flex items-center gap-1 text-cyan-300/70 text-xs">
            <FiLock className="text-xs" />
            <span>Secure</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${apiMode === "local" ? "bg-cyan-400 shadow-glow-cyan" : "bg-purple-400 shadow-glow-purple"}`}
            />
            <span className="text-white/70">
              {apiMode === "local" ? "Local AI" : "Gemini API"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${responseStyle === "short" ? "bg-cyan-400 shadow-glow-cyan" : "bg-purple-400 shadow-glow-purple"}`}
            />
            <span className="text-white/70">
              {responseStyle === "short" ? "Fast Mode" : "Full Mode"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${isNotification ? "bg-emerald-400 shadow-glow-emerald" : "bg-red-400 shadow-glow-red"}`}
            />
            <span className="text-white/70">
              {isNotification ? "Alerts On" : "Alerts Off"}
            </span>
          </div>
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="mb-3 p-2 rounded-xl bg-gradient-to-br from-white/5 to-white/2 ring-1 ring-amber-500/20 backdrop-blur-sm relative z-10 hover:ring-amber-500/30 transition-all duration-300">
        <div className="flex items-center gap-2">
          <FiTarget className="text-amber-400 text-[10px]" />
          <div className="flex items-center gap-1 text-[11px] text-amber-300/80">
            <span>Press</span>
            <kbd className="px-1 py-0.5 bg-amber-500/20 rounded text-amber-300 border border-amber-500/30 font-medium text-[10px] mx-0.5">
              Ctrl+Shift+R
            </kbd>
            <span>Or</span>
            <FiMousePointer className="text-amber-400/70 text-[10px] mx-0.5" />
            <kbd className="px-1 py-0.5 bg-amber-500/20 rounded text-amber-300 border border-amber-500/30 font-medium text-[10px] mx-0.5">
              Select Code
            </kbd>
          </div>
        </div>
      </section>

      {/* Gemini Installation Notice */}
        {apiMode === "local" && (
          <div className="mb-3 text-[10px] text-amber-300/70 text-center bg-amber-500/10 rounded-lg p-1.5 border border-amber-500/20 backdrop-blur-sm">
            <span className="flex items-center justify-center gap-1">
              <FiGlobe className="text-[10px]" />
              Make sure you have Gemini Neno installed
            </span>
          </div>
        )}

      {/* Download Button at Bottom */}
      <section className="relative z-10">
        <button
          onClick={handleDownloadManual}
          className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 transition-all duration-300 text-sm font-medium flex items-center justify-center gap-2 group ring-1 ring-purple-500/30 hover:ring-purple-500/50 backdrop-blur-sm">
          <FiDownload className="text-purple-300 group-hover:text-cyan-300 transition-colors duration-300" />
          <span className="bg-gradient-to-r from-purple-200 to-cyan-200 bg-clip-text text-transparent group-hover:from-purple-100 group-hover:to-cyan-100 transition-all duration-300">
            Download User Guide
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl blur-sm opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10"></div>
        </button>
      </section>

      {/* Enhanced Footer with Gemini Notice */}
      <footer className="mt-3 pt-2 border-t border-white/10 relative z-10">
        <div className="flex items-center justify-between text-xs text-white/40 mb-1">
          <div className="flex items-center gap-1">
            <FiCheck className="text-emerald-400 text-xs" />
            <span>Ready to analyze</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
            <span>v2.0</span>
          </div>
        </div>
      </footer>

      {/* Custom glow shadows */}
      <style>{`
        .shadow-glow-cyan { box-shadow: 0 0 6px rgba(6, 182, 212, 0.5); }
        .shadow-glow-purple { box-shadow: 0 0 6px rgba(139, 92, 246, 0.5); }
        .shadow-glow-blue { box-shadow: 0 0 6px rgba(59, 130, 246, 0.5); }
        .shadow-glow-emerald { box-shadow: 0 0 6px rgba(16, 185, 129, 0.5); }
        .shadow-glow-yellow { box-shadow: 0 0 6px rgba(245, 158, 11, 0.5); }
        .shadow-glow-red { box-shadow: 0 0 6px rgba(239, 68, 68, 0.5); }
      `}</style>
    </div>
  )
}
