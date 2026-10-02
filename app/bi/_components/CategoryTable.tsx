"use client"

// app/bi/_components/CategoryTable.tsx
// Category performance table: sales, units, profit and price against the comparison period (Idx = this
// period ÷ comparison × 100, so 100 = unchanged), plus stock now. Sortable by any column; totals at the bottom.
//   Stock Idx = stock share ÷ sales share × 100 (above 100: the category holds more stock than it sells).
//   The ERP only has today's stock, so stock can't be compared with last year.
// Layout: capped height with its own scrolling; the header, totals and category column stay in place
// (sticky), and a shadow, a fade and the ‹ › buttons show there are more columns to the side.
import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Table2 } from "lucide-react"
import type { BiCategories, BiCategorySide } from "@/app/lib/bi/types"
import { useT } from "@/app/lib/i18n/client"
import { formatEurWhole, formatInt, formatPct } from "../../campaigns/_components/campaign-utils"
import { categoryName } from "./CategoryMixBody"
import { Card, CardHeader, cx } from "./ui"

type Row = {
  key: string
  name: string
  cur: BiCategorySide
  prev: BiCategorySide
  stockValue: number
  stockUnits: number
  stockShare: number | null
  cover: number | null
}

type SortKey =
  | "name" | "share" | "salesIdx" | "sales" | "wl" | "qtyIdx" | "qty" | "gpIdx" | "gm" | "md"
  | "priceIdx" | "price" | "stockValue" | "stockShare" | "stockIdx" | "stockQty" | "cover"

const idx = (cur: number, prev: number) => (prev > 0 ? (cur / prev) * 100 : null)
const avgPrice = (s: BiCategorySide) => (s.units > 0 ? s.sales / s.units : null)
const stockIdx = (r: Row) => (r.stockShare !== null && r.cur.sharePct ? (r.stockShare / r.cur.sharePct) * 100 : null)
const num = (v: number | null) => v ?? -Infinity

const VALUE: Record<SortKey, (r: Row) => number | string> = {
  name: (r) => r.name,
  share: (r) => r.cur.sharePct ?? 0,
  salesIdx: (r) => num(idx(r.cur.sales, r.prev.sales)),
  sales: (r) => r.cur.sales,
  wl: (r) => r.cur.sales - r.prev.sales,
  qtyIdx: (r) => num(idx(r.cur.units, r.prev.units)),
  qty: (r) => r.cur.units,
  gpIdx: (r) => num(idx(r.cur.grossProfit ?? 0, r.prev.grossProfit ?? 0)),
  gm: (r) => num(r.cur.marginPct),
  md: (r) => num(r.cur.markdownPct ?? null),
  priceIdx: (r) => num(avgPrice(r.prev) ? idx(avgPrice(r.cur) ?? 0, avgPrice(r.prev)!) : null),
  price: (r) => num(avgPrice(r.cur)),
  stockValue: (r) => r.stockValue,
  stockShare: (r) => num(r.stockShare),
  stockIdx: (r) => num(stockIdx(r)),
  stockQty: (r) => r.stockUnits,
  cover: (r) => num(r.cover),
}

const one = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1, minimumFractionDigits: 1 })

/** Row line on every cell: the table uses separate borders so sticky cells keep theirs */
const CELL = "border-b border-neutral-100 dark:border-neutral-800"
/** Shadow on the sticky category column once the table is scrolled sideways */
const COL_SHADOW = "shadow-[6px_0_8px_-6px_rgba(0,0,0,0.25)]"

