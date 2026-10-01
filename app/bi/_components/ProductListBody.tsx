"use client"

// app/bi/_components/ProductListBody.tsx
// Top products with sort chips (sales / units / margin / lowest cover). The list is the top N by sales
// from erp-api, re-sorted here; it scrolls inside its card like the stock alerts next to it.
// Weeks of cover = stock now ÷ average weekly units sold in the selected period.
import { useState } from "react"
import { MapPin } from "lucide-react"
import { cleanName, locationOf } from "@/app/lib/bi/brands"
import type { BiProduct } from "@/app/lib/bi/types"
import ProductThumb from "@/app/ProductThumb"
import { useT } from "@/app/lib/i18n/client"
import { formatEurWhole, formatInt, formatPct } from "../../campaigns/_components/campaign-utils"
import AttrChips from "./AttrChips"
import { cx } from "./ui"

type SortKey = "sales" | "units" | "margin" | "stock"

const SORT_KEYS: SortKey[] = ["sales", "units", "margin", "stock"]

/** Weeks the current stock lasts at the period's selling speed; null when nothing (net) sold. */
const weeksOfCover = (p: BiProduct, days: number) => {
  const perWeek = p.units / (Math.max(1, days) / 7)
  return perWeek > 0 ? Math.max(0, p.stockOnHand) / perWeek : null
}

/** Stores shown on the "sold in" line before "+N" */
const STORES_SHOWN = 3

/**
 * "Gjakove 4 · Royal Mall 3 · Albi Mall 3 · +7". Short store names (without the chain) unless two
 * stores of different chains share one, then the full name. The full list is in the tooltip.
 */
function SoldIn({ stores, label }: { stores: NonNullable<BiProduct["stores"]>; label: string }) {
  if (stores.length === 0) return null
  const short = stores.map((s) => locationOf(s.storeName))
  const clash = new Set(short.filter((n, i) => short.indexOf(n) !== i))
  const name = (i: number) => (clash.has(short[i]) ? cleanName(stores[i].storeName) : short[i])
  const units = (n: number) => String(n).replace(".", ",")
  const tooltip = `${label}\n${stores.map((s) => `${cleanName(s.storeName)}: ${units(s.units)}`).join("\n")}`
  const rest = stores.length - STORES_SHOWN
  return (
    <span className="mt-1 flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400" title={tooltip}>
      <MapPin className="size-3 shrink-0 text-neutral-400" aria-hidden />
      <span className="truncate">
        {stores.slice(0, STORES_SHOWN).map((s, i) => (
          <span key={s.orgId}>
            {i > 0 && " · "}
            {name(i)} <span className="font-semibold text-neutral-700 tabular-nums dark:text-neutral-200">{units(s.units)}</span>
          </span>
        ))}
        {rest > 0 && <span className="text-neutral-400"> · +{rest}</span>}
      </span>
    </span>
  )
}

export default function ProductListBody({ products, days, showStores = true }: { products: BiProduct[]; days: number; showStores?: boolean }) {
  const t = useT()
  const pr = t.bi.products
  const [sort, setSort] = useState<SortKey>("sales")

  const cover = (p: BiProduct) => weeksOfCover(p, days)
  const sorts: Record<SortKey, (a: BiProduct, b: BiProduct) => number> = {
    sales: (a, b) => b.sales - a.sales,
    units: (a, b) => b.units - a.units,
    margin: (a, b) => (b.marginPct ?? -Infinity) - (a.marginPct ?? -Infinity),
    // Runs out soonest first; items with no net sales go last
    stock: (a, b) => (cover(a) ?? Infinity) - (cover(b) ?? Infinity) || b.sales - a.sales,
  }
  const sorted = [...products].sort(sorts[sort])
  const coverText = (p: BiProduct) => {
    const w = cover(p)
    return w === null ? pr.noSales : pr.cover(w < 10 ? w.toFixed(1).replace(".", ",") : formatInt(w))
  }

  // The figure on the right follows the sort; the line under it gives context
  const figure = (p: BiProduct) => {
    switch (sort) {
      case "units":
        return { main: pr.units(formatInt(p.units)), sub: formatEurWhole(p.sales) }
      case "margin":
        // A product sold without a cost in the ERP would read as 100%: say so instead
        if (p.marginPct === null) return { main: p.costMissing ? pr.noCost : "—", sub: formatEurWhole(p.sales), title: p.costMissing ? pr.noCostTitle : undefined }
        return { main: formatPct(p.marginPct), sub: p.costMissing ? `${formatEurWhole(p.sales)} · ${pr.partCost}` : formatEurWhole(p.sales) }
      case "stock":
        return { main: coverText(p), sub: pr.inStock(formatInt(p.stockOnHand)) }
      default:
        return { main: formatEurWhole(p.sales), sub: pr.units(formatInt(p.units)) }
    }
  }

  return (
    <>
      <div role="tablist" aria-label={pr.sortBy} className="flex gap-1.5 overflow-x-auto border-b border-neutral-100 px-5 py-2.5 dark:border-neutral-800">
        {SORT_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={sort === key}
            onClick={() => setSort(key)}
            className={cx(
              "inline-flex shrink-0 cursor-pointer items-center rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors",
              sort === key
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400 dark:hover:bg-neutral-800",
            )}
          >
            {pr.sorts[key]}
          </button>
        ))}
      </div>
      <ol className="max-h-[30rem] divide-y divide-neutral-100 overflow-y-auto overscroll-contain dark:divide-neutral-800">
        {sorted.map((p, i) => {
          const f = figure(p)
          return (
            <li key={p.articleId} className="grid grid-cols-[1.5rem_auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-2.5">
              <span
                className={cx(
                  "inline-grid size-6 place-items-center rounded-md text-[11px] font-bold",
                  i === 0 ? "bg-brand-600 text-white dark:bg-brand-400 dark:text-neutral-950" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
                )}
              >
                {i + 1}
              </span>
              <ProductThumb styleNumber={p.styleNumber} colorCode={p.colorCode} alt={p.productName} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{p.productName}</span>
                <span className="block truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                  {p.styleNumber && <span className="font-mono">#{p.styleNumber}</span>}
                  {p.brand && ` · ${p.brand}`}
                  {p.category && ` · ${p.category}`}
                  {sort !== "stock" && ` · ${pr.inStock(formatInt(p.stockOnHand))}`}
                </span>
                {showStores && p.stores && <SoldIn stores={p.stores} label={pr.soldIn} />}
                <AttrChips item={p} t={t} />
              </span>
              <span className="text-right tabular-nums" title={"title" in f ? f.title : undefined}>
                <span className={cx("block text-sm font-semibold", "title" in f && f.title ? "text-neutral-400 dark:text-neutral-500" : "text-neutral-900 dark:text-neutral-100")}>{f.main}</span>
                <span className="block text-[11px] text-neutral-500">{f.sub}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </>
  )
}
