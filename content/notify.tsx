import React, { useEffect, useRef, useState } from "react"
import ReactDOM from "react-dom"

type NotificationData = { message: string }

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
  const timeoutRef = useRef<number | null>(null)
  const lastPlayRef = useRef<number>(0) // timestamp of last show

  useEffect(() => {
    const listener = (msg: any) => {
      if (msg?.type !== "SHOW_NOTIFICATION") return
      const { message } = msg.payload || {}

      // debounce/guard repeated messages (500ms default)
      const now = Date.now()
      if (now - lastPlayRef.current < 500) return
      lastPlayRef.current = now

      // show toast
      setToast({ message })

      // clear any pending hide timer and set new one
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
  }, [])

  return toast ? <Toast message={toast.message} /> : null
}

/**
 * Prevent multiple mountings if the content script is executed multiple times.
 */
if (!(window as any).__plasmo_notify_initialized) {
  ;(window as any).__plasmo_notify_initialized = true

  const containerId = "plasmo-notification-root"
  let container = document.getElementById(containerId) as HTMLDivElement | null

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
