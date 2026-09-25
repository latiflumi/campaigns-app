"use client"

// app/campaigns/[id]/_components/Leaderboards.tsx
// Ranked bar lists for the campaign's ERP analytics. Every value is printed as
// text next to its bar, so the bars add shape at a glance and never gate a number.

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown, Building2, ShoppingBag, Layers, type LucideIcon } from "lucide-react"
import type { CampaignDetailedAnalytics } from "@/app/api/erp/actions"
import { formatEur, formatInt, formatPct } from "../../_components/campaign-utils"
import { cx } from "../../_components/parts"

type StoreRow = CampaignDetailedAnalytics["storeBreakdown"][number]
type ProductRow = CampaignDetailedAnalytics["topProducts"][number]
type CategoryRow = CampaignDetailedAnalytics["topCategories"][number]

// ---------- shared pieces ----------

/** One-hue magnitude bar: square at the baseline, 4px rounded data end. The leader gets the full-strength step. */
function Bar({ share, lead }: { share: number; lead?: boolean }) {
  return (
    <div className="h-2 w-full rounded-r-[4px] bg-brand-50 dark:bg-brand-500/10">
      <motion.div
        className={cx("h-full rounded-r-[4px]", lead ? "bg-brand-500 dark:bg-brand-400" : "bg-brand-300 dark:bg-brand-400/55")}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(1, share)) * 100}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}

function Rank({ n }: { n: number }) {
  return (
    <span
      className={cx(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold tabular-nums",
        n === 1
          ? "bg-brand-500 text-white dark:bg-brand-400 dark:text-neutral-950"
          : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
      )}
    >
      {n}
    </span>
  )
}

export function Panel({
  icon: Icon,
  title,
  aside,
  children,
  className,
}: {
  icon: LucideIcon
  title: string
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cx("rounded-2xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900", className)}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          <Icon className="size-4 text-neutral-400" />
          {title}
        </h2>
        {aside}
      </header>
      {children}
    </section>
  )
}

function ShowMore({ open, total, onToggle }: { open: boolean; total: number; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full cursor-pointer items-center justify-center gap-1.5 border-t border-neutral-100 py-2.5 text-xs font-semibold text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-800 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-200"
    >
      {open ? "Shfaq më pak" : `Shfaq të gjitha (${total})`}
      <ChevronDown className={cx("size-3.5 transition-transform", open && "rotate-180")} />
    </button>
  )
}

// ---------- stores ----------

type StoreMetric = "revenue" | "margin" | "units" | "markdown"

const STORE_METRICS: Record<
  StoreMetric,
  { label: string; get: (s: StoreRow) => number; format: (n: number) => string; percent: boolean }
> = {
  revenue: { label: "Qarkullimi", get: (s) => s.grossRevenue ?? 0, format: formatEur, percent: false },
  margin: { label: "Marzha", get: (s) => s.grossMarginPct ?? 0, format: formatPct, percent: true },
  units: { label: "Njësi", get: (s) => s.unitsSold ?? 0, format: formatInt, percent: false },
  markdown: { label: "Markdown", get: (s) => s.markdownPct ?? 0, format: formatPct, percent: true },
}

const STORES_COLLAPSED = 8

function storeTooltip(s: StoreRow) {
  return [
    s.OrgName,
    `Qarkullimi bruto: ${formatEur(s.grossRevenue ?? 0)}`,
    `Qarkullimi neto: ${formatEur(s.netRevenue ?? 0)}`,
    `Fitimi bruto: ${formatEur(s.grossProfit ?? 0)}`,
    `Marzha: ${formatPct(s.grossMarginPct ?? 0)}`,
    `Njësi: ${formatInt(s.unitsSold ?? 0)}`,
    `Markdown: ${formatPct(s.markdownPct ?? 0)} (${formatEur(s.markdownAmount ?? 0)})`,
  ].join("\n")
}