/** Index cell: green from 100 up, red below; `solid` paints the cell (the headline sales index). */
function IdxCell({ v, solid }: { v: number | null; solid?: boolean }) {
  if (v === null) return <td className={cx(CELL, "px-2 py-2 text-right text-neutral-400 tabular-nums")}>—</td>
  const up = v >= 100
  return (
    <td className={cx(CELL, "px-2 py-2 text-right tabular-nums")}>
      <span
        className={cx(
          "inline-block min-w-[2.75rem] rounded-md px-1.5 py-0.5 font-semibold",
          solid
            ? up
              ? "bg-emerald-600 text-white dark:bg-emerald-500"
              : "bg-red-600 text-white dark:bg-red-500"
            : up
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400",
        )}
      >
        {Math.round(v)}
      </span>
    </td>
  )
}

/** Stock vs sales index: ~100 balanced; amber above 115 (more stock than it sells), red below 85 (short). */
function StockIdxCell({ v }: { v: number | null }) {
  if (v === null) return <td className={cx(CELL, "px-2 py-2 text-right text-neutral-400 tabular-nums")}>—</td>
  return (
    <td className={cx(CELL, "px-2 py-2 text-right tabular-nums")}>
      <span
        className={cx(
          "font-semibold",
          v > 115 ? "text-amber-600 dark:text-amber-400" : v < 85 ? "text-red-600 dark:text-red-400" : "text-neutral-700 dark:text-neutral-300",
        )}
      >
        {Math.round(v)}
      </span>
    </td>
  )
}

