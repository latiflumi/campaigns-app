"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { toast } from "sonner"
import {
  Search,
  Plus,
  LayoutList,
  LayoutGrid,
  Radio,
  Percent,
  CalendarClock,
  Store as StoreIcon,
  X,
  ChevronDown,
  Calendar,
  ArrowRight,
  Megaphone,
  type LucideIcon,
} from "lucide-react"
import { deleteCampaign } from "./actions"
import type { CampaignStatus } from "../types/CampaignTypes"
import {
  DAY,
  STATUS_ORDER,
  VIEW_COOKIE,
  formatEurWhole,
  formatPct,
  formatInt,
  formatToday,
  getTimeline,
  statusMeta,
  type CampaignListItem,
  type SortKey,
  type ViewMode,
} from "./_components/campaign-utils"
import { cx, AnimatedNumber } from "./_components/parts"
import { ListView, GridView, type ViewRow, type ViewSection } from "./_components/CampaignViews"

interface CampaignListProps {
  campaigns: CampaignListItem[]
  stores: { id: number; name: string }[]
  channels: string[]
  /** Server render time (ISO); keeps time-based UI identical during hydration. */
  now: string
  initialView: ViewMode
  /** ADMIN only: shows New campaign, Edit and Delete */
  canManage: boolean
}

/** Starts at the server's clock so hydration matches, then ticks every minute. */
function useNow(serverNow: string) {
  const [now, setNow] = useState(() => Date.parse(serverNow))
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}

const SORT_LABELS: Record<SortKey, string> = {
  smart: "Smart order",
  newest: "Newest first",
  revenue: "Highest revenue",
  name: "Name A–Z",
}

const PHASE_RANK = { live: 0, open: 1, upcoming: 2, ended: 3, undated: 4 } as const

