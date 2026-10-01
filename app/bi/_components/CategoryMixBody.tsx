"use client"

// app/bi/_components/CategoryMixBody.tsx
// Category mix with two views:
//   Sales mix       each category's share of sales and its shift vs the comparison period
//   Stock vs sales  share of sales in the period next to share of stock in the stores now (at shelf
//                   price incl. VAT), with a balance chip and weeks of cover. A category holding much
//                   more of the stock than it sells is overstocked; much less, understocked.
import { useState } from "react"
import type { BiCategories } from "@/app/lib/bi/types"
import { useT } from "@/app/lib/i18n/client"
import type { Dict } from "@/app/lib/i18n/dictionaries"
import { formatEurWhole, formatInt, formatPct } from "../../campaigns/_components/campaign-utils"
import { Bar, cx, signedPp } from "./ui"

type View = "mix" | "stock"

/** Share gap (stock − sales, in pp) that counts as out of balance. */
const BALANCE_PP = 1.5

/** erp-api names items without a category "Pa kategori" */
export const categoryName = (name: string, t: Dict) => (name === "Pa kategori" ? t.bi.categories.none : name)

export default function CategoryMixBody({ data, limit = 10 }: { data: BiCategories; limit?: number }) {
  const t = useT()
  const c9 = t.bi.categories
  const [view, setView] = useState<View>("mix")
  const hasStock = data.categories.some((c) => c.stock)

  const tabs: { id: View; label: string }[] = [
    { id: "mix", label: c9.tabMix },
    { id: "stock", label: c9.tabStock },
  ]

  return (
    <>
      {hasStock && <CardTabs label={c9.title} tabs={tabs} value={view} onChange={setView} />}
      {view === "mix" || !hasStock ? <SalesMix data={data} limit={limit} t={t} /> : <StockVsSales data={data} limit={limit} t={t} />}
    </>
  )
}

/** Chip tabs under a card header (same look as the stock alert and product chips). */
export function CardTabs<T extends string>({ label, tabs, value, onChange }: { label: string; tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1.5 overflow-x-auto border-b border-neutral-100 px-5 py-2.5 dark:border-neutral-800">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={cx(
            "inline-flex shrink-0 cursor-pointer items-center rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors",
            value === tab.id
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400 dark:hover:bg-neutral-800",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function SalesMix({ data, limit, t }: { data: BiCategories; limit: number; t: Dict }) {
  const c9 = t.bi.categories
  const cats = data.categories.filter((c) => c.current.sales > 0 || c.previous.sales > 0).slice(0, limit)
  const max = Math.max(1, ...cats.map((c) => c.current.sales))
  return (
    <ul className="space-y-4 px-5 py-4">
      {cats.map((c, i) => {
        const shift = c.current.sharePct !== null && c.previous.sharePct !== null ? c.current.sharePct - c.previous.sharePct : null
        return (
          <li key={c.category}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium text-neutral-800 dark:text-neutral-100">{categoryName(c.category, t)}</span>
              <span className="shrink-0 font-semibold text-neutral-900 tabular-nums dark:text-neutral-100">{formatEurWhole(c.current.sales)}</span>
            </div>
            <div className="mt-1.5"><Bar share={c.current.sales / max} lead={i === 0} /></div>
            <div className="mt-1 flex justify-between text-[11px] text-neutral-500 tabular-nums dark:text-neutral-400">
              <span>{c9.ofSales(c.current.sharePct === null ? "—" : formatPct(c.current.sharePct))}</span>
              {shift !== null && Math.abs(shift) >= 0.1 ? (
                <span className={shift > 0 ? "font-medium text-emerald-700 dark:text-emerald-400" : "font-medium text-red-600 dark:text-red-400"}>
                  {shift > 0 ? "▲" : "▼"} {c9.mix(signedPp(shift))}
                </span>
              ) : (
                <span>{c9.noChange}</span>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function StockVsSales({ data, limit, t }: { data: BiCategories; limit: number; t: Dict }) {
  const c9 = t.bi.categories
  const share = (c: BiCategories["categories"][number]) => ({ sales: c.current.sharePct ?? 0, stock: c.stock?.sharePct ?? 0 })
  // Biggest categories by either share, so a category with lots of stock but few sales still shows
  const cats = [...data.categories]
    .sort((a, b) => Math.max(share(b).sales, share(b).stock) - Math.max(share(a).sales, share(a).stock))
    .slice(0, limit)
  const max = Math.max(1, ...cats.map((c) => Math.max(share(c).sales, share(c).stock)))

  return (
    <div className="px-5 py-4">
      <p className="mb-3 text-[11px] text-neutral-500 dark:text-neutral-400">
        {c9.stockIntro}
        {data.stockTotal && <> {c9.stockTotal(formatEurWhole(data.stockTotal.retailValue))}</>}
      </p>
      <div className="mb-3 flex gap-4 text-xs text-neutral-500 dark:text-neutral-400">
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-1 w-3 rounded-full bg-brand-600 dark:bg-brand-400" />{c9.salesLegend}</span>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-1 w-3 rounded-full bg-neutral-400" />{c9.stockLegend}</span>
      </div>
      <ul className="space-y-3.5">
        {cats.map((c) => {
          const s = share(c)
          const gap = s.stock - s.sales
          const state = gap > BALANCE_PP ? "over" : gap < -BALANCE_PP ? "under" : "ok"
          const cover = c.stock?.weeksCover
          return (
            <li key={c.category}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium text-neutral-800 dark:text-neutral-100">{categoryName(c.category, t)}</span>
                <span
                  className={cx(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold whitespace-nowrap",
                    state === "over" && "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
                    state === "under" && "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
                    state === "ok" && "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
                  )}
                >
                  {state === "over" ? c9.over(signedPp(gap)) : state === "under" ? c9.under(signedPp(gap)) : c9.balanced}
                </span>
              </div>
              <div className="relative mt-1.5 h-3.5">
                <span className="absolute top-0 left-0 h-1.5 rounded-r-[3px] bg-brand-600 dark:bg-brand-400" style={{ width: `${(s.sales / max) * 100}%` }} />
                <span className="absolute top-2 left-0 h-1.5 rounded-r-[3px] bg-neutral-300 dark:bg-neutral-600" style={{ width: `${(s.stock / max) * 100}%` }} />
              </div>
              <div className="flex justify-between gap-3 text-[11px] text-neutral-500 tabular-nums dark:text-neutral-400">
                <span className="truncate">
                  {c9.shares(formatPct(s.sales), formatPct(s.stock))}
                </span>
                <span className="shrink-0">
                  {c.stock ? c9.stockFoot(formatInt(c.stock.units)) : ""}
                  {cover != null && ` · ${c9.cover(cover < 10 ? cover.toFixed(1).replace(".", ",") : formatInt(cover))}`}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
