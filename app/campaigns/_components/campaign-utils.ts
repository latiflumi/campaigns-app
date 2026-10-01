// app/campaigns/_components/campaign-utils.ts
// Shared types, formatting and timeline helpers for the campaigns list.
// Every formatter here is deterministic (fixed number locale, UTC, month names from the dictionary)
// so server and browser render identical text and hydration never mismatches. Text comes from `t`
// (useT() in client components, getT() on the server).

import {
  Store,
  Globe,
  MessageSquare,
  Mail,
  Tag,
  type LucideIcon,
} from "lucide-react"
import type { CampaignStatus, CampaignType } from "@prisma/client"
import type { Dict } from "@/app/lib/i18n/dictionaries"

export type ViewMode = "list" | "grid"
export const VIEW_COOKIE = "campaigns_view"

/** "smart" groups by phase (live → upcoming → past); the others are flat sorts. */
export type SortKey = "smart" | "newest" | "revenue" | "name"

/** "Thursday, 24 September" */
export function formatToday(now: number, t: Dict) {
  const d = new Date(now)
  return t.dates.today(t.dates.weekdays[d.getUTCDay()], d.getUTCDate(), t.dates.monthsLong[d.getUTCMonth()])
}

export interface CampaignListItem {
  id: string
  name: string
  type: CampaignType
  status: CampaignStatus
  subject: string | null
  participatingStores: string[]
  budget: number | null
  startDate: string | null // ISO, stored as midnight UTC
  endDate: string | null // ISO, stored as midnight UTC (inclusive last day)
  updatedAt: string
  grossRevenue: number | null // null = no stores/dates, or the ERP call failed
  netRevenue: number | null
  grossProfit: number | null
  markdownAmount: number | null
  unitsSold: number | null
}

// ---------- number formatting ----------

const eurFull = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const eurWhole = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 })
const intFmt = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 })

export const formatEur = (n: number) => `€${eurFull.format(n)}`
export const formatEurWhole = (n: number) => `€${eurWhole.format(n)}`
export const formatInt = (n: number) => intFmt.format(n)

const pctFmt = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 })
/** Takes a percentage (45.23), not a ratio. */
export const formatPct = (n: number) => `${pctFmt.format(n)}%`

// ---------- dates ----------

export const DAY = 86_400_000
const yearOf = (iso: string) => new Date(iso).getUTCFullYear()

/** "18 Aug", or "18 Aug 2025" when `withYear`. */
export function formatDay(t: Dict, iso: string, withYear = false) {
  const d = new Date(iso)
  const base = `${d.getUTCDate()} ${t.dates.months[d.getUTCMonth()]}`
  return withYear ? `${base} ${d.getUTCFullYear()}` : base
}

/** Years are shown on both ends whenever either end falls outside the current year. */
export function formatRange(c: Pick<CampaignListItem, "startDate" | "endDate">, now: number, t: Dict) {
  if (!c.startDate) return t.timeline.noDates
  const thisYear = new Date(now).getUTCFullYear()
  if (!c.endDate) return t.timeline.from(formatDay(t, c.startDate, yearOf(c.startDate) !== thisYear))
  const withYear = yearOf(c.startDate) !== thisYear || yearOf(c.endDate) !== thisYear
  return `${formatDay(t, c.startDate, withYear)} → ${formatDay(t, c.endDate, withYear)}`
}

/** Midnight UTC of the calendar day containing `ms`. */
const utcDay = (ms: number) => Math.floor(ms / DAY) * DAY

export type Phase = "undated" | "upcoming" | "live" | "open" | "ended"

export interface Timeline {
  phase: Phase
  /** 0..1 share of the campaign that has elapsed (live only). */
  progress: number
  totalDays: number
  /** Whole days until start (upcoming), remaining incl. today (live) or since end (ended). */
  days: number
  label: string
}

