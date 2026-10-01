// app/lib/bi/filters.ts
// BI filters live in the URL so a view can be shared as a link, e.g.
//   ?period=mtd&compare=ly&brand=jack-jones&gender=23168&season=noos&pbrand=only
//   ?period=custom&from=2026-09-01&to=2026-09-15&compare=custom&cf=2025-09-01&ct=2025-09-15
//   brand  = store chain (from the store name); gender / season / pbrand = product filter (erp-api)
// Labels live in the i18n dictionary (t.bi.presets / t.bi.compares).
import type { Dict } from "@/app/lib/i18n/dictionaries"

export const PRESETS = [
  { id: "today" },
  { id: "yesterday" },
  { id: "7d" },
  { id: "30d" },
  { id: "mtd" },
  { id: "lm" },
  { id: "qtd" },
  { id: "ytd" },
] as const

/** Presets shown as quick buttons in the filter bar; the rest are in the date picker. */
export const QUICK_PRESETS = ["7d", "30d", "mtd", "qtd", "ytd"] as const

export type Preset = (typeof PRESETS)[number]["id"]
export type Period = Preset | "custom"
/** ly = same dates last year · lyw = same weekdays (364 days back) · pp = previous period · custom */
export type Compare = "ly" | "lyw" | "pp" | "custom"

export const COMPARES: { id: Compare }[] = [{ id: "ly" }, { id: "lyw" }, { id: "pp" }, { id: "custom" }]

export interface BiFilters {
  period: Period
  compare: Compare
  brand: string // store chain: brandKey or "all"
  gender: string // KlasifikatoretDetale id or "all"
  season: string // "noos", collection year "26", collection "2609" or "all"
  pbrand: string // product brand key from /bi/attributes or "all"
  from: string
  to: string
  cmpFrom: string
  cmpTo: string
}

export type UrlFilters = Omit<BiFilters, "from" | "to" | "cmpFrom" | "cmpTo"> & {
  from?: string
  to?: string
  cmpFrom?: string
  cmpTo?: string
}

/** Longest range erp-api accepts. */
export const MAX_DAYS = 400

const DAY = 86_400_000
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const ms = (d: string) => Date.parse(`${d}T00:00:00Z`)

export const todayIso = (now = Date.now()) => iso(now)
export const rangeDays = (from: string, to: string) => Math.round((ms(to) - ms(from)) / DAY) + 1

export function presetRange(preset: Preset, now = Date.now()): { from: string; to: string } {
  const d = new Date(now)
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth()
  const today = Date.UTC(y, m, d.getUTCDate())
  switch (preset) {
    case "today":
      return { from: iso(today), to: iso(today) }
    case "yesterday":
      return { from: iso(today - DAY), to: iso(today - DAY) }
    case "7d":
      return { from: iso(today - 6 * DAY), to: iso(today) }
    case "30d":
      return { from: iso(today - 29 * DAY), to: iso(today) }
    case "mtd":
      return { from: iso(Date.UTC(y, m, 1)), to: iso(today) }
    case "lm":
      return { from: iso(Date.UTC(y, m - 1, 1)), to: iso(Date.UTC(y, m, 1) - DAY) }
    case "qtd":
      return { from: iso(Date.UTC(y, Math.floor(m / 3) * 3, 1)), to: iso(today) }
    case "ytd":
      return { from: iso(Date.UTC(y, 0, 1)), to: iso(today) }
  }
}

/** A real YYYY-MM-DD date. */
export const isDate = (s: string | undefined): s is string =>
  !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(ms(s)) && iso(ms(s)) === s

export type RangeError = "both" | "order" | "max"

/** Why a range can't be used, or null when it's fine (t.bi.picker has the messages). */
export function rangeError(from: string | undefined, to: string | undefined): RangeError | null {
  if (!isDate(from) || !isDate(to)) return "both"
  if (from > to) return "order"
  if (rangeDays(from, to) > MAX_DAYS) return "max"
  return null
}

/** Same calendar date one year earlier; 29 Feb becomes 28 Feb. */
export const lastYear = (d: string) => `${Number(d.slice(0, 4)) - 1}-${d.slice(5) === "02-29" ? "02-28" : d.slice(5)}`

/** Same rules as erp-api's comparisonRange. */
export function comparisonRange(from: string, to: string, compare: Compare, custom?: { from: string; to: string }) {
  if (compare === "custom" && custom) return { from: custom.from, to: custom.to }
  if (compare === "ly" || compare === "custom") return { from: lastYear(from), to: lastYear(to) }
  if (compare === "lyw") return { from: iso(ms(from) - 364 * DAY), to: iso(ms(to) - 364 * DAY) }
  const len = ms(to) - ms(from) + DAY
  return { from: iso(ms(from) - len), to: iso(ms(from) - DAY) }
}

