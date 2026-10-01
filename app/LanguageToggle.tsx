"use client"

// app/LanguageToggle.tsx
// EN | SQ switch. Saves the choice in the `lang` cookie (read by app/layout.tsx) and re-renders the
// server components, so every page and server message follows the new language.
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { LOCALES, LOCALE_COOKIE, type Locale } from "./lib/i18n/config"
import { useLocale, useT } from "./lib/i18n/client"

/** Remembers the language for a year; the server reads it on the next render. */
function saveLocale(next: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
  document.documentElement.setAttribute("lang", next)
}

export default function LanguageToggle({ className = "" }: { className?: string }) {
  const locale = useLocale()
  const t = useT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const choose = (next: Locale) => {
    if (next === locale) return
    saveLocale(next)
    startTransition(() => router.refresh())
  }

  // Follows light/dark like the header it sits in
  const base = "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
  const on = "bg-white text-neutral-900 shadow-sm dark:bg-neutral-600 dark:text-white"
  const off = "hover:text-neutral-800 dark:hover:text-white"

  return (
    <div role="radiogroup" aria-label={t.nav.language} className={`inline-flex items-center gap-0.5 rounded-full p-0.5 ${base} ${pending ? "opacity-70" : ""} ${className}`}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={l === locale}
          onClick={() => choose(l)}
          lang={l}
          title={l === "en" ? "English" : "Shqip"}
          className={`cursor-pointer rounded-full px-2 py-0.5 text-[11px] font-bold uppercase transition-colors ${l === locale ? on : off}`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
