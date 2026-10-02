// app/lib/bi/erp.ts
// Server-only client for the erp-api /bi/* endpoints. Carries the internal API key, so it must never
// reach the browser.
import "server-only"
import type { BiAttributes, BiCategories, BiProduct, BiSegments, BiStockAlerts, BiStoreMeta, BiSummary, BiTimeseries } from "./types"
import type { Compare, ProductFilter } from "./filters"
import { getT } from "@/app/lib/i18n/server"

type Query = Record<string, string | number | undefined>

async function get<T>(path: string, query: Query = {}): Promise<T> {
  const url = new URL(`http://${process.env.API_URL}${path}`)
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== "") url.searchParams.set(k, String(v))

  const res = await fetch(url, {
    headers: { "x-api-key": process.env.INTERNAL_API_KEY! },
    next: { revalidate: 120 }, // erp-api caches too; this just avoids refetching on every navigation
    signal: AbortSignal.timeout(90_000),
  })
  if (!res.ok) throw new Error(`erp-api ${path} responded ${res.status}`)
  return res.json() as Promise<T>
}

export interface Range extends ProductFilter {
  from: string
  to: string
  compare: Compare
  cmpFrom?: string // compare=custom only
  cmpTo?: string
  stores?: string // comma-separated ids; empty = all stores
}

export const getBiStores = () => get<BiStoreMeta[]>("/bi/stores")
export const getBiSummary = (r: Range) => get<BiSummary>("/bi/summary", { ...r })
export const getBiTimeseries = (r: Range) => get<BiTimeseries>("/bi/timeseries", { ...r })
export const getBiCategories = (r: Range) => get<BiCategories>("/bi/categories", { ...r })
export const getBiProducts = (r: Omit<Range, "compare" | "cmpFrom" | "cmpTo">, limit = 8) => get<BiProduct[]>("/bi/products", { ...r, limit })
// Stock and filter options have no price side: the price filter is left out (and the cache shared)
export const getBiStockAlerts = (stores: string | undefined, limit = 8, filter: ProductFilter = {}) =>
  get<BiStockAlerts>("/bi/stock-alerts", { stores, limit, ...filter, price: undefined })
export const getBiSegments = (r: Range) => get<BiSegments>("/bi/segments", { ...r })
/**
 * Filter options (genders, seasons, brands) sold in the last 365 days, chain-wide by default. With stores
 * and/or a product filter the lists are faceted: each is narrowed by the store scope and the other filters.
 */
export const getBiAttributes = (stores = "", filter: ProductFilter = {}) => get<BiAttributes>("/bi/attributes", { stores, ...filter, price: undefined })

/** Awaits a promise without throwing, so one failing section doesn't take the whole page down. */
export async function settle<T>(p: Promise<T>): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    return { data: await p, error: null }
  } catch (e) {
    console.error("[bi]", e instanceof Error ? e.message : e)
    return { data: null, error: (await getT()).bi.erpError }
  }
}
