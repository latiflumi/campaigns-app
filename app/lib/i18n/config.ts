// app/lib/i18n/config.ts
// Language settings shared by server and client. The choice lives in a `lang` cookie (like `theme`),
// read by the root layout, so the server renders the right language on every request.

export const LOCALES = ["en", "sq"] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "sq"
export const LOCALE_COOKIE = "lang"

export const isLocale = (v: string | undefined | null): v is Locale => !!v && (LOCALES as readonly string[]).includes(v)
