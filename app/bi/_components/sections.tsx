// app/bi/_components/sections.tsx
// Server-rendered sections of the BI pages. Texts come from getT() (the request's language).
import Link from "next/link"
import { AlertTriangle, Boxes, Layers, LineChart, PackageX, PieChart, ShoppingBag } from "lucide-react"
import type { BiCategories, BiMetrics, BiProduct, BiSegmentRow, BiStoreRow } from "@/app/lib/bi/types"
import { getBiSegments, getBiStockAlerts, getBiTimeseries, settle, type Range } from "@/app/lib/bi/erp"
import type { ProductFilter } from "@/app/lib/bi/filters"
import { locationOf } from "@/app/lib/bi/brands"
import { genderLabel } from "@/app/lib/bi/attributes"
import { getT } from "@/app/lib/i18n/server"
import type { Dict } from "@/app/lib/i18n/dictionaries"
import StockAlertList from "./StockAlertList"
import ProductListBody from "./ProductListBody"
import CategoryMixBody from "./CategoryMixBody"
import CategoriesVsChainBody from "./CategoriesVsChainBody"
import { formatEur, formatEurWhole, formatInt, formatPct } from "../../campaigns/_components/campaign-utils"
import TrendChart from "./TrendChart"
import { Bar, Card, CardHeader, Delta, ErrorCard, KpiTile, cx, growth, signedPct, signedPp } from "./ui"

// ---------- KPI tiles ----------

export async function KpiRow({
  current,
  previous,
  lfl,
  compareText,
  salesBasis = "payments",
}: {
  current: BiMetrics
  previous: BiMetrics
  /** Like-for-like totals for sales/units growth; omit on a single store page */
  lfl?: { current: BiMetrics; previous: BiMetrics; storeCount: number }
  compareText: string
  /** 'lines' with a product filter: sales are the matching items only, receipts those containing one */
  salesBasis?: "payments" | "lines"
}) {
  const t = await getT()
  const k = t.bi.kpi
  const base = lfl ?? { current, previous, storeCount: 0 }
  const pp = (a: number | null, b: number | null) => (a === null || b === null ? null : a - b)
  const items = salesBasis === "lines"
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <KpiTile
        label={items ? k.itemSales : k.sales}
        value={formatEurWhole(current.sales)}
        delta={<Delta value={growth(base.current.sales, base.previous.sales)} kind="pct" na={k.na} />}
        foot=""
        previous={k.prev(compareText, formatEurWhole(base.previous.sales))}
        badge={lfl ? "LFL" : undefined}
        badgeTitle={k.lflTitle}
      />
      <KpiTile
        label={k.units}
        value={formatInt(current.units)}
        delta={<Delta value={growth(base.current.units, base.previous.units)} kind="pct" na={k.na} />}
        foot=""
        previous={k.prev(compareText, formatInt(base.previous.units))}
        badge={lfl ? "LFL" : undefined}
        badgeTitle={k.lflTitle}
      />
      <KpiTile
        label={k.margin}
        value={current.marginPct === null ? "—" : formatPct(current.marginPct)}
        delta={<Delta value={pp(current.marginPct, previous.marginPct)} kind="pp" na={k.na} />}
        foot={k.profit(formatEurWhole(current.grossProfit))}
        previous={previous.marginPct === null ? undefined : k.prev(compareText, formatPct(previous.marginPct))}
      />
      <KpiTile
        label={k.markdown}
        value={current.markdownPct === null ? "—" : formatPct(current.markdownPct)}
        delta={<Delta value={pp(current.markdownPct, previous.markdownPct)} kind="pp" invert na={k.na} />}
        foot={k.discount(formatEurWhole(current.markdownAmount))}
        previous={previous.markdownPct === null ? undefined : k.prev(compareText, formatPct(previous.markdownPct))}
      />
      <KpiTile
        label={items ? k.perReceipt : k.basket}
        value={current.atv === null ? "—" : formatEur(current.atv)}
        delta={<Delta value={current.atv !== null && previous.atv ? growth(current.atv, previous.atv) : null} kind="pct" na={k.na} />}
        foot={current.upt === null ? "" : k.basketFoot(String(current.upt).replace(".", ","), formatInt(current.receipts))}
        previous={previous.atv === null ? undefined : k.prev(compareText, formatEur(previous.atv))}
      />
    </div>
  )
}

// ---------- needs attention ----------

interface Issue {
  row: BiStoreRow
  severity: "high" | "mid"
  text: string
  score: number
}

