"use client"

// app/bi/_components/StoreTable.tsx
// Every store in the selection, sortable. Default order is growth, so a small store doing well can top the list.
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2 } from "lucide-react"
import type { BiStoreRow } from "@/app/lib/bi/types"
import { brandOf, locationOf } from "@/app/lib/bi/brands"
import { formatEurWhole, formatPct } from "../../campaigns/_components/campaign-utils"
import { Card, CardHeader, cx, growth, signedPct } from "./ui"
import { useT } from "@/app/lib/i18n/client"

type Key = "name" | "sales" | "growth" | "margin" | "markdown" | "atv"

const value: Record<Key, (r: BiStoreRow) => number | string> = {
  name: (r) => r.name,
  sales: (r) => r.current.sales,
  growth: (r) => (r.lfl ? growth(r.current.sales, r.previous.sales) ?? -Infinity : -Infinity),
  margin: (r) => r.current.marginPct ?? -Infinity,
  markdown: (r) => r.current.markdownPct ?? -Infinity,
  atv: (r) => r.current.atv ?? -Infinity,
}

/** Diverging bar: growth to the right, decline to the left, zero in the middle (±30% fills a side). */
function GrowthBar({ g }: { g: number }) {
  const w = Math.min(1, Math.abs(g) / 0.3) * 50
  return (
    <div className="relative h-2.5 w-24" aria-hidden>
      <span className="absolute inset-y-[-2px] left-1/2 w-px bg-neutral-200 dark:bg-neutral-700" />
      <span
        className={cx("absolute top-0 h-full", g >= 0 ? "left-1/2 rounded-r-[4px] bg-emerald-500" : "right-1/2 rounded-l-[4px] bg-red-500")}
        style={{ width: `${w}%` }}
      />
    </div>
  )
}

export default function StoreTable({ rows, compareLabel, query }: { rows: BiStoreRow[]; compareLabel: string; query: string }) {
  const router = useRouter()
  const t = useT()
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: "growth", dir: -1 })

  const sorted = [...rows].sort((a, b) => {
    const va = value[sort.key](a), vb = value[sort.key](b)
    return (typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number)) * sort.dir
  })
  const maxSales = Math.max(1, ...rows.map((r) => r.current.sales))

  const th = (key: Key, label: string, right = false) => (
    <th className={cx("px-3 py-2.5 text-[11px] font-semibold tracking-wider whitespace-nowrap text-neutral-400 uppercase", right && "text-right")}>
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

  const open = (orgId: number) => router.push(`/bi/stores/${orgId}?${query}`)

  return (
    <Card>
      <CardHeader icon={Building2} title={t.bi.storesTable.title} sub={t.bi.storesTable.sub(rows.length, compareLabel)} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-100 dark:border-neutral-800">
            <tr>
              <th className="w-10 px-3 py-2.5 text-[11px] font-semibold text-neutral-400">#</th>
              {th("name", t.bi.storesTable.store)}
              {th("sales", t.bi.storesTable.sales, true)}
              {th("growth", t.bi.storesTable.growth, true)}
              <th aria-label={t.bi.storesTable.growthBar} />
              {th("margin", t.bi.storesTable.margin, true)}
              {th("markdown", t.bi.storesTable.markdown, true)}
              {th("atv", t.bi.storesTable.basket, true)}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {sorted.map((r, i) => {
              const g = r.lfl ? growth(r.current.sales, r.previous.sales) : null
              return (
                <tr
                  key={r.orgId}
                  tabIndex={0}
                  onClick={() => open(r.orgId)}
                  onKeyDown={(e) => e.key === "Enter" && open(r.orgId)}
                  className="cursor-pointer transition-colors hover:bg-neutral-50 focus-visible:bg-neutral-50 dark:hover:bg-neutral-800/40 dark:focus-visible:bg-neutral-800/40"
                >
                  <td className="px-3 py-2.5">
                    <span className={cx("inline-grid size-6 place-items-center rounded-md text-[11px] font-bold tabular-nums", i === 0 && sort.key !== "name" ? "bg-brand-600 text-white dark:bg-brand-400 dark:text-neutral-950" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400")}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium whitespace-nowrap text-neutral-900 dark:text-neutral-100">{locationOf(r.name)}</div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{brandOf(r.name)}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">{formatEurWhole(r.current.sales)}</div>
                    <div className="mt-1 ml-auto h-1 w-20 rounded-r-[4px] bg-neutral-100 dark:bg-neutral-800">
                      <div className="h-full rounded-r-[4px] bg-neutral-400 dark:bg-neutral-500" style={{ width: `${(r.current.sales / maxSales) * 100}%` }} />
                    </div>
                  </td>
                  <td className={cx("px-3 py-2.5 text-right font-semibold tabular-nums", g === null ? "text-neutral-400" : g >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                    {g === null ? (r.lfl ? t.bi.kpi.na : t.bi.storesTable.new) : signedPct(g)}
                  </td>
                  <td className="px-2 py-2.5">{g !== null && <GrowthBar g={g} />}</td>
                  <td className="px-3 py-2.5 text-right text-neutral-700 tabular-nums dark:text-neutral-300">{r.current.marginPct === null ? "—" : formatPct(r.current.marginPct)}</td>
                  <td className="px-3 py-2.5 text-right text-neutral-700 tabular-nums dark:text-neutral-300">{r.current.markdownPct === null ? "—" : formatPct(r.current.markdownPct)}</td>
                  <td className="px-3 py-2.5 text-right text-neutral-700 tabular-nums dark:text-neutral-300">{r.current.atv === null ? "—" : formatEurWhole(r.current.atv)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
