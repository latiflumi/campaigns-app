"use client"

// app/users/AutoRefresh.tsx
// Re-renders the server page every `seconds` while the tab is visible, so presence stays current.
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter()
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh()
    }, seconds * 1000)
    return () => clearInterval(timer)
  }, [router, seconds])
  return null
}
