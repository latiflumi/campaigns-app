// app/lib/alerts/engine.ts
// One round of alert checks: load everyone's active rules, fetch the data they need from erp-api ONCE
// per data need (not per rule or per user), evaluate the rules in memory, and write notifications.
// Already-reported things are remembered in alert_states, so nothing is sent twice.
// Runs from the scheduler (app/lib/alerts/scheduler.ts) and from "Run checks now" (admins).
import { Prisma } from "@prisma/client"
import { prisma } from "../prisma"
import { brandKey, brandOf } from "../bi/brands"
import { comparisonRange } from "../bi/filters"
import type { BiStockAlerts, BiSummary } from "../bi/types"
import type {
  CampaignData,
  CampaignParams,
  ManyData,
  NotificationKind,
  OutOfStockData,
  OutOfStockParams,
  SalesDropData,
  SalesDropParams,
  StoreScope,
} from "./types"

/** At most this many separate notifications per rule per round; the rest become one "N more". */
const MAX_PER_RULE = 5
/** Ignore tiny comparison bases (a store that sold €80 last year on that day) */
const MIN_PREVIOUS_SALES = 150
/** Checks run between these local (Kosovo) hours; sales checks only after SALES_FROM. */
const DAY_START_HOUR = 7
const DAY_END_HOUR = 22
const SALES_FROM = { hour: 7, minute: 30 }
const TZ = "Europe/Belgrade"
const DAY = 86_400_000

// ---------- erp-api (own small client: this also runs outside a request) ----------

async function erp<T>(path: string, query: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`http://${process.env.API_URL}${path}`)
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== "") url.searchParams.set(k, String(v))
  const res = await fetch(url, {
    headers: { "x-api-key": process.env.INTERNAL_API_KEY ?? "" },
    cache: "no-store",
    signal: AbortSignal.timeout(120_000),
  })
  if (!res.ok) throw new Error(`erp-api ${path} responded ${res.status}`)
  return res.json() as Promise<T>
}

// ---------- local (Kosovo) dates ----------

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

function localNow(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0"
  const today = `${get("year")}-${get("month")}-${get("day")}`
  return { today, hour: Number(get("hour")), minute: Number(get("minute")) }
}

const addDays = (day: string, n: number) => isoDay(Date.parse(`${day}T00:00:00Z`) + n * DAY)

// ---------- helpers ----------

function inScope(scope: StoreScope, orgId: number, storeName: string) {
  if (scope.kind === "all") return true
  if (scope.kind === "store") return scope.orgId === orgId
  return brandKey(brandOf(storeName)) === scope.chain
}

interface Pending {
  userId: string
  ruleId: string
  kind: NotificationKind
  data: object
}

export interface RoundResult {
  skipped?: string
  rules: number
  notifications: number
  errors: string[]
  ms: number
}

// One round at a time per server process
const g = globalThis as unknown as { __alertsRunning?: boolean }

/**
 * Runs one round. `force` ignores the time-of-day window (used by "Run checks now").
 */