export function StoreLeaderboard({
  stores,
  totalRevenue,
  silentStores,
}: {
  stores: StoreRow[]
  totalRevenue: number
  silentStores: string[]
}) {
  const [metric, setMetric] = useState<StoreMetric>("revenue")
  const [open, setOpen] = useState(false)

  const m = STORE_METRICS[metric]
  const sorted = [...stores].sort((a, b) => m.get(b) - m.get(a))
  const visible = open ? sorted : sorted.slice(0, STORES_COLLAPSED)
  // Percentages are drawn on an honest 0–100 scale; amounts relative to the leader
  const scaleMax = m.percent ? 100 : Math.max(...sorted.map(m.get), 0)

  return (
    <Panel
      icon={Building2}
      title="Performanca sipas dyqaneve"
      aside={
        <div role="radiogroup" aria-label="Rendit sipas" className="flex gap-0.5 rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-800/70">
          {(Object.keys(STORE_METRICS) as StoreMetric[]).map((key) => {
            const active = key === metric
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMetric(key)}
                className={cx(
                  "relative cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  active ? "text-neutral-900 dark:text-white" : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="store-metric"
                    className="absolute inset-0 rounded-md bg-white shadow-sm dark:bg-neutral-900"
                    transition={{ type: "spring", bounce: 0.18, duration: 0.4 }}
                  />
                )}
                <span className="relative">{STORE_METRICS[key].label}</span>
              </button>
            )
          })}
        </div>
      }
    >
      <ol className="divide-y divide-neutral-100 dark:divide-neutral-800">
        <AnimatePresence initial={false}>
          {visible.map((s, i) => {
            const value = m.get(s)
            const share = totalRevenue > 0 ? (s.grossRevenue ?? 0) / totalRevenue : 0
            return (
              <motion.li
                key={s.OrgId}
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                title={storeTooltip(s)}
                className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-x-3 px-5 py-3 transition-colors hover:bg-neutral-50/70 dark:hover:bg-neutral-800/30"
              >
                <Rank n={i + 1} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">{s.OrgName}</div>
                  <div className="mt-1.5">
                    <Bar share={scaleMax > 0 ? value / scaleMax : 0} lead={i === 0} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{m.format(value)}</div>
                  <div className="text-[11px] tabular-nums text-neutral-400 dark:text-neutral-500">
                    {metric === "revenue" ? `${formatPct(share * 100)} e totalit` : formatEur(s.grossRevenue ?? 0)}
                  </div>
                </div>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ol>

      {sorted.length > STORES_COLLAPSED && <ShowMore open={open} total={sorted.length} onToggle={() => setOpen((v) => !v)} />}

      {silentStores.length > 0 && (
        <p
          className="border-t border-neutral-100 px-5 py-3 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400"
          title={silentStores.join("\n")}
        >
          <span className="font-semibold text-neutral-700 dark:text-neutral-200">{silentStores.length}</span>{" "}
          {silentStores.length === 1 ? "dyqan pjesëmarrës nuk ka" : "dyqane pjesëmarrëse nuk kanë"} shitje në këtë periudhë.
        </p>
      )}
    </Panel>
  )
}

// ---------- products ----------

const PRODUCTS_COLLAPSED = 8

export function ProductLeaderboard({ products }: { products: ProductRow[] }) {
  const [open, setOpen] = useState(false)
  const sorted = [...products].sort((a, b) => (b.grossRevenue ?? 0) - (a.grossRevenue ?? 0))
  const visible = open ? sorted : sorted.slice(0, PRODUCTS_COLLAPSED)
  const max = Math.max(...sorted.map((p) => p.grossRevenue ?? 0), 0)

  return (
    <Panel icon={ShoppingBag} title="Produktet më të shitura" aside={<span className="text-xs text-neutral-400">sipas qarkullimit</span>}>
      <ol className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {visible.map((p, i) => (
          <li
            key={p.ArtikulliId}
            className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-x-3 px-5 py-3 transition-colors hover:bg-neutral-50/70 dark:hover:bg-neutral-800/30"
          >
            <Rank n={i + 1} />
            <div className="min-w-0">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">{p.ProductName}</span>
                <span className="shrink-0 font-mono text-[11px] text-neutral-400">#{p.StyleNumber}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="flex-1">
                  <Bar share={max > 0 ? (p.grossRevenue ?? 0) / max : 0} lead={i === 0} />
                </div>
                {p.CategoryName && (
                  <span className="hidden max-w-[40%] shrink-0 truncate rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 sm:inline dark:bg-neutral-800 dark:text-neutral-400">
                    {p.CategoryName}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{formatEur(p.grossRevenue ?? 0)}</div>
              <div className="text-[11px] tabular-nums text-neutral-400 dark:text-neutral-500">{formatInt(p.unitsSold ?? 0)} njësi</div>
            </div>
          </li>
        ))}
      </ol>
      {sorted.length > PRODUCTS_COLLAPSED && <ShowMore open={open} total={sorted.length} onToggle={() => setOpen((v) => !v)} />}
    </Panel>
  )
}

// ---------- categories ----------

export function CategoryBars({ categories }: { categories: CategoryRow[] }) {
  const sorted = [...categories].sort((a, b) => (b.grossRevenue ?? 0) - (a.grossRevenue ?? 0))
  const total = sorted.reduce((sum, c) => sum + (c.grossRevenue ?? 0), 0)
  const max = Math.max(...sorted.map((c) => c.grossRevenue ?? 0), 0)

  return (
    <Panel icon={Layers} title="Kategoritë kryesore">
      <ul className="space-y-4 px-5 py-4">
        {sorted.map((c, i) => (
          <li key={c.CategoryName} title={`${c.CategoryName}\n${formatEur(c.grossRevenue ?? 0)} · ${formatInt(c.unitsSold ?? 0)} njësi`}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium text-neutral-800 dark:text-neutral-100">{c.CategoryName}</span>
              <span className="shrink-0 font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{formatEur(c.grossRevenue ?? 0)}</span>
            </div>
            <div className="mt-1.5">
              <Bar share={max > 0 ? (c.grossRevenue ?? 0) / max : 0} lead={i === 0} />
            </div>
            <div className="mt-1 flex justify-between text-[11px] tabular-nums text-neutral-400 dark:text-neutral-500">
              <span>{formatInt(c.unitsSold ?? 0)} njësi</span>
              <span>{total > 0 ? formatPct(((c.grossRevenue ?? 0) / total) * 100) : "—"}</span>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
