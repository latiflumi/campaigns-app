"use client"

// app/AppToaster.tsx
// Sonner's own "system" mode only reads the OS setting, so this keeps the
// toasts in step with the header's light/dark toggle.

import { useEffect, useState } from "react"
import { Toaster } from "sonner"

type Theme = "light" | "dark" | "system"

export default function AppToaster({ initialTheme }: { initialTheme: Theme }) {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => {
      const value = root.getAttribute("data-theme")
      setTheme(value === "dark" || value === "light" ? value : "system")
    })
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] })
    return () => observer.disconnect()
  }, [])

  return <Toaster position="top-right" richColors closeButton theme={theme} />
}
