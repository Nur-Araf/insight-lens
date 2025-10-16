import React, { useEffect, useState } from "react"
import ReactDOM from "react-dom"

type NotificationData = {
  message: string
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

const NotificationRoot: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [toast, setToast] = useState<NotificationData | null>(null)

  useEffect(() => {
    const listener = (msg: any) => {
      if (msg.type === "SHOW_NOTIFICATION") {
        const { message } = msg.payload
        setToast({ message })

        // Play sound
        const audio = new Audio(chrome.runtime.getURL("assets/notify.mp3"))
        audio.volume = 0.7
        audio.play().catch(console.error)

        // Hide toast after animation
        setTimeout(() => {
          setToast(null)
          // 🧹 Unmount component & clean up
          setTimeout(onDone, 300)
        }, 2500)
      }
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [onDone])

  return toast ? <Toast message={toast.message} /> : null
}

// Create container
const container = document.createElement("div")
document.body.appendChild(container)

// Render notification and clean up after done
ReactDOM.render(
  <NotificationRoot
    onDone={() => {
      ReactDOM.unmountComponentAtNode(container)
      container.remove()
      // Optional: fully stop the script execution
      setTimeout(() => {
        console.log(" Notification script cleaned up and stopped.")
        window.close?.() // harmless in content script, but signals completion
      }, 100)
    }}
  />,
  container
)