export default function CategoryTable({ data, compareText }: { data: BiCategories; compareText: string }) {
  const t = useT()
  const ct = t.bi.categoryTable
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "sales", dir: -1 })

  // Sideways scroll: is there more to the left / right? (drives the shadow, the fade and the buttons)
  const scroller = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const update = () => {
      const left = el.scrollLeft > 2
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
      setEdges((e) => (e.left === left && e.right === right ? e : { left, right }))
    }
    update()
    el.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", update)
      ro.disconnect()
    }
  }, [])
  // One click moves most of the visible width (minus the sticky column)
  const scrollSideways = (dir: 1 | -1) => {
    const el = scroller.current
    if (el) el.scrollBy({ left: dir * Math.max(200, (el.clientWidth - 160) * 0.8), behavior: "smooth" })
  }

  const rows: Row[] = data.categories
    .filter((c) => c.current.sales !== 0 || c.previous.sales !== 0 || (c.stock?.units ?? 0) > 0)
    .map((c) => ({
      key: c.category,
      name: categoryName(c.category, t),
      cur: c.current,
      prev: c.previous,
      stockValue: c.stock?.retailValue ?? 0,
      stockUnits: c.stock?.units ?? 0,
      stockShare: c.stock?.sharePct ?? null,
      cover: c.stock?.weeksCover ?? null,
    }))
  const sorted = [...rows].sort((a, b) => {
    const va = VALUE[sort.key](a), vb = VALUE[sort.key](b)
    return (typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number)) * sort.dir
  })

  // Totals: sums, then the same ratios as the rows
  const sum = (f: (r: Row) => number) => rows.reduce((n, r) => n + f(r), 0)
  const tot = {
    sales: sum((r) => r.cur.sales), prevSales: sum((r) => r.prev.sales),
    units: sum((r) => r.cur.units), prevUnits: sum((r) => r.prev.units),
    gp: sum((r) => r.cur.grossProfit ?? 0), prevGp: sum((r) => r.prev.grossProfit ?? 0),
    net: sum((r) => r.cur.netSales), list: sum((r) => r.cur.grossList ?? 0),
    stockValue: sum((r) => r.stockValue), stockUnits: sum((r) => r.stockUnits),
  }
  // Profit and list value come from newer erp-api builds; without them show "—", not 0%
  const hasGp = rows.some((r) => r.cur.grossProfit !== undefined)
  const hasList = rows.some((r) => r.cur.grossList != null)
  const totPrice = tot.units > 0 ? tot.sales / tot.units : null
  const totPrevPrice = tot.prevUnits > 0 ? tot.prevSales / tot.prevUnits : null
  const weeksIn = (r: Row) => (r.cover && r.cur.units > 0 ? r.stockUnits / r.cover : 0) // units per week
  const totCover = (() => {
    const perWeek = sum(weeksIn)
    return perWeek > 0 ? tot.stockUnits / perWeek : null
  })()

  const th = (key: SortKey, label: string, title?: string, left = false) => (
    <th
      scope="col"
      className={cx(
        "sticky top-0 border-b border-neutral-200 bg-white px-2 py-2 text-[10.5px] font-semibold tracking-wide whitespace-nowrap text-neutral-400 uppercase dark:border-neutral-700 dark:bg-neutral-900",
        left ? cx("left-0 z-30 text-left", edges.left && COL_SHADOW) : "z-20 text-right",
      )}
      title={title}
    >
      <button
        type="button"
        onClick={() => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "name" ? 1 : -1 }))}
        aria-sort={sort.key === key ? (sort.dir === -1 ? "descending" : "ascending") : undefined}
        className={cx("cursor-pointer uppercase", sort.key === key && "text-neutral-800 dark:text-neutral-100")}
      >
        {label}
        {sort.key === key && (sort.dir === -1 ? " ↓" : " ↑")}
      </button>
    </th>
  )

  const td = cx(CELL, "px-2 py-2 text-right tabular-nums text-neutral-700 dark:text-neutral-300")
  const wl = (v: number) => (
    <span className={v >= 0 ? "text-neutral-700 dark:text-neutral-300" : "text-red-600 dark:text-red-400"}>
      {v < 0 ? "−" : ""}
      {formatEurWhole(Math.abs(v))}
    </span>
  )

  return (
    <Card>
      <CardHeader
        icon={Table2}
        title={ct.title}
        sub={ct.sub(compareText)}
        aside={
          (edges.left || edges.right) && (
            <div className="flex items-center gap-1">
              {([-1, 1] as const).map((dir) => {
                const Icon = dir === -1 ? ChevronLeft : ChevronRight
                const label = dir === -1 ? ct.scrollLeft : ct.scrollRight
                return (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => scrollSideways(dir)}
                    disabled={dir === -1 ? !edges.left : !edges.right}
                    aria-label={label}
                    title={label}
                    className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                  >
                    <Icon className="size-4" />
                  </button>
                )
              })}
            </div>
          )
        }
      />
      <div className="relative">
        <div ref={scroller} className="max-h-[26rem] overflow-auto overscroll-contain">
          <table className="w-full border-separate border-spacing-0 text-xs">
            <thead>
              <tr>
                {th("name", ct.category, undefined, true)}
                {th("share", ct.share)}
                {th("salesIdx", ct.salesIdx, ct.idxTitle)}
                {th("sales", ct.sales)}
                {th("wl", ct.wl, ct.wlTitle)}
                {th("qtyIdx", ct.qtyIdx, ct.idxTitle)}
                {th("qty", ct.qty)}
                {th("gpIdx", ct.gpIdx, ct.idxTitle)}
                {th("gm", ct.gm)}
                {th("md", ct.md)}
                {th("priceIdx", ct.priceIdx, ct.idxTitle)}
                {th("price", ct.price)}
                {th("stockValue", ct.stockValue, ct.stockNowTitle)}
                {th("stockShare", ct.stockShare)}
                {th("stockIdx", ct.stockIdx, ct.stockIdxTitle)}
                {th("stockQty", ct.stockQty)}
                {th("cover", ct.cover, ct.coverTitle)}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const price = avgPrice(r.cur), prevPrice = avgPrice(r.prev)
                return (
                  <tr key={r.key} className="group transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td
                      className={cx(
                        CELL,
                        "sticky left-0 z-10 max-w-[11rem] truncate bg-white px-2 py-2 font-medium text-neutral-900 group-hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-100 dark:group-hover:bg-neutral-800",
                        edges.left && COL_SHADOW,
                      )}
                      title={r.name}
                    >
                      {r.name}
                    </td>
                    <td className={td}>{r.cur.sharePct === null ? "—" : formatPct(r.cur.sharePct)}</td>
                    <IdxCell v={idx(r.cur.sales, r.prev.sales)} solid />
                    <td className={cx(td, "font-semibold text-neutral-900 dark:text-neutral-100")}>{formatEurWhole(r.cur.sales)}</td>
                    <td className={td}>{wl(r.cur.sales - r.prev.sales)}</td>
                    <IdxCell v={idx(r.cur.units, r.prev.units)} />
                    <td className={td}>{formatInt(r.cur.units)}</td>
                    <IdxCell v={r.cur.grossProfit === undefined ? null : idx(r.cur.grossProfit, r.prev.grossProfit ?? 0)} />
                    <td className={td}>{r.cur.marginPct === null ? "—" : formatPct(r.cur.marginPct)}</td>
                    <td className={td}>{r.cur.markdownPct == null ? "—" : formatPct(r.cur.markdownPct)}</td>
                    <IdxCell v={price !== null && prevPrice ? idx(price, prevPrice) : null} />
                    <td className={td}>{price === null ? "—" : one.format(price)}</td>
                    <td className={td}>{formatEurWhole(r.stockValue)}</td>
                    <td className={td}>{r.stockShare === null ? "—" : formatPct(r.stockShare)}</td>
                    <StockIdxCell v={stockIdx(r)} />
                    <td className={td}>{formatInt(r.stockUnits)}</td>
                    <td className={td}>{r.cover === null ? "—" : one.format(r.cover)}</td>
                  </tr>
                )
              })}
            </tbody>
            {/* Totals stay at the bottom of the scroll box; their category cell also stays on the left */}
            <tfoot
              className={cx(
                "font-semibold [&_td]:sticky [&_td]:bottom-0 [&_td]:z-20 [&_td]:border-t-2 [&_td]:border-b-0 [&_td]:border-neutral-200 [&_td]:bg-white dark:[&_td]:border-neutral-700 dark:[&_td]:bg-neutral-900",
                "[&_td:first-child]:left-0 [&_td:first-child]:z-30",
                edges.left && "[&_td:first-child]:shadow-[6px_0_8px_-6px_rgba(0,0,0,0.25)]",
              )}
            >
              <tr className="text-neutral-900 dark:text-neutral-100">
                <td className="px-2 py-2.5 text-left">{ct.total}</td>
                <td className={td}>100%</td>
                <IdxCell v={idx(tot.sales, tot.prevSales)} solid />
                <td className={td}>{formatEurWhole(tot.sales)}</td>
                <td className={td}>{wl(tot.sales - tot.prevSales)}</td>
                <IdxCell v={idx(tot.units, tot.prevUnits)} />
                <td className={td}>{formatInt(tot.units)}</td>
                <IdxCell v={hasGp ? idx(tot.gp, tot.prevGp) : null} />
                <td className={td}>{hasGp && tot.net > 0 ? formatPct((tot.gp / tot.net) * 100) : "—"}</td>
                <td className={td}>{hasList && tot.list > 0 ? formatPct(((tot.list - tot.sales) / tot.list) * 100) : "—"}</td>
                <IdxCell v={totPrice !== null && totPrevPrice ? idx(totPrice, totPrevPrice) : null} />
                <td className={td}>{totPrice === null ? "—" : one.format(totPrice)}</td>
                <td className={td}>{formatEurWhole(tot.stockValue)}</td>
                <td className={td}>{tot.stockValue > 0 ? "100%" : "—"}</td>
                <td className={td}>100</td>
                <td className={td}>{formatInt(tot.stockUnits)}</td>
                <td className={td}>{totCover === null ? "—" : one.format(totCover)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {/* Fade on the right edge while there are more columns that way */}
        {edges.right && (
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-40 w-10 bg-linear-to-l from-white to-transparent dark:from-neutral-900" />
        )}
      </div>
    </Card>
  )
}
