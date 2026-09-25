"use client"

// app/campaigns/_components/parts.tsx
// Small presentational pieces shared by the list and grid views.

import { useEffect, useRef } from "react"
import Link from "next/link"
import { animate, motion, useReducedMotion } from "motion/react"
import { Eye, Pencil, Trash2 } from "lucide-react"
import {
  channelMeta,
  statusMeta,
  formatEur,
  formatInt,
  type CampaignListItem,
  type Timeline,
} from "./campaign-utils"

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ")
}

// ---------- badges ----------

export function StatusPill({ status }: { status: string }) {
  const meta = statusMeta(status)
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset", meta.pill)}>
      <span className="relative flex size-1.5">
        {meta.pulse && <span className={cx("absolute inline-flex size-full animate-ping rounded-full opacity-75", meta.dot)} />}
        <span className={cx("relative inline-flex size-1.5 rounded-full", meta.dot)} />
      </span>
      {meta.label}
    </span>
  )
}

export function ChannelTile({ type, size = "md" }: { type: string; size?: "md" | "lg" }) {
  const meta = channelMeta(type)
  const Icon = meta.icon
  return (
    <span
      title={meta.label}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
        size === "lg" ? "size-11" : "size-10",
        meta.tile
      )}
    >
      <Icon className={size === "lg" ? "size-5" : "size-[18px]"} />
    </span>
  )
}

// ---------- timeline ----------

