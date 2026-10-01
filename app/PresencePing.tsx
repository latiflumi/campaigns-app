"use client"

// app/PresencePing.tsx
// Tells the server "still here" once a minute while this tab is visible, so someone reading a dashboard
// without clicking still shows as online. Hidden tabs don't ping; coming back pings straight away.
import { useEffect } from "react"
import { pingPresence } from "./actions/presence"

const EVERY_MS = 60_000

export default function PresencePing() {
  useEffect(() => {
    const ping = () => {
      if (document.visibilityState === "visible") pingPresence().catch(() => {})
    }
    const timer = setInterval(ping, EVERY_MS)
    document.addEventListener("visibilitychange", ping)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", ping)
    }
  }, [])
  return null
}
