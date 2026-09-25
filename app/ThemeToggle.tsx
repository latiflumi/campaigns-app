"use client"

// app/ThemeToggle.tsx
// Flips between light and dark. The choice lives in a `theme` cookie that the
// root layout reads, so the server renders the right theme on the next request.
// The icon is picked with CSS (dark:), so server and client markup always match.

import { Moon, Sun } from "lucide-react"

// Keep in sync with the cookie name read in app/layout.tsx
const THEME_COOKIE = "theme"

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const toggle = () => {
    const root = document.documentElement
    const current =
      root.getAttribute("data-theme") ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    const next = current === "dark" ? "light" : "dark"
    root.setAttribute("data-theme", next)
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark mode"
      title="Toggle light / dark"
      className={`inline-flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors ${className}`}
    >
      <Moon className="size-4 dark:hidden" />
      <Sun className="hidden size-4 dark:block" />
    </button>
  )
}