export async function runAlertRound({ now = new Date(), force = false }: { now?: Date; force?: boolean } = {}): Promise<RoundResult> {
  const started = Date.now()
  if (g.__alertsRunning) return { skipped: "previous round still running", rules: 0, notifications: 0, errors: [], ms: 0 }
  const local = localNow(now)
  if (!force && (local.hour < DAY_START_HOUR || local.hour >= DAY_END_HOUR)) {
    return { skipped: "outside 07:00–22:00", rules: 0, notifications: 0, errors: [], ms: 0 }
  }

  g.__alertsRunning = true
  const errors: string[] = []
  const pending: Pending[] = []
  try {
    const rules = await prisma.alertRule.findMany({
      where: { active: true },
      include: { states: { select: { subjectKey: true } } },
    })
    if (rules.length === 0) return { rules: 0, notifications: 0, errors, ms: Date.now() - started }

    const byType = (type: string) => rules.filter((r) => r.type === type)
    const salesRules = byType("SALES_DROP")
    const stockRules = byType("OUT_OF_STOCK")
    const campaignRules = byType("CAMPAIGN")

    /** Records what fired (states) and queues the notifications, capped per rule. */
    const fire = async (
      rule: (typeof rules)[number],
      hits: { key: string; kind: NotificationKind; data: object }[],
      many: { kind: NotificationKind; data: Omit<ManyData, "count"> },
    ) => {
      const known = new Set(rule.states.map((s) => s.subjectKey))
      const fresh = hits.filter((h) => !known.has(h.key))
      if (fresh.length === 0) return
      await prisma.alertState.createMany({ data: fresh.map((h) => ({ ruleId: rule.id, subjectKey: h.key })), skipDuplicates: true })
      for (const h of fresh.slice(0, MAX_PER_RULE)) pending.push({ userId: rule.userId, ruleId: rule.id, kind: h.kind, data: h.data })
      if (fresh.length > MAX_PER_RULE) {
        pending.push({ userId: rule.userId, ruleId: rule.id, kind: many.kind, data: { ...many.data, count: fresh.length - MAX_PER_RULE } })
      }
    }

    // ---------- SALES_DROP: one summary per period, all stores ----------
    const salesTime = force || local.hour > SALES_FROM.hour || (local.hour === SALES_FROM.hour && local.minute >= SALES_FROM.minute)
    if (salesRules.length > 0 && salesTime) {
      const yesterday = addDays(local.today, -1)
      const ranges: Record<SalesDropParams["period"], { from: string; to: string } | null> = {
        yesterday: { from: yesterday, to: yesterday },
        // Month to date in complete days; on the 1st there is nothing yet
        mtd: local.today.endsWith("-01") ? null : { from: `${local.today.slice(0, 8)}01`, to: yesterday },
      }
      const periods = new Set(salesRules.map((r) => (r.params as unknown as SalesDropParams).period))
      const summaries = new Map<string, BiSummary>()
      for (const period of periods) {
        const range = ranges[period as SalesDropParams["period"]]
        if (!range) continue
        const cmp = comparisonRange(range.from, range.to, "ly")
        try {
          summaries.set(period, await erp<BiSummary>("/bi/summary", { from: range.from, to: range.to, compare: "ly", cmpFrom: cmp.from, cmpTo: cmp.to }))
        } catch (e) {
          errors.push(`sales ${period}: ${e instanceof Error ? e.message : e}`)
        }
      }
      for (const rule of salesRules) {
        const p = rule.params as unknown as SalesDropParams
        const summary = summaries.get(p.period)
        const range = ranges[p.period]
        if (!summary || !range) continue
        const hits = summary.stores
          .filter((s) => s.lfl && inScope(p.scope, s.orgId, s.name) && s.previous.sales >= MIN_PREVIOUS_SALES)
          .map((s) => ({ s, growth: s.current.sales / s.previous.sales - 1 }))
          .filter(({ growth }) => growth <= -p.threshold / 100)
          .sort((a, b) => a.growth - b.growth)
          .map(({ s, growth }) => ({
            key: `${s.orgId}:${p.period}:${range.to}`,
            kind: "sales_drop" as const,
            data: { orgId: s.orgId, storeName: s.name, period: p.period, from: range.from, to: range.to, growth, sales: s.current.sales, previous: s.previous.sales } satisfies SalesDropData,
          }))
        await fire(rule, hits, {
          kind: "sales_drop_many",
          data: { period: p.period, href: p.period === "yesterday" ? "/bi?period=yesterday&compare=ly" : "/bi?period=mtd&compare=ly" },
        })
      }
    }

    // ---------- OUT_OF_STOCK: one stock-alerts call per (brand, NOOS) combination, all stores ----------
    if (stockRules.length > 0) {
      const needKey = (p: OutOfStockParams) => `${p.brand ?? ""}|${p.noosOnly ? "noos" : ""}`
      const needs = new Map<string, OutOfStockParams>()
      for (const r of stockRules) needs.set(needKey(r.params as unknown as OutOfStockParams), r.params as unknown as OutOfStockParams)
      const results = new Map<string, BiStockAlerts>()
      for (const [key, p] of needs) {
        try {
          results.set(key, await erp<BiStockAlerts>("/bi/stock-alerts", { limit: 100, brand: p.brand ?? undefined, season: p.noosOnly ? "noos" : undefined }))
        } catch (e) {
          errors.push(`stock ${key}: ${e instanceof Error ? e.message : e}`)
        }
      }
      for (const rule of stockRules) {
        const p = rule.params as unknown as OutOfStockParams
        const res = results.get(needKey(p))
        if (!res) continue // fetch failed: keep the rule's memory as it is
        const outs = res.alerts.filter((a) => a.kind === "out" && inScope(p.scope, a.orgId, a.storeName))
        const keys = new Set(outs.map((a) => `${a.orgId}:${a.articleId}`))
        // Back in stock (no longer listed): forget it, so it can be reported again if it runs out again
        const resolved = rule.states.map((s) => s.subjectKey).filter((k) => !keys.has(k))
        if (resolved.length > 0) await prisma.alertState.deleteMany({ where: { ruleId: rule.id, subjectKey: { in: resolved } } })
        rule.states = rule.states.filter((s) => keys.has(s.subjectKey))
        const hits = outs.map((a) => {
          const src = a.transferFrom.find((s) => (s.send ?? s.spare) > 0)
          return {
            key: `${a.orgId}:${a.articleId}`,
            kind: "out_of_stock" as const,
            data: {
              orgId: a.orgId,
              storeName: a.storeName,
              articleId: a.articleId,
              productName: a.productName,
              styleNumber: a.styleNumber,
              colorCode: a.colorCode ?? null,
              size: a.size,
              color: a.color,
              unitsSold: a.unitsSold,
              days: res.window.days,
              sendFrom: src ? { name: src.storeName, units: src.send ?? src.spare, isWarehouse: src.isWarehouse } : null,
            } satisfies OutOfStockData,
          }
        })
        await fire(rule, hits, { kind: "out_of_stock_many", data: { href: "/bi?period=30d" } })
      }
    }

    // ---------- CAMPAIGN: from our own database, no erp-api call ----------
    if (campaignRules.length > 0) {
      const tomorrow = addDays(local.today, 1)
      const campaigns = await prisma.campaign.findMany({
        where: { status: { in: ["SCHEDULED", "ACTIVE"] } },
        select: { id: true, name: true, startDate: true, endDate: true, participatingStores: true },
      })
      const starting = campaigns.filter((c) => c.startDate && isoDay(c.startDate.getTime()) === tomorrow)
      const ending = campaigns.filter((c) => c.endDate && isoDay(c.endDate.getTime()) === tomorrow)
      for (const rule of campaignRules) {
        const p = rule.params as unknown as CampaignParams
        const hits = [
          ...(p.starts ? starting : []).map((c) => ({ c, kind: "campaign_starts" as const })),
          ...(p.ends ? ending : []).map((c) => ({ c, kind: "campaign_ends" as const })),
        ].map(({ c, kind }) => ({
          key: `${c.id}:${kind}:${tomorrow}`,
          kind,
          data: { campaignId: c.id, name: c.name, date: tomorrow, stores: c.participatingStores.length } satisfies CampaignData,
        }))
        await fire(rule, hits, { kind: "campaign_many", data: { href: "/campaigns" } })
      }
    }

    if (pending.length > 0) {
      await prisma.notification.createMany({
        data: pending.map((p) => ({ userId: p.userId, ruleId: p.ruleId, kind: p.kind, data: p.data as Prisma.InputJsonValue })),
      })
    }

    // Housekeeping: old memory and old read notifications
    const cutoff = new Date(now.getTime() - 60 * DAY)
    await prisma.alertState.deleteMany({ where: { lastFiredAt: { lt: cutoff } } })
    await prisma.notification.deleteMany({ where: { readAt: { lt: cutoff } } })

    return { rules: rules.length, notifications: pending.length, errors, ms: Date.now() - started }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e))
    return { rules: 0, notifications: pending.length, errors, ms: Date.now() - started }
  } finally {
    g.__alertsRunning = false
  }
}

