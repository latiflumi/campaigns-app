// app/lib/i18n/dictionaries.ts
import type { Locale } from "./config"
import { en, type Dict } from "./en"
import { sq } from "./sq"

export type { Dict }
export const dictionaries: Record<Locale, Dict> = { en, sq }
