// app/lib/bi/attributes.ts
// Display helpers for the ERP's product attributes (labels in the ERP are Albanian).
import type { BiAttributes } from "./types"
import type { Dict } from "@/app/lib/i18n/dictionaries"

/** ERP gender label in the current language (English labels from t.genders; Albanian = the ERP's own). */
export const genderLabel = (erpName: string | null | undefined, t: Dict) => (erpName ? (t.genders[erpName] ?? erpName) : null)

const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** erp-api season labels are English ("Sep 2026"); NOOS and odd codes stay as they are. */
export function seasonText(label: string | null | undefined, t: Dict) {
  if (!label) return null
  const m = /^([A-Z][a-z]{2}) (\d{4})$/.exec(label)
  const i = m ? EN_MONTHS.indexOf(m[1]) : -1
  return i >= 0 ? `${t.dates.months[i]} ${m![2]}` : label
}

export interface Option {
  value: string
  label: string
}
export interface OptionGroup {
  label?: string
  options: Option[]
}
export interface ProductOptions {
  genders: Option[]
  seasons: OptionGroup[]
  brands: Option[]
}

/**
 * Filter options from /bi/attributes. Single collections are limited to the last 18 months and
 * upcoming ones; older stock is still reachable through its collection year.
 */
export function productOptions(a: BiAttributes, t: Dict, now = new Date()): ProductOptions {
  const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 18, 1))
  const minKey = `${String(since.getUTCFullYear()).slice(2)}${String(since.getUTCMonth() + 1).padStart(2, "0")}`
  return {
    genders: a.genders.map((g) => ({ value: String(g.id), label: genderLabel(g.name, t) ?? g.name })),
    seasons: [
      { options: [{ value: a.seasons.noos.key, label: t.bi.filter.noos }] },
      { label: t.bi.filter.collectionYear, options: a.seasons.years.map((y) => ({ value: y.key, label: t.bi.filter.collections(y.key) })) },
      {
        label: t.bi.filter.collection,
        options: a.seasons.collections.filter((c) => c.key >= minKey).map((c) => ({ value: c.key, label: seasonText(c.label, t) ?? c.key })),
      },
    ],
    brands: a.brands.filter((b) => b.sales > 0).map((b) => ({ value: b.key, label: b.name })),
  }
}

/** Human summary of the product filter, e.g. "Men · NOOS · Jack & Jones"; null when none is set. */
export function productFilterText(f: { gender: string; season: string; pbrand: string }, o: ProductOptions | null) {
  const find = (opts: Option[], v: string) => opts.find((x) => x.value === v)?.label ?? v
  const parts: string[] = []
  if (f.gender !== "all") parts.push(o ? find(o.genders, f.gender) : `gender ${f.gender}`)
  if (f.season !== "all") parts.push(o ? find(o.seasons.flatMap((g) => g.options), f.season).replace(/ \(.*\)$/, "") : f.season)
  if (f.pbrand !== "all") parts.push(o ? find(o.brands, f.pbrand) : f.pbrand)
  return parts.length ? parts.join(" · ") : null
}
