"use client"

// app/lib/i18n/client.tsx
// Language for client components. The root layout passes the locale from the cookie; both dictionaries
// are bundled (they hold functions, which can't be passed from server to client as props).
import { createContext, useContext } from "react"
import { DEFAULT_LOCALE, type Locale } from "./config"
import { dictionaries, type Dict } from "./dictionaries"

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE)

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export const useLocale = () => useContext(LocaleContext)

/** The dictionary for the current language. */
export const useT = (): Dict => dictionaries[useContext(LocaleContext)]