type Params = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export function parseFilters(params: Params, now = Date.now()): BiFilters {
  const today = todayIso(now)

  // Period: a preset, or custom dates (cut off at today, like erp-api)
  const p = one(params.period)
  let period: Period = p === "custom" || PRESETS.some((x) => x.id === p) ? (p as Period) : "mtd"
  let range = { from: "", to: "" }
  if (period === "custom") {
    const f = one(params.from), t = one(params.to)
    if (!rangeError(f, t) && f! <= today) range = { from: f!, to: t! > today ? today : t! }
    else period = "mtd"
  }
  if (period !== "custom") range = presetRange(period, now)

  // Comparison
  const c = one(params.compare)
  let compare: Compare = COMPARES.some((x) => x.id === c) ? (c as Compare) : "ly"
  const cf = one(params.cf), ct = one(params.ct)
  if (compare === "custom" && rangeError(cf, ct)) compare = "ly"
  const cmp = comparisonRange(range.from, range.to, compare, compare === "custom" ? { from: cf!, to: ct! } : undefined)

  const brand = (one(params.brand) ?? "all").toLowerCase().replace(/[^a-z0-9-]/g, "") || "all"
  const g = one(params.gender) ?? ""
  const gender = /^\d{1,10}$/.test(g) ? g : "all"
  const s = (one(params.season) ?? "").toLowerCase()
  const season = s === "noos" || /^\d{2}(\d{2})?$/.test(s) ? s : "all"
  const pbrand = (one(params.pbrand) ?? "all").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60) || "all"

  return { period, compare, brand, gender, season, pbrand, ...range, cmpFrom: cmp.from, cmpTo: cmp.to }
}

const parts = (d: string, t: Dict) => ({ y: d.slice(0, 4), m: t.dates.months[Number(d.slice(5, 7)) - 1], d: String(Number(d.slice(8))) })

/** "1 – 30 Sep 2026", "28 Aug – 3 Sep 2026", "15 Dec 2025 – 3 Jan 2026", "1 Sep 2026" */
export function formatRange(t: Dict, from: string, to: string) {
  const a = parts(from, t), b = parts(to, t)
  if (from === to) return `${a.d} ${a.m} ${a.y}`
  if (a.y !== b.y) return `${a.d} ${a.m} ${a.y} – ${b.d} ${b.m} ${b.y}`
  if (a.m !== b.m) return `${a.d} ${a.m} – ${b.d} ${b.m} ${b.y}`
  return `${a.d} – ${b.d} ${b.m} ${b.y}`
}

/** Text after a number, e.g. "vs last year" or "vs 1 – 15 Sep 2024". */
export function compareLabel(f: Pick<BiFilters, "compare" | "cmpFrom" | "cmpTo">, t: Dict) {
  if (f.compare === "custom") return t.bi.compareText.custom(formatRange(t, f.cmpFrom, f.cmpTo))
  return t.bi.compareText[f.compare]
}

/** Query string for links that keep the current filters. Preset dates are recomputed, custom ones kept. */
export function filterQuery(f: UrlFilters) {
  const q = new URLSearchParams({ period: f.period })
  if (f.period === "custom" && f.from && f.to) {
    q.set("from", f.from)
    q.set("to", f.to)
  }
  q.set("compare", f.compare)
  if (f.compare === "custom" && f.cmpFrom && f.cmpTo) {
    q.set("cf", f.cmpFrom)
    q.set("ct", f.cmpTo)
  }
  for (const k of ["brand", "gender", "season", "pbrand"] as const) if (f[k] && f[k] !== "all") q.set(k, f[k])
  return q.toString()
}

/** The comparison part of the filters, as erp-api query params. */
export function compareParams(f: Pick<BiFilters, "compare" | "cmpFrom" | "cmpTo">) {
  return f.compare === "custom" ? { compare: f.compare, cmpFrom: f.cmpFrom, cmpTo: f.cmpTo } : { compare: f.compare }
}

/** The product part of the filters, as erp-api query params (undefined = not set). */
export function productFilter(f: Pick<BiFilters, "gender" | "season" | "pbrand">): ProductFilter {
  return {
    gender: f.gender === "all" ? undefined : f.gender,
    season: f.season === "all" ? undefined : f.season,
    brand: f.pbrand === "all" ? undefined : f.pbrand,
  }
}

export interface ProductFilter {
  gender?: string
  season?: string
  brand?: string
}

export const hasProductFilter = (f: ProductFilter) => Boolean(f.gender || f.season || f.brand)
