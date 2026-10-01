// app/page.tsx: home. A short summary of today (sales, live campaigns, what needs attention), then the
// way into the two modules. ERP figures load on their own (Suspense), so the page shows immediately.
import { Suspense } from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, BarChart3, Boxes, Gauge, Megaphone, Plus } from "lucide-react"
import { prisma } from "./lib/prisma"
import { requireSession } from "./lib/session"
import { canManageCampaigns } from "./lib/roles"
import { syncCampaignStatuses } from "./lib/campaign-status"
import { getT } from "./lib/i18n/server"
import type { Dict } from "./lib/i18n/dictionaries"
import { getBiStockAlerts, getBiSummary, settle } from "./lib/bi/erp"
import { comparisonRange, presetRange } from "./lib/bi/filters"
import { formatEurWhole, formatPct, formatToday, getTimeline, timelineTone } from "./campaigns/_components/campaign-utils"
import { StatusPill, TimelineBar } from "./campaigns/_components/parts"
import { Card, CardHeader, Delta, ErrorCard, KpiTile, SkeletonCard, cx, growth } from "./bi/_components/ui"
import { Exceptions } from "./bi/_components/sections"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t.home.pulse }
}

/** "Good morning" etc. by the clock in Kosovo, whatever the server's time zone. */
function greeting(t: Dict, name: string, now: Date) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Belgrade" }).format(now))
  return hour < 12 ? t.home.greeting.morning(name) : hour < 18 ? t.home.greeting.afternoon(name) : t.home.greeting.evening(name)
}

/** Summary for a period against the same calendar dates last year (all stores). */
function summaryFor(range: { from: string; to: string }) {
  const cmp = comparisonRange(range.from, range.to, "ly")
  return settle(getBiSummary({ from: range.from, to: range.to, compare: "ly", cmpFrom: cmp.from, cmpTo: cmp.to, stores: "" }))
}

/**
 * The month figures use complete days only, so a few hours of today never sit against a full day last
 * year: the 1st up to yesterday, or last month when today is the 1st.
 */