export default function CampaignList({ campaigns, stores, channels, now: serverNow, initialView, canManage }: CampaignListProps) {
  const now = useNow(serverNow)

  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<CampaignStatus | "ALL">("ALL")
  const [store, setStore] = useState("")
  const [channel, setChannel] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [sort, setSort] = useState<SortKey>("smart")
  const [view, setView] = useState<ViewMode>(initialView)
  const [hidden, setHidden] = useState<Set<string>>(() => new Set())

  const searchRef = useRef<HTMLInputElement>(null)

  // "/" jumps to search from anywhere on the page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return
      if (target.closest("input, textarea, select, [contenteditable=true]")) return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const changeView = (next: ViewMode) => {
    setView(next)
    document.cookie = `${VIEW_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
  }

  const totalStores = stores.length

  // ---------- derive ----------

  const rows: ViewRow[] = useMemo(
    () =>
      campaigns
        .filter((c) => !hidden.has(c.id))
        .map((campaign) => ({ campaign, timeline: getTimeline(campaign, now) })),
    [campaigns, hidden, now]
  )

  // Everything except the status tab: drives tab counts and the stat tiles
  const base = useMemo(() => {
    const q = query.trim().toLowerCase()
    const fromMs = from ? Date.parse(from) : null
    const toMs = to ? Date.parse(to) + DAY - 1 : null

    return rows.filter(({ campaign: c }) => {
      if (q && !c.name.toLowerCase().includes(q) && !c.subject?.toLowerCase().includes(q)) return false
      if (store && !c.participatingStores.includes(store)) return false
      if (channel && c.type !== channel) return false
      if (c.startDate) {
        const start = Date.parse(c.startDate)
        const end = c.endDate ? Date.parse(c.endDate) + DAY - 1 : Infinity
        if (fromMs !== null && end < fromMs) return false
        if (toMs !== null && start > toMs) return false
      }
      return true
    })
  }, [rows, query, store, channel, from, to])

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of base) counts.set(r.campaign.status, (counts.get(r.campaign.status) ?? 0) + 1)
    return counts
  }, [base])

  const shown = useMemo(
    () => (status === "ALL" ? base : base.filter((r) => r.campaign.status === status)),
    [base, status]
  )

  const sections: ViewSection[] = useMemo(() => {
    const byName = (a: ViewRow, b: ViewRow) => a.campaign.name.localeCompare(b.campaign.name, "en", { sensitivity: "base" })
    const startOf = (r: ViewRow) => (r.campaign.startDate ? Date.parse(r.campaign.startDate) : -Infinity)

    if (sort !== "smart") {
      const sorted = [...shown].sort((a, b) => {
        if (sort === "name") return byName(a, b)
        if (sort === "revenue") return (b.campaign.grossRevenue ?? -1) - (a.campaign.grossRevenue ?? -1)
        return startOf(b) - startOf(a)
      })
      return [{ key: "all", title: null, rows: sorted }]
    }

    // Smart: live (ending soonest first) → upcoming (starting soonest) → past (most recent) → undated
    const smart = [...shown].sort((a, b) => {
      const pa = PHASE_RANK[a.timeline.phase]
      const pb = PHASE_RANK[b.timeline.phase]
      if (pa !== pb) return pa - pb
      if (a.timeline.phase === "undated") return byName(a, b)
      if (a.timeline.phase === "open") return startOf(b) - startOf(a)
      return a.timeline.days - b.timeline.days
    })

    const live = smart.filter((r) => r.timeline.phase === "live" || r.timeline.phase === "open")
    const upcoming = smart.filter((r) => r.timeline.phase === "upcoming")
    const past = smart.filter((r) => r.timeline.phase === "ended")
    const undated = smart.filter((r) => r.timeline.phase === "undated")
    const endingThisWeek = live.filter((r) => r.timeline.phase === "live" && r.timeline.days <= 7).length

    return [
      { key: "live", title: "Live now", hint: endingThisWeek ? `${endingThisWeek} ending this week` : undefined, rows: live },
      { key: "upcoming", title: "Upcoming", rows: upcoming },
      { key: "past", title: "Past", rows: past },
      { key: "undated", title: "No dates", rows: undated },
    ].filter((s) => s.rows.length > 0)
  }, [shown, sort])

  const maxRevenue = useMemo(
    () => shown.reduce((m, r) => Math.max(m, r.campaign.grossRevenue ?? 0), 0),
    [shown]
  )

  const stats = useMemo(() => {
    const live = base.filter(
      (r) => r.campaign.status === "ACTIVE" && (r.timeline.phase === "live" || r.timeline.phase === "open")
    )
    const upcoming = base
      .filter((r) => r.timeline.phase === "upcoming" && r.campaign.status !== "COMPLETED")
      .sort((a, b) => a.timeline.days - b.timeline.days)
    const reach = new Set(live.flatMap((r) => r.campaign.participatingStores))

    // Weighted margin across live campaigns, computed the way the ERP does per campaign
    // (gross profit ÷ net revenue). Live-only, so overlapping past campaigns aren't double counted.
    // ERP figures depend only on stores + dates, so campaigns with an identical scope
    // (e.g. a duplicated campaign) report the same sales; count each scope once.
    const scopes = new Set<string>()
    const withMargin = live.filter((r) => {
      const c = r.campaign
      if (c.grossProfit === null || c.netRevenue === null) return false
      const scope = `${[...c.participatingStores].sort().join("|")}@${c.startDate}–${c.endDate}`
      if (scopes.has(scope)) return false
      scopes.add(scope)
      return true
    })
    const profit = withMargin.reduce((sum, r) => sum + (r.campaign.grossProfit ?? 0), 0)
    const net = withMargin.reduce((sum, r) => sum + (r.campaign.netRevenue ?? 0), 0)
    const markdown = withMargin.reduce((sum, r) => sum + (r.campaign.markdownAmount ?? 0), 0)

    return {
      live: live.length,
      endingSoon: live.filter((r) => r.timeline.phase === "live" && r.timeline.days <= 7).length,
      margin: net > 0 ? (profit / net) * 100 : null,
      profit,
      markdown,
      upcoming: upcoming.length,
      next: upcoming[0],
      reach: reach.size,
    }
  }, [base])

  // ---------- filters ----------

  const activeFilters: { key: string; label: string; clear: () => void }[] = [
    query.trim() && { key: "q", label: `“${query.trim()}”`, clear: () => setQuery("") },
    store && { key: "store", label: store, clear: () => setStore("") },
    channel && { key: "channel", label: channel, clear: () => setChannel("") },
    (from || to) && {
      key: "dates",
      label: `${from || "…"} → ${to || "…"}`,
      clear: () => {
        setFrom("")
        setTo("")
      },
    },
  ].filter((f): f is { key: string; label: string; clear: () => void } => Boolean(f))

  const clearAll = () => {
    setQuery("")
    setStore("")
    setChannel("")
    setFrom("")
    setTo("")
    setStatus("ALL")
  }

  const tabs: { key: CampaignStatus | "ALL"; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: base.length },
    ...STATUS_ORDER.filter((s) => (statusCounts.get(s) ?? 0) > 0 || s === status).map((s) => ({
      key: s,
      label: statusMeta(s).label,
      count: statusCounts.get(s) ?? 0,
    })),
  ]

  // ---------- delete ----------

  const handleDelete = (c: CampaignListItem) => {
    toast(`Delete “${c.name}”?`, {
      description: "This permanently removes the campaign.",
      duration: Infinity,
      action: {
        label: "Delete",
        onClick: () => {
          // Hide it immediately; bring it back if the server says no
          setHidden((prev) => new Set(prev).add(c.id))
          const request = deleteCampaign(c.id).then((res) => {
            if (!res.success) throw new Error(res.error ?? "Failed to delete campaign.")
          })
          request.catch(() =>
            setHidden((prev) => {
              const next = new Set(prev)
              next.delete(c.id)
              return next
            })
          )
          toast.promise(request, {
            loading: "Deleting campaign…",
            success: "Campaign deleted.",
            error: (err: Error) => err.message,
          })
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    })
  }

  // ---------- render ----------

  const viewProps = { sections, now, query, totalStores, maxRevenue, onDelete: handleDelete, canManage }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-wide text-neutral-500 dark:text-neutral-400">{formatToday(now)}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Campaigns</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-neutral-500 dark:text-neutral-400">
              {stats.live > 0 && (
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  {stats.live} running now
                </span>
              )}
              {stats.live > 0 && <span aria-hidden>·</span>}
              <span>{stats.upcoming} upcoming</span>
              <span aria-hidden>·</span>
              <span>{rows.length} total</span>
            </p>
          </div>
          {canManage && (
            <Link
              href="/campaigns/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md active:scale-[0.98] dark:bg-brand-500 dark:text-white dark:hover:bg-brand-400"
            >
              <Plus className="size-4" />
              New campaign
            </Link>
          )}
        </div>

        {campaigns.length === 0 ? (
          <EmptyState canManage={canManage} />
        ) : (
          <>
            {/* Stat tiles */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile
                icon={Radio}
                label="Live now"
                live={stats.live > 0}
                value={<AnimatedNumber value={stats.live} format={formatInt} />}
                sub={stats.endingSoon ? `${stats.endingSoon} ending within 7 days` : "None ending this week"}
                tone="live"
              />
              <StatTile
                icon={Percent}
                label="Marzha bruto"
                value={stats.margin === null ? "—" : <AnimatedNumber value={stats.margin} format={formatPct} />}
                sub={
                  stats.margin === null
                    ? "No sales data for live campaigns"
                    : `${formatEurWhole(stats.profit)} fitim · ${formatEurWhole(stats.markdown)} zbritje`
                }
                tone="brand"
                meter={stats.margin === null ? undefined : stats.margin / 100}
              />
              <StatTile
                icon={CalendarClock}
                label="Upcoming"
                value={<AnimatedNumber value={stats.upcoming} format={formatInt} />}
                sub={stats.next ? `Next: ${stats.next.campaign.name} · ${stats.next.timeline.label.toLowerCase()}` : "Nothing scheduled"}
                tone="upcoming"
              />
              <StatTile
                icon={StoreIcon}
                label="Store reach"
                value={
                  <>
                    <AnimatedNumber value={stats.reach} format={formatInt} />
                    <span className="text-lg font-semibold text-neutral-400 dark:text-neutral-500">/{totalStores}</span>
                  </>
                }
                sub="Stores in a live campaign"
                tone="brand"
                meter={totalStores ? stats.reach / totalStores : 0}
              />
            </div>

            {/* Toolbar */}
            <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white/90 p-3 shadow-xs backdrop-blur-md lg:sticky lg:top-[4.75rem] lg:z-30 dark:border-neutral-800 dark:bg-neutral-900/90">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div role="tablist" aria-label="Filter by status" className="flex gap-1 overflow-x-auto rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800/70">
                  {tabs.map((t) => {
                    const active = status === t.key
                    return (
                      <button
                        key={t.key}
                        role="tab"
                        type="button"
                        aria-selected={active}
                        onClick={() => setStatus(t.key)}
                        className={cx(
                          "relative shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                          active ? "text-neutral-900 dark:text-white" : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="status-tab"
                            className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-neutral-200/80 dark:bg-neutral-900 dark:ring-neutral-700"
                            transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
                          />
                        )}
                        <span className="relative flex items-center gap-1.5">
                          {t.key !== "ALL" && <span className={cx("size-1.5 rounded-full", statusMeta(t.key).dot)} />}
                          {t.label}
                          <span className="tabular-nums text-neutral-400 dark:text-neutral-500">{t.count}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <SelectField
                    label="Sort"
                    value={sort}
                    onChange={(v) => setSort(v as SortKey)}
                    options={(Object.keys(SORT_LABELS) as SortKey[]).map((k) => ({ value: k, label: SORT_LABELS[k] }))}
                    className="flex-1 lg:flex-none"
                  />
                  <ViewToggle view={view} onChange={changeView} />
                </div>
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    ref={searchRef}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setQuery("")}
                    placeholder="Search campaigns…"
                    aria-label="Search campaigns"
                    className="h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 pr-10 pl-9 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-transparent focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:focus:bg-neutral-900"
                  />
                  <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-neutral-200 bg-white px-1.5 font-mono text-[10px] text-neutral-400 sm:block dark:border-neutral-700 dark:bg-neutral-800">
                    /
                  </kbd>
                </div>

                <div className="flex h-10 items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50/60 px-2 dark:border-neutral-700 dark:bg-neutral-800/50">
                  <Calendar className="size-4 shrink-0 text-neutral-400" />
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    aria-label="From date"
                    className="w-full min-w-0 cursor-pointer bg-transparent px-1 text-xs font-medium text-neutral-700 focus:outline-none md:w-[7.5rem] dark:text-neutral-200 dark:[color-scheme:dark]"
                  />
                  <ArrowRight className="size-3.5 shrink-0 text-neutral-400" />
                  <input
                    type="date"
                    value={to}
                    min={from || undefined}
                    onChange={(e) => setTo(e.target.value)}
                    aria-label="To date"
                    className="w-full min-w-0 cursor-pointer bg-transparent px-1 text-xs font-medium text-neutral-700 focus:outline-none md:w-[7.5rem] dark:text-neutral-200 dark:[color-scheme:dark]"
                  />
                </div>

                <div className="flex gap-2">
                  <SelectField
                    label="Store"
                    value={store}
                    onChange={setStore}
                    options={[{ value: "", label: "All stores" }, ...stores.map((s) => ({ value: s.name, label: s.name }))]}
                    className="flex-1 md:w-44 md:flex-none"
                  />
                  {channels.length > 1 && (
                    <SelectField
                      label="Channel"
                      value={channel}
                      onChange={setChannel}
                      options={[{ value: "", label: "All channels" }, ...channels.map((c) => ({ value: c, label: c }))]}
                      className="flex-1 md:w-36 md:flex-none"
                    />
                  )}
                </div>
              </div>

              <AnimatePresence initial={false}>
                {activeFilters.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        <span className="font-semibold tabular-nums text-neutral-700 dark:text-neutral-200">{shown.length}</span> of {rows.length}
                      </span>
                      {activeFilters.map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={f.clear}
                          className="group inline-flex max-w-full cursor-pointer items-center gap-1 rounded-full bg-brand-50 py-1 pr-1.5 pl-2.5 text-xs font-medium text-brand-700 ring-1 ring-brand-200 transition-colors ring-inset hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25"
                        >
                          <span className="truncate">{f.label}</span>
                          <X className="size-3 opacity-60 group-hover:opacity-100" />
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={clearAll}
                        className="cursor-pointer text-xs font-medium text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline dark:text-neutral-400 dark:hover:text-neutral-200"
                      >
                        Clear all
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Results */}
            {shown.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center dark:border-neutral-700 dark:bg-neutral-900">
                <Search className="mx-auto size-8 text-neutral-300 dark:text-neutral-600" />
                <p className="mt-3 font-semibold text-neutral-700 dark:text-neutral-200">Nuk u gjet asnjë kampanjë.</p>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Try a different search or loosen the filters.</p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-4 cursor-pointer rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  {view === "list" ? <ListView {...viewProps} /> : <GridView {...viewProps} />}
                </motion.div>
              </AnimatePresence>
            )}
          </>
        )}
      </div>
    </MotionConfig>
  )
}

// ---------- local pieces ----------

const TONES = {
  live: { icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", glow: "from-emerald-400/15" },
  brand: { icon: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400", glow: "from-brand-400/10" },
  upcoming: { icon: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400", glow: "from-sky-400/10" },
} as const

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  tone,
  live,
  meter,
}: {
  icon: LucideIcon
  label: string
  value: React.ReactNode
  sub: string
  tone: keyof typeof TONES
  live?: boolean
  meter?: number
}) {
  const t = TONES[tone]
  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div aria-hidden className={cx("pointer-events-none absolute inset-0 bg-linear-to-br to-transparent to-60%", t.glow)} />
      <div className="relative flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
        <span className={cx("relative inline-flex size-8 shrink-0 items-center justify-center rounded-lg", t.icon)}>
          <Icon className="size-4" />
          {live && (
            <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-neutral-900" />
            </span>
          )}
        </span>
      </div>
      <div className="relative mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.75rem] dark:text-neutral-50">
        {value}
      </div>
      {meter !== undefined && (
        <div className="relative mt-2 h-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <motion.div
            className="h-full rounded-full bg-brand-400"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(1, meter)) * 100}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      )}
      <p className="relative mt-1.5 truncate text-xs text-neutral-500 dark:text-neutral-400" title={sub}>
        {sub}
      </p>
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
}) {
  return (
    <div className={cx("relative", className)}>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          "h-10 w-full cursor-pointer appearance-none truncate rounded-xl border bg-neutral-50/60 pr-8 pl-3 text-sm font-medium transition-colors focus:ring-2 focus:ring-brand-500 focus:outline-none dark:bg-neutral-800/50",
          value && value !== "smart"
            ? "border-brand-200 text-brand-700 dark:border-brand-500/30 dark:text-brand-300"
            : "border-neutral-200 text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-neutral-400" />
    </div>
  )
}

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  const options: { key: ViewMode; label: string; icon: LucideIcon }[] = [
    { key: "list", label: "List view", icon: LayoutList },
    { key: "grid", label: "Grid view", icon: LayoutGrid },
  ]
  return (
    <div role="radiogroup" aria-label="Layout" className="flex h-10 shrink-0 items-center gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800/70">
      {options.map(({ key, label, icon: Icon }) => {
        const active = view === key
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => onChange(key)}
            className={cx(
              "relative flex h-full w-9 cursor-pointer items-center justify-center rounded-lg transition-colors",
              active ? "text-neutral-900 dark:text-white" : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            )}
          >
            {active && (
              <motion.span
                layoutId="view-toggle"
                className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-neutral-200/80 dark:bg-neutral-900 dark:ring-neutral-700"
                transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
              />
            )}
            <Icon className="relative size-4" />
          </button>
        )
      })}
    </div>
  )
}

function EmptyState({ canManage }: { canManage: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white px-6 py-20 text-center shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 mx-auto size-72 rounded-full bg-brand-400/10 blur-3xl" />
      <span className="relative mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:ring-brand-500/20">
        <Megaphone className="size-6" />
      </span>
      <h2 className="relative mt-5 text-lg font-semibold text-neutral-900 dark:text-neutral-100">No campaigns yet</h2>
      <p className="relative mx-auto mt-1 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
        {canManage
          ? "Create your first campaign to start tracking its timeline, stores and revenue here."
          : "Campaigns will show up here once an administrator creates them."}
      </p>
      {canManage && (
        <Link
          href="/campaigns/new"
          className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 dark:bg-brand-500 dark:text-white"
        >
          <Plus className="size-4" />
          New campaign
        </Link>
      )}
    </div>
  )
}
