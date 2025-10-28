import React, { useEffect, useRef, useState } from "react"
import ReactDOM from "react-dom"

import { Storage } from "@plasmohq/storage"

import type { PlasmoCSConfig } from "~node_modules/plasmo/dist/type"

const storage = new Storage()

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

type NotificationData = { message: string }

// --- Safe boolean parser ---
const toBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value
  if (typeof value === "string") return value.toLowerCase() === "true"
  return false
}

const Toast: React.FC<{ message: string }> = ({ message }) => (
  <div
    style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: 999999,
      animation: "fade-in-out 2.5s ease-in-out"
    }}>
    <div
      style={{
        backgroundColor: "#0f172a",
        color: "white",
        padding: "10px 16px",
        borderRadius: "12px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
        border: "1px solid #1e293b",
        maxWidth: "300px",
        fontSize: "14px",
        lineHeight: "1.4"
      }}>
      {message}
    </div>

    <style>
      {`
        @keyframes fade-in-out {
          0% { opacity: 0; transform: translateY(20px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(20px); }
        }
      `}
    </style>
  </div>
)

const NotificationRoot: React.FC = () => {
  const [toast, setToast] = useState<NotificationData | null>(null)
  const [isExtensionEnabled, setIsExtensionEnabled] = useState<boolean>(true)
  const timeoutRef = useRef<number | null>(null)
  const lastPlayRef = useRef<number>(0)

  // Check extension enabled status on mount and listen for changes
  useEffect(() => {
    const checkExtensionStatus = async () => {
      const enabled = await storage.get("isExtensionEnabled")
      setIsExtensionEnabled(toBoolean(enabled))
    }

    checkExtensionStatus()

    // Listen for storage changes
    storage.watch({
      isExtensionEnabled: (change) => {
        setIsExtensionEnabled(toBoolean(change.newValue))
      }
    })

    return () => {
      // Cleanup if needed
    }
  }, [])

  useEffect(() => {
    // Only set up message listener if extension is enabled
    if (!isExtensionEnabled) {
      setToast(null)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    const listener = (msg: any) => {
      if (msg?.type !== "SHOW_NOTIFICATION") return
      const { message } = msg.payload || {}

      const now = Date.now()
      if (now - lastPlayRef.current < 500) return
      lastPlayRef.current = now

      setToast({ message })

      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => {
        setToast(null)
        timeoutRef.current = null
      }, 2500)
    }

    chrome.runtime.onMessage.addListener(listener)

    return () => {
      chrome.runtime.onMessage.removeListener(listener)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isExtensionEnabled])

  // Don't render anything if extension is disabled
  if (!isExtensionEnabled) {
    return null
  }

  return toast ? <Toast message={toast.message} /> : null
}

/**
 * Initialize the content script with extension status check
 */
const initializeContentScript = async () => {
  const enabled = await storage.get("isExtensionEnabled")

  if (!toBoolean(enabled)) {
    console.log("InsightLens: Extension is disabled")
    return
  }

  if (!(window as any).__plasmo_notify_initialized) {
    ;(window as any).__plasmo_notify_initialized = true

    const containerId = "plasmo-notification-root"
    let container = document.getElementById(
      containerId
    ) as HTMLDivElement | null

    if (!container) {
      container = document.createElement("div")
      container.id = containerId
      document.body.appendChild(container)
    }

    ReactDOM.render(<NotificationRoot />, container)

    window.addEventListener("beforeunload", () => {
      try {
        ;(window as any).__plasmo_notify_initialized = false
      } catch {}
    })
  }
}

// Initialize the content script
initializeContentScript()

// Optional: Listen for storage changes to enable/disable dynamically
storage.watch({
  isExtensionEnabled: async (change) => {
    const isEnabled = toBoolean(change.newValue)

    if (isEnabled) {
      await initializeContentScript()
    } else {
      console.log("InsightLens: Extension disabled - cleaning up")
      const container = document.getElementById("plasmo-notification-root")
      if (container) {
        ReactDOM.unmountComponentAtNode(container)
      }
      ;(window as any).__plasmo_notify_initialized = false
    }
  }
})