function monthRange(t: Dict) {
  const yesterday = presetRange("yesterday")
  const lastMonth = presetRange("lm")
  const firstOfMonth = new Date().getUTCDate() === 1
  const range = firstOfMonth ? lastMonth : { from: presetRange("mtd").from, to: yesterday.to }
  return {
    range,
    label: firstOfMonth ? t.bi.presets.lm : t.home.month,
    period: firstOfMonth ? t.home.periodLastMonth : t.home.periodMonth,
    foot: firstOfMonth ? t.home.vsLy : t.home.monthFoot,
    query: firstOfMonth ? "period=lm&compare=ly" : `period=custom&from=${range.from}&to=${range.to}&compare=ly`,
  }
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export default async function HomePage() {
  const session = await requireSession()
  const t = await getT()
  const now = new Date()
  await syncCampaignStatuses(now)

  const [me, campaigns, canManage] = await Promise.all([
    prisma.user.findUnique({ where: { userId: session.userId }, select: { fullName: true } }),
    prisma.campaign.findMany({
      where: { status: { in: ["ACTIVE", "SCHEDULED"] } },
      select: { id: true, name: true, status: true, startDate: true, endDate: true, participatingStores: true },
    }),
    canManageCampaigns(),
  ])
  const firstName = capitalise(me?.fullName?.trim().split(/\s+/)[0] || session.userName)

  // Campaign timelines, same rules as the campaigns page
  const rows = campaigns.map((c) => {
    const dates = { startDate: c.startDate?.toISOString() ?? null, endDate: c.endDate?.toISOString() ?? null }
    return { ...c, ...dates, timeline: getTimeline(dates, now.getTime(), t) }
  })
  const live = rows.filter((r) => r.timeline.phase === "live" || r.timeline.phase === "open").sort((a, b) => a.timeline.days - b.timeline.days)
  const upcoming = rows.filter((r) => r.timeline.phase === "upcoming").sort((a, b) => a.timeline.days - b.timeline.days)

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-neutral-500 dark:text-neutral-400">{formatToday(now.getTime(), t)}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-balance text-neutral-900 dark:text-neutral-100">{greeting(t, firstName, now)}</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t.home.subtitle}</p>
        </div>
        {canManage && (
          <Link
            href="/campaigns/new"
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 sm:self-auto dark:bg-brand-500 dark:hover:bg-brand-400"
          >
            <Plus className="size-4" />
            {t.campaigns.newCampaign}
          </Link>
        )}
      </div>

      {/* Today's pulse */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t.home.pulse}</h2>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{t.home.pulseSub}</span>
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} height="h-28" />)}
            </div>
          }
        >
          <Pulse t={t} />
        </Suspense>
      </section>

      {/* Campaigns + what needs attention */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Card>
            <CardHeader
              icon={Megaphone}
              title={t.home.live}
              sub={t.home.liveSub(live.length, upcoming.length)}
              aside={
                <Link href="/campaigns" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-600 dark:text-brand-400">
                  {t.home.allCampaigns}
                  <ArrowRight className="size-3.5" />
                </Link>
              }
            />
            {live.length === 0 ? (
              <p className="px-5 py-8 text-sm text-neutral-500 dark:text-neutral-400">{t.home.noneLive}</p>
            ) : (
              <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {live.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <Link href={`/campaigns/${c.id}`} className="grid gap-2 px-5 py-3.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                      <span className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">{c.name}</span>
                        <StatusPill status={c.status} />
                      </span>
                      <TimelineBar timeline={c.timeline} />
                      <span className="flex items-center justify-between gap-3 text-xs">
                        <span className="truncate text-neutral-500 dark:text-neutral-400">{t.campaigns.nStores(c.participatingStores.length)}</span>
                        <span className={cx("shrink-0 font-semibold", timelineTone(c.timeline))}>{c.timeline.label}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {upcoming[0] && (
              <Link
                href={`/campaigns/${upcoming[0].id}`}
                className="block border-t border-neutral-100 px-5 py-3 text-xs text-neutral-500 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/40"
              >
                {t.home.nextUp(upcoming[0].name, upcoming[0].timeline.label.toLowerCase())}
              </Link>
            )}
          </Card>
        </div>

        <div className="grid min-w-0 gap-6">
          <Suspense fallback={<SkeletonCard height="h-64" />}>
            <Attention t={t} />
          </Suspense>
          <Suspense fallback={<SkeletonCard height="h-40" />}>
            <StockPulse t={t} />
          </Suspense>
        </div>
      </div>

      {/* Into the modules */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t.home.jump}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ModuleCard
            href="/campaigns"
            icon={Megaphone}
            title={t.nav.campaigns}
            body={t.home.campaignsBody}
            stat={t.home.campaignsStat(live.length, upcoming.length)}
            open={t.home.open}
          />
          <Suspense
            fallback={<ModuleCard href="/bi" icon={BarChart3} title={t.home.biTitle} body={t.home.biBody} stat="…" open={t.home.open} />}
          >
            <BiModuleCard t={t} />
          </Suspense>
        </div>
      </section>
    </div>
  )
}

// ---------- ERP-backed pieces (each loads on its own) ----------

type SummaryResult = Awaited<ReturnType<typeof summaryFor>>

async function Pulse({ t }: { t: Dict }) {
  const m = monthRange(t)
  const [today, yesterday, month] = await Promise.all([summaryFor(presetRange("today")), summaryFor(presetRange("yesterday")), summaryFor(m.range)])
  if (!month.data) return <ErrorCard message={month.error} />
  const k = t.bi.kpi
  const ly = (r: SummaryResult) => r.data?.totals.previous
  const cur = (r: SummaryResult) => r.data?.totals.current
  const tile = "block rounded-2xl transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand-500"

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Link href="/bi?period=today" className={tile}>
        <KpiTile
          label={t.home.today}
          value={cur(today) ? formatEurWhole(cur(today)!.sales) : "—"}
          delta={null}
          foot={ly(today) ? t.home.todayFoot(formatEurWhole(ly(today)!.sales)) : ""}
        />
      </Link>
      <Link href="/bi?period=yesterday" className={tile}>
        <KpiTile
          label={t.home.yesterday}
          value={cur(yesterday) ? formatEurWhole(cur(yesterday)!.sales) : "—"}
          delta={<Delta value={cur(yesterday) && ly(yesterday) ? growth(cur(yesterday)!.sales, ly(yesterday)!.sales) : null} kind="pct" na={k.na} />}
          foot={t.home.vsLy}
        />
      </Link>
      <Link href={`/bi?${m.query}`} className={tile}>
        <KpiTile
          label={m.label}
          value={formatEurWhole(month.data.totals.current.sales)}
          delta={<Delta value={growth(month.data.lfl.current.sales, month.data.lfl.previous.sales)} kind="pct" na={k.na} />}
          foot={m.foot}
          badge="LFL"
          badgeTitle={k.lflTitle}
        />
      </Link>
      <Link href={`/bi?${m.query}`} className={tile}>
        <KpiTile
          label={t.home.margin}
          value={month.data.totals.current.marginPct === null ? "—" : formatPct(month.data.totals.current.marginPct)}
          delta={
            <Delta
              value={
                month.data.totals.current.marginPct !== null && month.data.totals.previous.marginPct !== null
                  ? month.data.totals.current.marginPct - month.data.totals.previous.marginPct
                  : null
              }
              kind="pp"
              na={k.na}
            />
          }
          foot={t.home.marginFoot(m.period, formatEurWhole(month.data.totals.current.grossProfit))}
        />
      </Link>
    </div>
  )
}

async function Attention({ t }: { t: Dict }) {
  const m = monthRange(t)
  const month = await summaryFor(m.range)
  if (!month.data) return <ErrorCard message={month.error} />
  return (
    <Exceptions
      stores={month.data.stores}
      totals={month.data.totals.current}
      compareText={t.bi.compareText.ly}
      query={m.query}
    />
  )
}

async function StockPulse({ t }: { t: Dict }) {
  const res = await settle(getBiStockAlerts(undefined, 50))
  if (!res.data) return <ErrorCard message={res.error} />
  const counts = { out: 0, low: 0, slow: 0 }
  for (const a of res.data.alerts) counts[a.kind]++
  // erp-api returns at most 50 of each kind
  const shown = (n: number) => (n >= 50 ? "50+" : String(n))
  const tones = {
    out: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
    low: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    slow: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  } as const

  return (
    <Card>
      <CardHeader icon={Boxes} title={t.home.stock} sub={t.home.stockSub(res.data.window.days)} />
      <div className="grid grid-cols-3 gap-2 px-5 py-4">
        {(["out", "low", "slow"] as const).map((kind) => (
          <div key={kind} className={cx("rounded-xl px-3 py-2.5", tones[kind])}>
            <div className="text-xl font-bold tabular-nums">{shown(counts[kind])}</div>
            <div className="text-[11px] leading-tight font-medium">{t.home.stockKinds[kind]}</div>
          </div>
        ))}
      </div>
      <Link
        href="/bi?period=mtd"
        className="flex items-center justify-between border-t border-neutral-100 px-5 py-3 text-xs font-semibold text-brand-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-brand-400 dark:hover:bg-neutral-800/40"
      >
        {t.home.stockOpen}
        <ArrowRight className="size-3.5" />
      </Link>
    </Card>
  )
}

async function BiModuleCard({ t }: { t: Dict }) {
  const m = monthRange(t)
  const month = await summaryFor(m.range)
  const stat = month.data ? t.home.biStat(formatEurWhole(month.data.totals.current.sales), m.period) : ""
  return <ModuleCard href="/bi" icon={Gauge} title={t.home.biTitle} body={t.home.biBody} stat={stat} open={t.home.open} />
}

// ---------- module entry card ----------

function ModuleCard({
  href,
  icon: Icon,
  title,
  body,
  stat,
  open,
}: {
  href: string
  icon: typeof Megaphone
  title: string
  body: string
  stat: string
  open: string
}) {
  return (
    <Link
      href={href}
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs transition-[box-shadow,border-color] hover:border-brand-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand-500 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-brand-500/40"
    >
      <span aria-hidden className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-brand-400/10 blur-2xl transition-opacity group-hover:opacity-100 dark:bg-brand-400/10" />
      <span className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:ring-brand-500/20">
        <Icon className="size-5" />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</span>
        <span className="block text-sm text-neutral-500 dark:text-neutral-400">{body}</span>
        {stat && <span className="mt-1 block text-xs font-medium text-neutral-700 tabular-nums dark:text-neutral-300">{stat}</span>}
      </span>
      <span className="relative inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 transition-transform group-hover:translate-x-0.5 dark:text-brand-400">
        <span className="hidden sm:inline">{open}</span>
        <ArrowRight className="size-4" />
      </span>
    </Link>
  )
}