/** Stores outside normal ranges: falling sales, margin well below the chain, heavy markdown. */
export async function Exceptions({ stores, totals, compareText, query }: { stores: BiStoreRow[]; totals: BiMetrics; compareText: string; query: string }) {
  const t = await getT()
  const a = t.bi.attention
  const issues: Issue[] = []
  for (const r of stores) {
    const g = r.lfl ? growth(r.current.sales, r.previous.sales) : null
    if (g !== null && g < -0.1) issues.push({ row: r, severity: "high", text: a.sales(signedPct(g), compareText), score: 1 - g })
    const m = r.current.marginPct, cm = totals.marginPct
    if (m !== null && cm !== null && m < cm - 10) issues.push({ row: r, severity: "high", text: a.margin(formatPct(m), formatPct(cm)), score: 1 + (cm - m) / 20 })
    const md = r.current.markdownPct, cmd = totals.markdownPct
    if (md !== null && cmd !== null && md > cmd + 10) issues.push({ row: r, severity: "mid", text: a.markdown(formatPct(md), formatPct(cmd)), score: (md - cmd) / 20 })
  }
  issues.sort((a, b) => b.score - a.score)
  const shown = issues.slice(0, 6)

  return (
    <Card>
      <CardHeader icon={AlertTriangle} iconClass="text-amber-500 dark:text-amber-400" title={a.title} sub={a.sub} />
      {shown.length === 0 ? (
        <p className="px-5 py-8 text-sm text-neutral-500 dark:text-neutral-400">{a.none}</p>
      ) : (
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {shown.map((x) => (
            <li key={`${x.row.orgId}-${x.text}`}>
              <Link href={`/bi/stores/${x.row.orgId}?${query}`} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-5 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                <span className={cx("size-2 rounded-full", x.severity === "high" ? "bg-red-500" : "bg-amber-500")} aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{locationOf(x.row.name)}</span>
                  <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">{x.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {issues.length > shown.length && <p className="px-5 pb-4 text-xs text-neutral-500">{a.more(issues.length - shown.length)}</p>}
    </Card>
  )
}

// ---------- trend (loads on its own; long ranges are slow the first time) ----------

export async function TrendSection({ range, compareText, title }: { range: Range; compareText: string; title?: string }) {
  const t = await getT()
  const res = await settle(getBiTimeseries(range))
  if (!res.data) return <ErrorCard message={res.error} />
  return (
    <Card>
      <CardHeader icon={LineChart} title={title ?? t.bi.trend.title} sub={res.data.grain === "week" ? t.bi.trend.weekly(compareText) : t.bi.trend.daily(compareText)} />
      <TrendChart data={res.data} compareLabel={compareText.replace(/^(vs|kundrejt) /, "").replace(/^./, (c) => c.toUpperCase())} />
    </Card>
  )
}

// ---------- categories ----------

export async function CategoryMix({ data, compareText, limit = 10 }: { data: BiCategories; compareText: string; limit?: number }) {
  const t = await getT()
  const c9 = t.bi.categories
  return (
    <Card>
      <CardHeader icon={Layers} title={c9.title} sub={c9.sub(compareText)} />
      <CategoryMixBody data={data} limit={limit} />
    </Card>
  )
}

/** Store page: this store's category shares next to the chain's. */
export async function CategoriesVsChain({ store, chain }: { store: BiCategories; chain: BiCategories }) {
  const t = await getT()
  const c9 = t.bi.categories
  return (
    <Card>
      <CardHeader icon={Layers} title={c9.vsChainTitle} sub={c9.vsChainSub} />
      <CategoriesVsChainBody store={store} chain={chain} />
    </Card>
  )
}

// ---------- segments (gender / season / brand mix; loads on its own) ----------

function MixColumn({ title, rows, t, limit = 6 }: { title: string; rows: BiSegmentRow[]; t: Dict; limit?: number }) {
  const shown = rows.filter((r) => r.current.sales > 0 || r.previous.sales > 0).slice(0, limit)
  const rest = rows.slice(limit).reduce((s, r) => s + (r.current.sharePct ?? 0), 0)
  return (
    <div className="min-w-0">
      <h3 className="mb-3 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">{title}</h3>
      <ul className="space-y-3">
        {shown.map((r, i) => {
          const share = r.current.sharePct ?? 0
          const shift = r.previous.sharePct !== null && r.current.sharePct !== null ? share - r.previous.sharePct : null
          return (
            <li key={r.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium text-neutral-800 dark:text-neutral-100">{r.name}</span>
                <span className="shrink-0 font-semibold text-neutral-900 tabular-nums dark:text-neutral-100">{formatPct(share)}</span>
              </div>
              <div className="mt-1.5"><Bar share={share / 100} lead={i === 0} /></div>
              <div className="mt-1 flex justify-between text-[11px] text-neutral-500 tabular-nums dark:text-neutral-400">
                <span>{formatEurWhole(r.current.sales)}{r.current.marginPct !== null && ` · ${t.bi.segments.marginShort(formatPct(r.current.marginPct))}`}</span>
                {shift !== null && Math.abs(shift) >= 0.1 && (
                  <span className={shift > 0 ? "font-medium text-emerald-700 dark:text-emerald-400" : "font-medium text-red-600 dark:text-red-400"}>
                    {shift > 0 ? "▲" : "▼"} {signedPp(shift)}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {rest >= 0.1 && <p className="mt-3 text-[11px] text-neutral-500">{t.bi.segments.others(formatPct(rest))}</p>}
    </div>
  )
}

export async function SegmentsSection({ range, compareText }: { range: Range; compareText: string }) {
  const t = await getT()
  const sg = t.bi.segments
  const res = await settle(getBiSegments(range))
  if (!res.data) return <ErrorCard message={res.error} />
  const { gender, season, brand } = res.data
  // erp-api names the buckets in English; translate them by key
  const genderName = (r: BiSegmentRow) => (r.key === "none" ? sg.notSet : genderLabel(r.name, t) ?? r.name)
  const seasonName = (r: BiSegmentRow) =>
    r.key === "noos" ? "NOOS" : r.key === "other" ? sg.otherSeason : /^\d{2}$/.test(r.key) ? t.bi.filter.collections(r.key) : r.name
  const brandName = (r: BiSegmentRow) => (r.key === "no-brand" ? sg.noBrand : r.name)
  return (
    <Card>
      <CardHeader icon={PieChart} title={sg.title} sub={sg.sub(compareText)} />
      <div className="grid grid-cols-1 gap-8 px-5 py-4 md:grid-cols-3">
        <MixColumn title={sg.gender} t={t} rows={gender.map((r) => ({ ...r, name: genderName(r) }))} />
        <MixColumn title={sg.season} t={t} rows={season.map((r) => ({ ...r, name: seasonName(r) }))} />
        <MixColumn title={sg.brand} t={t} rows={brand.map((r) => ({ ...r, name: brandName(r) }))} />
      </div>
    </Card>
  )
}

// ---------- products ----------

/** How many top products the BI pages load; the list scrolls inside its card. */
export const TOP_PRODUCTS = 50

export async function ProductList({ products, title, days, showStores = true }: { products: BiProduct[]; title?: string; days: number; showStores?: boolean }) {
  const t = await getT()
  const pr = t.bi.products
  return (
    <Card>
      <CardHeader icon={ShoppingBag} title={title ?? pr.title} sub={pr.sub(products.length || TOP_PRODUCTS)} />
      {products.length === 0 ? (
        <p className="px-5 py-8 text-sm text-neutral-500">{pr.none}</p>
      ) : (
        <ProductListBody products={products} days={days} showStores={showStores} />
      )}
    </Card>
  )
}

// ---------- stock alerts (loads on its own) ----------

/** Alerts loaded per type (out / low / not selling); the list scrolls and filters by type. */
export const STOCK_ALERTS_PER_KIND = 50

export async function StockAlertsSection({
  stores,
  showStore,
  query,
  limit = STOCK_ALERTS_PER_KIND,
  filter,
}: {
  stores?: string
  showStore: boolean
  query: string
  limit?: number
  filter?: ProductFilter
}) {
  const t = await getT()
  const res = await settle(getBiStockAlerts(stores, limit, filter))
  if (!res.data) return <ErrorCard message={res.error} />
  const { alerts, window } = res.data
  return (
    <Card>
      <CardHeader icon={alerts.length ? PackageX : Boxes} title={t.bi.stock.title} sub={t.bi.stock.sub(window.days)} />
      {alerts.length === 0 ? (
        <p className="px-5 py-8 text-sm text-neutral-500">{t.bi.stock.none}</p>
      ) : (
        <StockAlertList data={res.data} showStore={showStore} query={query} />
      )}
    </Card>
  )
}
