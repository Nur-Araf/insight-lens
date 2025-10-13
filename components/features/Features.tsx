import React, { useState } from "react"

import "../../style.css"

// Details Component
const ExtensionDetails = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const features = [
    {
      icon: "🔍",
      title: "Code Review",
      description: "Get instant feedback on selected code"
    },
    {
      icon: "🔒",
      title: "Security Check",
      description: "Identify potential vulnerabilities"
    },
    {
      icon: "⚡",
      title: "Refactor",
      description: "Optimize and improve code structure"
    },
    {
      icon: "🧪",
      title: "Generate Tests",
      description: "Create test cases for your code"
    },
    {
      icon: "🤖",
      title: "Ask AI",
      description: "Ask anything about the code"
    }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl ring-1 ring-white/10 max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            How to Use InsightLens
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Steps */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
              <span>🎯</span> Quick Start
            </h3>
            <div className="space-y-3 text-sm text-white/60">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                  1
                </div>
                <span>Select any code snippet on any webpage</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                  2
                </div>
                <span>Right-click and choose "Analyze with InsightLens"</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                  3
                </div>
                <span>
                  Choose your preferred analysis type and get instant results
                </span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
              <span>🛠️</span> Analysis Options
            </h3>
            <div className="grid gap-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 ring-1 ring-white/10">
                  <div className="text-2xl">{feature.icon}</div>
                  <div>
                    <div className="text-sm font-semibold">{feature.title}</div>
                    <div className="text-xs text-white/60">
                      {feature.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supported Sites */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
              <span>🌐</span> Works On
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                "GitHub",
                "StackOverflow",
                "Documentation",
                "Blogs",
                "CodePen",
                "GitLab"
              ].map((site) => (
                <span
                  key={site}
                  className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/60 ring-1 ring-white/10">
                  {site}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium">
            Got it, let's start!
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExtensionDetails
