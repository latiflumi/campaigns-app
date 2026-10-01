// app/lib/i18n/server.ts
// Language for server components and server actions, from the `lang` cookie.
import "server-only"
import { cookies } from "next/headers"
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config"
import { dictionaries, type Dict } from "./dictionaries"

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
}

/** The dictionary for the current request. */
export async function getT(): Promise<Dict> {
  return dictionaries[await getLocale()]
}
