"use client"

// app/bi/_components/StockAlertList.tsx
// Stock alerts with kind filter chips (All / Out of stock / Low stock / Not selling). The list scrolls
// inside its card, like the top products.
import { useState } from "react"
import Link from "next/link"
import { ArrowRightLeft } from "lucide-react"
import type { BiStockAlert, BiStockAlerts } from "@/app/lib/bi/types"
import { locationOf } from "@/app/lib/bi/brands"
import ProductThumb from "@/app/ProductThumb"
import { formatDay, formatInt } from "../../campaigns/_components/campaign-utils"
import AttrChips from "./AttrChips"
import { cx } from "./ui"
import { useT } from "@/app/lib/i18n/client"
import type { Dict } from "@/app/lib/i18n/dictionaries"

const KIND = {
  out: { pill: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" },
  low: { pill: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
  slow: { pill: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300" },
} as const

type Kind = keyof typeof KIND

function alertText(a: BiStockAlert, days: number, t: Dict) {
  const s = t.bi.stock
  if (a.kind === "out") return s.outText(formatInt(a.unitsSold), days)
  if (a.kind === "low") return s.lowText(formatInt(a.stock), formatInt(a.unitsSold), days, String(a.weeksCover).replace(".", ","))
  const delivered = a.lastDeliveryDate ? s.lastDelivered(formatDay(t, a.lastDeliveryDate, true)) : ""
  return s.slowText(formatInt(a.stock), days) + delivered
}

const sourceName = (s: { isWarehouse: boolean; storeName: string }, t: Dict) => (s.isWarehouse ? t.bi.stock.warehouse : locationOf(s.storeName))

/**
 * Suggested transfer for out/low alerts: "Send 5 from Warehouse, 3 from Prishtina Mall · 2 short".
 * Enough to cover `coverWeeks` of this store's sales; each source keeps its own next 4 weeks.
 */
function TransferHint({ a, coverWeeks, t }: { a: BiStockAlert; coverWeeks: number; t: Dict }) {
  if (a.kind === "slow") return null
  // erp-api builds before suggested quantities: show the spare stock only
  if (a.transferNeed === undefined) {
    if (a.transferFrom.length === 0) return null
    return (
      <span className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
        <ArrowRightLeft className="size-3 text-emerald-600 dark:text-emerald-400" aria-hidden />
        {t.bi.stock.transferFrom}
        {a.transferFrom.map((s, i) => (
          <span key={s.orgId} className="font-medium text-neutral-700 dark:text-neutral-200">
            {sourceName(s, t)} ({t.bi.stock.spare(formatInt(s.spare))}){i < a.transferFrom.length - 1 ? "," : ""}
          </span>
        ))}
      </span>
    )
  }
  if (a.transferNeed <= 0) return null
  const sends = a.transferFrom.filter((s) => s.send > 0)
  if (sends.length === 0) {
    return <span className="block text-[11px] text-neutral-400 dark:text-neutral-500">{t.bi.stock.needsNone(formatInt(a.transferNeed))}</span>
  }
  const short = a.transferNeed - sends.reduce((n, s) => n + s.send, 0)
  return (
    <span
      className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400"
      title={t.bi.stock.hintTitle(coverWeeks, formatInt(a.transferNeed), a.transferFrom.map((s) => `${sourceName(s, t)} ${formatInt(s.spare)}`).join(", "))}
    >
      <ArrowRightLeft className="size-3 text-emerald-600 dark:text-emerald-400" aria-hidden />
      {t.bi.stock.send}
      {sends.map((s, i) => (
        <span key={s.orgId} className="font-medium text-neutral-700 dark:text-neutral-200">
          {t.bi.stock.sendFrom(formatInt(s.send), sourceName(s, t))}
          {i < sends.length - 1 ? "," : ""}
        </span>
      ))}
      {short > 0 && <span className="text-amber-700 dark:text-amber-400">{t.bi.stock.short(formatInt(short))}</span>}
    </span>
  )
}

export default function StockAlertList({ data, showStore, query }: { data: BiStockAlerts; showStore: boolean; query: string }) {
  const t = useT()
  const [kind, setKind] = useState<Kind | "all">("all")
  const { alerts, window } = data
  const counts = { out: 0, low: 0, slow: 0 }
  for (const a of alerts) counts[a.kind]++
  const shown = kind === "all" ? alerts : alerts.filter((a) => a.kind === kind)

  const chips: { id: Kind | "all"; label: string; count: number }[] = [
    { id: "all", label: t.bi.stock.all, count: alerts.length },
    ...(Object.keys(KIND) as Kind[]).filter((k) => counts[k] > 0).map((k) => ({ id: k, label: t.bi.stock.kinds[k], count: counts[k] })),
  ]

  return (
    <>
      <div role="tablist" aria-label={t.bi.stock.alertType} className="flex gap-1.5 overflow-x-auto border-b border-neutral-100 px-5 py-2.5 dark:border-neutral-800">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={kind === c.id}
            onClick={() => setKind(c.id)}
            className={cx(
              "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors",
              kind === c.id
                ? c.id === "all"
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : KIND[c.id as Kind].pill
                : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400 dark:hover:bg-neutral-800",
            )}
          >
            {c.label}
            <span className="tabular-nums opacity-70">{c.count}</span>
          </button>
        ))}
      </div>
      <ul className="max-h-[30rem] divide-y divide-neutral-100 overflow-y-auto overscroll-contain dark:divide-neutral-800">
        {shown.map((a) => (
          <li key={`${a.kind}-${a.orgId}-${a.articleId}`} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 px-5 py-2.5">
            <ProductThumb styleNumber={a.styleNumber} colorCode={a.colorCode} alt={a.productName} />
            <span className="min-w-0">
              <span className={cx("mb-1 inline-block rounded-full px-2 py-0.5 text-[10.5px] font-semibold whitespace-nowrap", KIND[a.kind].pill)}>{t.bi.stock.kinds[a.kind]}</span>
              <span className="block truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {a.productName}
                {a.styleNumber && <span className="ml-1.5 font-mono text-[11px] font-normal text-neutral-400">#{a.styleNumber}</span>}
              </span>
              <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                {showStore && (
                  <Link href={`/bi/stores/${a.orgId}?${query}`} className="font-medium text-neutral-700 hover:underline dark:text-neutral-300">
                    {locationOf(a.storeName)}
                  </Link>
                )}
                {showStore && " · "}
                {alertText(a, window.days, t)}
              </span>
              <AttrChips item={a} t={t} />
              <TransferHint a={a} coverWeeks={window.coverWeeks ?? 4} t={t} />
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}