export function getTimeline(c: Pick<CampaignListItem, "startDate" | "endDate">, now: number, t: Dict): Timeline {
  if (!c.startDate) {
    return { phase: "undated", progress: 0, totalDays: 0, days: 0, label: t.timeline.noDates }
  }

  const start = Date.parse(c.startDate)
  const today = utcDay(now)

  if (today < start) {
    const days = Math.round((start - today) / DAY)
    const totalDays = c.endDate ? Math.round((Date.parse(c.endDate) - start) / DAY) + 1 : 0
    return {
      phase: "upcoming",
      progress: 0,
      totalDays,
      days,
      label: days === 1 ? t.timeline.startsTomorrow : t.timeline.startsIn(days),
    }
  }

  if (!c.endDate) {
    const days = Math.round((today - start) / DAY) + 1
    return { phase: "open", progress: 0, totalDays: 0, days, label: t.timeline.openDay(days) }
  }

  const endExclusive = Date.parse(c.endDate) + DAY
  const totalDays = Math.round((endExclusive - start) / DAY)

  if (now >= endExclusive) {
    const days = Math.round((today - endExclusive) / DAY) + 1
    return {
      phase: "ended",
      progress: 1,
      totalDays,
      days,
      label: days === 1 ? t.timeline.endedYesterday : t.timeline.endedAgo(days),
    }
  }

  const days = Math.round((endExclusive - today) / DAY)
  return {
    phase: "live",
    progress: Math.min(1, Math.max(0, (now - start) / (endExclusive - start))),
    totalDays,
    days,
    label: days === 1 ? t.timeline.lastDay : t.timeline.daysLeft(days),
  }
}

/** Text colour for a timeline label: orange when a live campaign ends within 3 days. */
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

// ---------- visual metadata ----------

export interface ChannelMeta {
  label: string
  icon: LucideIcon
  tile: string // icon tile background + text
  accent: string // left accent bar
}

export function channelMeta(type: string, t: Dict): ChannelMeta {
  const label = t.channel[type] ?? type
  switch (type) {
    case "STORE":
      return {
        label,
        icon: Store,
        tile: "bg-brand-50 text-brand-700 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/20",
        accent: "bg-brand-500",
      }
    case "ECOMMERCE":
      return {
        label,
        icon: Globe,
        tile: "bg-sky-50 text-sky-600 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20",
        accent: "bg-sky-500",
      }
    case "SMS":
      return {
        label,
        icon: MessageSquare,
        tile: "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
        accent: "bg-amber-500",
      }
    case "EMAIL":
      return {
        label,
        icon: Mail,
        tile: "bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20",
        accent: "bg-violet-500",
      }
    default:
      return {
        label,
        icon: Tag,
        tile: "bg-neutral-100 text-neutral-600 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700",
        accent: "bg-neutral-400",
      }
  }
}

export interface StatusMeta {
  label: string
  pill: string
  dot: string
  pulse: boolean
}

export const STATUS_ORDER: CampaignStatus[] = ["ACTIVE", "SCHEDULED", "DRAFT", "PAUSED", "COMPLETED"]

export function statusMeta(status: string, t: Dict): StatusMeta {
  const label = t.status[status] ?? status
  switch (status) {
    case "ACTIVE":
      return {
        label,
        pill: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25",
        dot: "bg-emerald-500",
        pulse: true,
      }
    case "SCHEDULED":
      return {
        label,
        pill: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/25",
        dot: "bg-sky-500",
        pulse: false,
      }
    case "DRAFT":
      return {
        label,
        pill: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25",
        dot: "bg-amber-500",
        pulse: false,
      }
    case "PAUSED":
      return {
        label,
        pill: "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25",
        dot: "bg-brand-500",
        pulse: false,
      }
    case "COMPLETED":
      return {
        label,
        pill: "bg-neutral-100 text-neutral-600 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700",
        dot: "bg-neutral-400",
        pulse: false,
      }
    default:
      return {
        label,
        pill: "bg-neutral-100 text-neutral-600 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700",
        dot: "bg-neutral-400",
        pulse: false,
      }
  }
}
