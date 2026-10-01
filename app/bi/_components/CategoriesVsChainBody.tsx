"use client"

// app/bi/_components/CategoriesVsChainBody.tsx
// Store page category card with two views:
//   Vs the chain    this store's category shares next to the chain's
//   Stock vs sales  this store's share of sales next to its share of stock (same view as the overview)
import { useState } from "react"
import type { BiCategories } from "@/app/lib/bi/types"
import { useT } from "@/app/lib/i18n/client"
import { formatPct } from "../../campaigns/_components/campaign-utils"
import { CardTabs, StockVsSales, categoryName } from "./CategoryMixBody"
import { signedPp } from "./ui"

type View = "chain" | "stock"

export default function CategoriesVsChainBody({ store, chain }: { store: BiCategories; chain: BiCategories }) {
  const t = useT()
  const c9 = t.bi.categories
  const [view, setView] = useState<View>("chain")
  const hasStock = store.categories.some((c) => c.stock)

  const chainShare = new Map(chain.categories.map((c) => [c.category, c.current.sharePct ?? 0]))
  const cats = store.categories.filter((c) => c.current.sales > 0).slice(0, 10)
  const max = Math.max(1, ...cats.map((c) => Math.max(c.current.sharePct ?? 0, chainShare.get(c.category) ?? 0)))

  return (
    <>
      {hasStock && (
        <CardTabs
          label={c9.vsChainTitle}
          tabs={[
            { id: "chain" as View, label: c9.tabChain },
            { id: "stock" as View, label: c9.tabStock },
          ]}
          value={view}
          onChange={setView}
        />
      )}
      {view === "stock" && hasStock ? (
        <StockVsSales data={store} limit={10} t={t} />
      ) : (
        <div className="px-5 py-4">
          <div className="mb-3 flex gap-4 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5"><i className="inline-block h-1 w-3 rounded-full bg-brand-600 dark:bg-brand-400" />{c9.thisStore}</span>
            <span className="inline-flex items-center gap-1.5"><i className="inline-block h-1 w-3 rounded-full bg-neutral-400" />{c9.chain}</span>
          </div>
          <ul className="space-y-3.5">
            {cats.map((c) => {
              const s = c.current.sharePct ?? 0
              const ch = chainShare.get(c.category) ?? 0
              const d = s - ch
              return (
                <li key={c.category}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-neutral-800 dark:text-neutral-100">{categoryName(c.category, t)}</span>
                    <span className="shrink-0 font-semibold text-neutral-900 tabular-nums dark:text-neutral-100">{formatPct(s)}</span>
                  </div>
                  <div className="relative mt-1.5 h-3.5">
                    <span className="absolute top-0 left-0 h-1.5 rounded-r-[3px] bg-brand-600 dark:bg-brand-400" style={{ width: `${(s / max) * 100}%` }} />
                    <span className="absolute top-2 left-0 h-1.5 rounded-r-[3px] bg-neutral-300 dark:bg-neutral-600" style={{ width: `${(ch / max) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-500 tabular-nums dark:text-neutral-400">
                    <span>{c9.chainPct(formatPct(ch))}</span>
                    <span className={Math.abs(d) < 1 ? "" : d > 0 ? "font-medium text-emerald-700 dark:text-emerald-400" : "font-medium text-red-600 dark:text-red-400"}>
                      {Math.abs(d) < 1 ? c9.inLine : c9.vsChain(signedPp(d))}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </>
  )
}
