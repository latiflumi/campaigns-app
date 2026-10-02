// app/lib/alerts/render.ts
// Turns a stored notification (kind + data) into text in the reader's language, plus where it links.
// Pure: used by the bell (client) and the notifications page (server).
import type { Dict } from "../i18n/dictionaries"
import { cleanName } from "../bi/brands"
import { formatEurWhole } from "../../campaigns/_components/campaign-utils"
import type { CampaignData, ManyData, OutOfStockData, SalesDropData, StoreScope } from "./types"

export type Tone = "red" | "amber" | "sky" | "neutral"

export interface RenderedNotification {
  title: string
  body: string
  href: string
  tone: Tone
  /** Product photo for out-of-stock notifications */
  product?: { styleNumber: string | null; colorCode: string | null; name: string }
}

const pct = (ratio: number) => `${ratio >= 0 ? "+" : "−"}${Math.abs(Math.round(ratio * 1000) / 10).toString().replace(".", ",")}%`

export function renderNotification(n: { kind: string; data: unknown }, t: Dict): RenderedNotification {
  const a = t.alerts
  switch (n.kind) {
    case "sales_drop": {
      const d = n.data as SalesDropData
      const period = d.period === "yesterday" ? "period=yesterday" : `period=custom&from=${d.from}&to=${d.to}`
      return {
        // Full store name: short ones repeat across chains (two "Galeri" stores)
        title: a.salesDrop(cleanName(d.storeName), pct(d.growth), a.periods[d.period] ?? d.period),
        body: a.salesDropBody(formatEurWhole(d.sales), formatEurWhole(d.previous)),
        href: `/bi/stores/${d.orgId}?${period}&compare=ly`,
        tone: "red",
      }
    }
    case "out_of_stock": {
      const d = n.data as OutOfStockData
      const product = [d.productName, d.size].filter(Boolean).join(" · ")
      const send = d.sendFrom ? a.sendFrom(String(d.sendFrom.units), d.sendFrom.isWarehouse ? t.bi.stock.warehouse : cleanName(d.sendFrom.name)) : ""
      return {
        title: a.outOfStock(cleanName(d.storeName), product),
        body: a.outOfStockBody(String(d.unitsSold).replace(".", ","), d.days) + send,
        href: `/bi/stores/${d.orgId}?period=30d`,
        tone: "amber",
        product: { styleNumber: d.styleNumber, colorCode: d.colorCode, name: d.productName },
      }
    }
    case "campaign_starts":
    case "campaign_ends": {
      const d = n.data as CampaignData
      return {
        title: n.kind === "campaign_starts" ? a.campaignStarts(d.name) : a.campaignEnds(d.name),
        body: a.campaignBody(d.stores),
        href: `/campaigns/${d.campaignId}`,
        tone: "sky",
      }
    }
    case "sales_drop_many":
    case "out_of_stock_many":
    case "campaign_many": {
      const d = n.data as ManyData
      const title = n.kind === "sales_drop_many" ? a.salesDropMany(d.count) : n.kind === "out_of_stock_many" ? a.outOfStockMany(d.count) : a.campaignMany(d.count)
      return { title, body: a.seeAllLink, href: d.href, tone: n.kind === "campaign_many" ? "sky" : n.kind === "sales_drop_many" ? "red" : "amber" }
    }
    default:
      return { title: n.kind, body: "", href: "/notifications", tone: "neutral" }
  }
}

/** "just now", "5 min ago", "3 h ago", "yesterday", "4 days ago" */
export function agoText(iso: string, t: Dict, now: number) {
  const minutes = Math.floor((now - Date.parse(iso)) / 60_000)
  if (minutes < 1) return t.alerts.ago.now
  if (minutes < 60) return t.alerts.ago.minutes(minutes)
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t.alerts.ago.hours(hours)
  return t.alerts.ago.days(Math.floor(hours / 24))
}

/** One-line summary of a rule for the "My alerts" list. */
export function describeRule(
  rule: { type: string; params: unknown },
  t: Dict,
  names: { stores: Map<number, string>; chains: Map<string, string>; brands: Map<string, string> },
) {
  const r = t.alerts.rules
  const scopeText = (s: StoreScope) =>
    s.kind === "all" ? r.allStores : s.kind === "chain" ? r.chainStores(names.chains.get(s.chain) ?? s.chain) : cleanName(names.stores.get(s.orgId) ?? `#${s.orgId}`)
  if (rule.type === "SALES_DROP") {
    const p = rule.params as { scope: StoreScope; threshold: number; period: string }
    return r.describeSales(p.threshold, (r.periodOptions[p.period] ?? p.period).toLowerCase(), scopeText(p.scope))
  }
  if (rule.type === "OUT_OF_STOCK") {
    const p = rule.params as { scope: StoreScope; noosOnly: boolean; brand: string | null }
    const extra = [p.noosOnly ? r.noos : "", p.brand ? names.brands.get(p.brand) ?? p.brand : ""].filter(Boolean).map((x) => ` · ${x}`).join("")
    return r.describeStock(scopeText(p.scope), extra)
  }
  const p = rule.params as { starts: boolean; ends: boolean }
  return r.describeCampaign(p.starts && p.ends ? r.startsAndEnds : p.starts ? r.startsOnly : r.endsOnly)
}