// Motion under the list's <MotionConfig reducedMotion="user"> drops transform
// animations for users who ask for less motion; nothing here branches on it,
// so server and client render the same tree.
export function TimelineBar({ timeline }: { timeline: Timeline }) {
  const { phase, progress, days } = timeline

  const endingSoon = phase === "live" && days <= 3
  const fill =
    phase === "ended" ? "bg-neutral-300 dark:bg-neutral-600"
    : endingSoon ? "bg-linear-to-r from-amber-400 to-orange-500"
    : "bg-linear-to-r from-emerald-400 to-emerald-500"

  const width = phase === "ended" ? 1 : phase === "live" ? Math.max(progress, 0.03) : 0

  return (
    <div
      className={cx(
        "relative h-1.5 w-full overflow-hidden rounded-full",
        phase === "upcoming" || phase === "undated"
          ? "bg-[repeating-linear-gradient(90deg,var(--color-neutral-200)_0_6px,transparent_6px_10px)] dark:bg-[repeating-linear-gradient(90deg,var(--color-neutral-700)_0_6px,transparent_6px_10px)]"
          : "bg-neutral-100 dark:bg-neutral-800"
      )}
    >
      {phase === "open" ? (
        // Open-ended: a faint fill plus an indeterminate sweep instead of a percentage
        <>
          <div className="absolute inset-0 rounded-full bg-emerald-400/25" />
          <motion.div
            className="absolute inset-y-0 w-1/3 rounded-full bg-linear-to-r from-transparent via-emerald-400 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      ) : (
        <motion.div
          className={cx("relative h-full overflow-hidden rounded-full", fill)}
          initial={{ width: 0 }}
          animate={{ width: `${width * 100}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          {phase === "live" && (
            <motion.span
              className="absolute inset-y-0 w-8 bg-linear-to-r from-transparent via-white/60 to-transparent"
              initial={{ x: "-2rem" }}
              animate={{ x: ["-2rem", "20rem"] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "linear", repeatDelay: 0.6 }}
            />
          )}
        </motion.div>
      )}
    </div>
  )
}

export function timelineTone(timeline: Timeline) {
  switch (timeline.phase) {
    case "live":
      return timeline.days <= 3 ? "text-orange-600 dark:text-orange-400" : "text-emerald-700 dark:text-emerald-400"
    case "open":
      return "text-emerald-700 dark:text-emerald-400"
    case "upcoming":
      return "text-sky-700 dark:text-sky-400"
    default:
      return "text-neutral-500 dark:text-neutral-400"
  }
}

// ---------- stores ----------

export function storeSummary(stores: string[], totalStores: number) {
  if (stores.length === 0) return "No stores"
  if (totalStores > 0 && stores.length >= totalStores) return "All stores"
  if (stores.length === 1) return stores[0]
  return `${stores.length} stores`
}

function storeTooltip(stores: string[]) {
  if (stores.length <= 1) return undefined
  const shown = stores.slice(0, 15).join("\n")
  return stores.length > 15 ? `${shown}\n+${stores.length - 15} more` : shown
}

export function StoreCoverage({ stores, totalStores }: { stores: string[]; totalStores: number }) {
  const share = totalStores > 0 ? Math.min(1, stores.length / totalStores) : 0
  return (
    // relative z-10 lifts it above the row's stretched link so the tooltip shows
    <div className="relative z-10 min-w-0" title={storeTooltip(stores)}>
      <div className="truncate text-sm font-medium text-neutral-700 dark:text-neutral-200">
        {storeSummary(stores, totalStores)}
      </div>
      {stores.length > 1 && totalStores > 0 && (
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1 w-16 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div className="h-full rounded-full bg-brand-400/80" style={{ width: `${share * 100}%` }} />
          </div>
          <span className="text-[11px] tabular-nums text-neutral-400 dark:text-neutral-500">
            {stores.length}/{totalStores}
          </span>
        </div>
      )}
    </div>
  )
}

// ---------- money ----------

export function RevenueCell({
  campaign,
  maxRevenue,
  align = "right",
}: {
  campaign: CampaignListItem
  maxRevenue: number
  align?: "left" | "right"
}) {
  const { grossRevenue, unitsSold } = campaign

  if (grossRevenue === null) {
    return (
      <div className={cx("text-sm text-neutral-400 dark:text-neutral-500", align === "right" && "text-right")} title="No revenue data for this campaign">
        —
      </div>
    )
  }

  const share = maxRevenue > 0 ? grossRevenue / maxRevenue : 0
  return (
    <div className={cx("min-w-0", align === "right" && "text-right")}>
      <div className="text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{formatEur(grossRevenue)}</div>
      <div className={cx("mt-1.5 flex items-center gap-2", align === "right" && "justify-end")}>
        {unitsSold !== null && (
          <span className="text-[11px] tabular-nums text-neutral-400 dark:text-neutral-500">{formatInt(unitsSold)} units</span>
        )}
        <div className="h-1 w-14 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <motion.div
            className="h-full rounded-full bg-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${share * 100}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          />
        </div>
      </div>
    </div>
  )
}

export function BudgetText({ budget }: { budget: number | null }) {
  if (!budget) return <span className="text-neutral-400 dark:text-neutral-500">—</span>
  return <span className="tabular-nums">{`€${formatInt(budget)}`}</span>
}

// ---------- actions ----------

const actionBtn =
  "inline-flex size-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-brand-500 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 cursor-pointer"

export function RowActions({ id, name, onDelete }: { id: string; name: string; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-0.5">
      <Link href={`/campaigns/${id}`} className={actionBtn} aria-label={`View ${name}`} title="View">
        <Eye className="size-4" />
      </Link>
      <Link href={`/campaigns/${id}/edit`} className={actionBtn} aria-label={`Edit ${name}`} title="Edit">
        <Pencil className="size-4" />
      </Link>
      <button
        type="button"
        onClick={onDelete}
        className={cx(actionBtn, "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400")}
        aria-label={`Delete ${name}`}
        title="Delete"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}

// ---------- text ----------

/** Wraps the parts of `text` that match `query` in a highlight. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>

  const lower = text.toLowerCase()
  const needle = q.toLowerCase()
  const out: React.ReactNode[] = []
  let i = 0
  let hit = lower.indexOf(needle)
  while (hit !== -1) {
    if (hit > i) out.push(text.slice(i, hit))
    out.push(
      <mark key={hit} className="rounded-sm bg-amber-200/70 px-0.5 text-inherit dark:bg-amber-400/30">
        {text.slice(hit, hit + needle.length)}
      </mark>
    )
    i = hit + needle.length
    hit = lower.indexOf(needle, i)
  }
  if (i < text.length) out.push(text.slice(i))
  return <>{out}</>
}

/** Renders `format(value)` and tweens between values when it changes (not on first paint). */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(value)
  const reduce = useReducedMotion()

  useEffect(() => {
    const from = prev.current
    prev.current = value
    if (from === value || reduce || !ref.current) return
    const controls = animate(from, value, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = format(v)
      },
    })
    return () => controls.stop()
  }, [value, format, reduce])

  return <span ref={ref}>{format(value)}</span>
}
