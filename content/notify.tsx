// content/notify.tsx
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
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastPlayRef = useRef<number>(0) // timestamp of last play

  useEffect(() => {
    // init audio once
    if (!audioRef.current) {
      const a = new Audio(chrome.runtime.getURL("assets/notify.mp3"))
      a.volume = 0.7
      // allow quick stops/resets
      a.preload = "auto"
      audioRef.current = a
    }

    const listener = (msg: any) => {
      if (msg?.type !== "SHOW_NOTIFICATION") return
      const { message } = msg.payload || {}

      // debounce/guard repeated messages (500ms default)
      const now = Date.now()
      if (now - lastPlayRef.current < 500) {
        // ignore extremely rapid duplicates
        return
      }
      lastPlayRef.current = now

      // show toast
      setToast({ message })

      // play sound (reset first to avoid overlapping)
      try {
        const audio = audioRef.current!
        audio.pause()
        audio.currentTime = 0
        // play returns a promise in modern browsers
        audio.play().catch((e) => {
          // ignore autoplay errors
          console.debug("Audio play error:", e)
        })
      } catch (err) {
        console.error("play sound failed", err)
      }

      // clear any pending hide timer and set new one
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = window.setTimeout(() => {
        setToast(null)
        timeoutRef.current = null
      }, 2500)
    }

    chrome.runtime.onMessage.addListener(listener)

    return () => {
      chrome.runtime.onMessage.removeListener(listener)
      // cleanup timer and audio on page unload
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (audioRef.current) {
        try {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        } catch {}
      }
    }
  }, [])

  return toast ? <Toast message={toast.message} /> : null
}

/**
 * Prevent multiple mountings if the content script is executed multiple times.
 * This can happen if background uses scripting.executeScript repeatedly.
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

  // Optional: cleanup flag on unload so next page/run can re-init
  window.addEventListener("beforeunload", () => {
    try {
      ;(window as any).__plasmo_notify_initialized = false
    } catch {}
  })
} else {
  // already initialized — nothing to do
  // console.debug("notify already initialized on this page")
}
