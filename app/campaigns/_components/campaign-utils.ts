// app/campaigns/_components/campaign-utils.ts
// Shared types, formatting and timeline helpers for the campaigns list.
// Every formatter here is deterministic (fixed locale, UTC, no Intl month names)
// so server and browser render identical text and hydration never mismatches.

import {
  Store,
  Globe,
  MessageSquare,
  Mail,
  Tag,
  type LucideIcon,
} from "lucide-react"
import type { CampaignStatus, CampaignType } from "@prisma/client"

export type ViewMode = "list" | "grid"
export const VIEW_COOKIE = "campaigns_view"

/** "smart" groups by phase (live → upcoming → past); the others are flat sorts. */
export type SortKey = "smart" | "newest" | "revenue" | "name"

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

/** "Thursday, 24 September" */
export function formatToday(now: number) {
  const d = new Date(now)
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS_LONG[d.getUTCMonth()]}`
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
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const yearOf = (iso: string) => new Date(iso).getUTCFullYear()

/** "18 Aug", or "18 Aug 2025" when `withYear`. */
export function formatDay(iso: string, withYear = false) {
  const d = new Date(iso)
  const base = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
  return withYear ? `${base} ${d.getUTCFullYear()}` : base
}

/** Years are shown on both ends whenever either end falls outside the current year. */
export function formatRange(c: Pick<CampaignListItem, "startDate" | "endDate">, now: number) {
  if (!c.startDate) return "No dates set"
  const thisYear = new Date(now).getUTCFullYear()
  if (!c.endDate) return `From ${formatDay(c.startDate, yearOf(c.startDate) !== thisYear)}`
  const withYear = yearOf(c.startDate) !== thisYear || yearOf(c.endDate) !== thisYear
  return `${formatDay(c.startDate, withYear)} → ${formatDay(c.endDate, withYear)}`
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

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

export function getTimeline(c: Pick<CampaignListItem, "startDate" | "endDate">, now: number): Timeline {
  if (!c.startDate) {
    return { phase: "undated", progress: 0, totalDays: 0, days: 0, label: "No dates set" }
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
      label: days === 1 ? "Starts tomorrow" : `Starts in ${plural(days, "day")}`,
    }
  }

  if (!c.endDate) {
    const days = Math.round((today - start) / DAY) + 1
    return { phase: "open", progress: 0, totalDays: 0, days, label: `Open-ended · day ${days}` }
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
      label: days === 1 ? "Ended yesterday" : `Ended ${plural(days, "day")} ago`,
    }
  }

  const days = Math.round((endExclusive - today) / DAY)
  return {
    phase: "live",
    progress: Math.min(1, Math.max(0, (now - start) / (endExclusive - start))),
    totalDays,
    days,
    label: days === 1 ? "Last day" : `${plural(days, "day")} left`,
  }
}

// ---------- visual metadata ----------

export interface ChannelMeta {
  label: string
  icon: LucideIcon
  tile: string // icon tile background + text
  accent: string // left accent bar
}

export function channelMeta(type: string): ChannelMeta {
  switch (type) {
    case "STORE":
      return {
        label: "Store",
        icon: Store,
        tile: "bg-brand-50 text-brand-700 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/20",
        accent: "bg-brand-500",
      }
    case "ECOMMERCE":
      return {
        label: "E-commerce",
        icon: Globe,
        tile: "bg-sky-50 text-sky-600 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20",
        accent: "bg-sky-500",
      }
    case "SMS":
      return {
        label: "SMS",
        icon: MessageSquare,
        tile: "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
        accent: "bg-amber-500",
      }
    case "EMAIL":
      return {
        label: "Email",
        icon: Mail,
        tile: "bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20",
        accent: "bg-violet-500",
      }
    default:
      return {
        label: type,
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

export function statusMeta(status: string): StatusMeta {
  switch (status) {
    case "ACTIVE":
      return {
        label: "Active",
        pill: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25",
        dot: "bg-emerald-500",
        pulse: true,
      }
    case "SCHEDULED":
      return {
        label: "Scheduled",
        pill: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/25",
        dot: "bg-sky-500",
        pulse: false,
      }
    case "DRAFT":
      return {
        label: "Draft",
        pill: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25",
        dot: "bg-amber-500",
        pulse: false,
      }
    case "PAUSED":
      return {
        label: "Paused",
        pill: "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25",
        dot: "bg-brand-500",
        pulse: false,
      }
    case "COMPLETED":
      return {
        label: "Completed",
        pill: "bg-neutral-100 text-neutral-600 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700",
        dot: "bg-neutral-400",
        pulse: false,
      }
    default:
      return {
        label: status,
        pill: "bg-neutral-100 text-neutral-600 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700",
        dot: "bg-neutral-400",
        pulse: false,
      }
  }
}
