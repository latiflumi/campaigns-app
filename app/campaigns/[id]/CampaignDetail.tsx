"use client"

// app/campaigns/[id]/CampaignDetail.tsx

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MotionConfig, motion } from "motion/react"
import { toast } from "sonner"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Coins,
  PackageCheck,
  Percent,
  Receipt,
  Store as StoreIcon,
  CalendarRange,
  CalendarX2,
  Hourglass,
  CloudOff,
  FileText,
  Mail,
  Copy,
  Check,
  ChevronDown,
  Info,
  type LucideIcon,
} from "lucide-react"
import type { CampaignStatus, CampaignType } from "@prisma/client"
import type { CampaignDetailedAnalytics } from "@/app/api/erp/actions"
import { deleteCampaign } from "../actions"
import {
  channelMeta,
  formatDay,
  formatEur,
  formatInt,
  formatPct,
  formatRange,
  getTimeline,
  type Timeline,
} from "../_components/campaign-utils"
import { cx, ChannelTile, StatusPill, TimelineBar, timelineTone } from "../_components/parts"
import { StoreLeaderboard, ProductLeaderboard, CategoryBars, Panel } from "./_components/Leaderboards"

export interface CampaignDetailData {
  id: string
  name: string
  type: CampaignType
  status: CampaignStatus
  subject: string | null
  content: string | null
  participatingStores: string[]
  budget: number | null
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}

/** Why there are no analytics to show. */
export type AnalyticsGap = "no-stores" | "no-dates" | "upcoming" | "unavailable"

interface CampaignDetailProps {
  campaign: CampaignDetailData
  analytics: CampaignDetailedAnalytics | null
  gap: AnalyticsGap | null
  silentStores: string[]
  totalStores: number
  /** Server render time (ISO); keeps time-based UI identical during hydration. */
  now: string
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

/** Days of the campaign that have run so far (for per-day averages). */
function elapsedDays(t: Timeline) {
  switch (t.phase) {
    case "live":
      return t.totalDays - t.days + 1
    case "ended":
      return t.totalDays
    case "open":
      return t.days
    default:
      return 0
  }
}

export default function CampaignDetail({ campaign, analytics, gap, silentStores, totalStores, now: serverNow }: CampaignDetailProps) {
  const now = useNow(serverNow)
  const router = useRouter()
  const timeline = getTimeline(campaign, now)
  const totals = analytics?.totals
  const ranDays = elapsedDays(timeline)

  const handleDelete = () => {
    toast(`Fshi “${campaign.name}”?`, {
      description: "Kampanja do të fshihet përgjithmonë.",
      duration: Infinity,
      action: {
        label: "Fshi",
        onClick: () => {
          const request = deleteCampaign(campaign.id).then((res) => {
            if (!res.success) throw new Error(res.error ?? "Fshirja dështoi.")
            router.push("/campaigns")
          })
          toast.promise(request, {
            loading: "Duke fshirë kampanjën…",
            success: "Kampanja u fshi.",
            error: (err: Error) => err.message,
          })
        },
      },
      cancel: { label: "Anulo", onClick: () => {} },
    })
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <ArrowLeft className="size-4" />
            Kthehu te kampanjat
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <ChannelTile type={campaign.type} size="lg" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-100">{campaign.name}</h1>
                  <StatusPill status={campaign.status} />
                </div>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-neutral-500 dark:text-neutral-400">
                  <span>{channelMeta(campaign.type).label}</span>
                  <span aria-hidden>·</span>
                  <span>{formatRange(campaign, now)}</span>
                  <span aria-hidden>·</span>
                  <span>
                    {campaign.participatingStores.length} {campaign.participatingStores.length === 1 ? "dyqan" : "dyqane"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/campaigns/${campaign.id}/edit`}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-xs transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
              >
                <Pencil className="size-4" />
                Ndrysho
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-xs transition-colors hover:bg-red-50 dark:border-red-500/30 dark:bg-neutral-900 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <Trash2 className="size-4" />
                Fshi
              </button>
            </div>
          </div>
        </div>

        {/* Hero: headline revenue + where the campaign is in its run */}
        <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
          <div
            aria-hidden
            className={cx(
              "pointer-events-none absolute -top-24 -left-24 size-72 rounded-full blur-3xl",
              timeline.phase === "live" || timeline.phase === "open" ? "bg-emerald-400/15" : "bg-brand-400/10"
            )}
          />
          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
            <div className="min-w-0">
              {totals ? (
                <>
                  <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Qarkullimi bruto</div>
                  <div className="mt-2 text-4xl font-bold tracking-tight break-words text-neutral-900 sm:text-5xl dark:text-white">{formatEur(totals.grossRevenue)}</div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
                    <span>
                      Neto <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{formatEur(totals.netRevenue)}</strong>
                    </span>
                    {ranDays > 0 && (
                      <span>
                        <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{formatEur(totals.grossRevenue / ranDays)}</strong> / ditë
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <GapNotice gap={gap ?? "unavailable"} campaign={campaign} />
              )}
            </div>

            <TimelineHero campaign={campaign} timeline={timeline} now={now} />
          </div>
        </div>

        {/* Stat tiles */}
        {totals && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              icon={Coins}
              label="Fitimi bruto"
              value={formatEur(totals.grossProfit)}
              sub={`Marzha ${formatPct(totals.grossMarginPct ?? 0)}`}
              meter={(totals.grossMarginPct ?? 0) / 100}
            />
            <StatTile
              icon={PackageCheck}
              label="Njësi të shitura"
              value={formatInt(totals.totalUnitsSold)}
              sub={ranDays > 0 ? `≈ ${formatInt(totals.totalUnitsSold / ranDays)} në ditë` : "—"}
            />
            <StatTile
              icon={Percent}
              label="Markdown"
              value={formatPct(totals.markdownPct ?? 0)}
              sub={`${formatEur(totals.markdownAmount ?? 0)} zbritje`}
              meter={(totals.markdownPct ?? 0) / 100}
            />
            <StatTile
              icon={Receipt}
              label="Kosto totale"
              value={formatEur(totals.totalCost)}
              sub={totals.netRevenue > 0 ? `${formatPct((totals.totalCost / totals.netRevenue) * 100)} e neto` : "—"}
            />
          </div>
        )}

        {/* Body */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            {analytics && analytics.storeBreakdown?.length > 0 && (
              <StoreLeaderboard stores={analytics.storeBreakdown} totalRevenue={totals?.grossRevenue ?? 0} silentStores={silentStores} />
            )}
            {analytics && analytics.topProducts?.length > 0 && <ProductLeaderboard products={analytics.topProducts} />}

            <Panel icon={FileText} title="Përmbajtja">
              <div className="space-y-4 px-5 py-4">
                {campaign.subject?.trim() && (
                  <div className="rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-800/50">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      <Mail className="size-3.5" />
                      Subjekti
                    </div>
                    <p className="mt-1 font-medium text-neutral-800 dark:text-neutral-100">{campaign.subject}</p>
                  </div>
                )}
                {campaign.content?.trim() ? (
                  <p className="text-sm leading-relaxed whitespace-pre-line text-neutral-700 dark:text-neutral-300">{campaign.content}</p>
                ) : (
                  <p className="text-sm text-neutral-400 italic">Nuk ka përmbajtje ose udhëzime për këtë kampanjë.</p>
                )}
              </div>
            </Panel>
          </div>

          <div className="min-w-0 space-y-6">
            {analytics && analytics.topCategories?.length > 0 && <CategoryBars categories={analytics.topCategories} />}
            <DetailsCard campaign={campaign} timeline={timeline} now={now} />
            <StoresCard stores={campaign.participatingStores} totalStores={totalStores} silentStores={silentStores} />
          </div>
        </div>
      </div>
    </MotionConfig>
  )
}

// ---------- hero pieces ----------

function TimelineHero({ campaign, timeline, now }: { campaign: CampaignDetailData; timeline: Timeline; now: number }) {
  const { phase, totalDays } = timeline
  const dayOf =
    phase === "live" ? `Dita ${totalDays - timeline.days + 1} nga ${totalDays}`
    : phase === "ended" ? `${totalDays} ditë gjithsej`
    : phase === "upcoming" && totalDays ? `Zgjat ${totalDays} ditë`
    : null

  return (
    <div className="flex min-w-0 flex-col justify-center">
      <div className="flex items-baseline justify-between gap-3">
        <span className={cx("text-lg font-semibold", timelineTone(timeline))}>{timeline.label}</span>
        {dayOf && <span className="text-sm text-neutral-500 dark:text-neutral-400">{dayOf}</span>}
      </div>
      <div className="mt-3 [&>div]:h-2.5">
        <TimelineBar timeline={timeline} />
      </div>
      <div className="mt-2 flex justify-between text-xs font-medium text-neutral-500 dark:text-neutral-400">
        <span>{campaign.startDate ? formatDay(campaign.startDate, true) : "Pa datë fillimi"}</span>
        <span>{campaign.endDate ? formatDay(campaign.endDate, true) : "Pa datë përfundimi"}</span>
      </div>
      {phase === "live" && (
        <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">
          {formatPct(timeline.progress * 100)} e periudhës ka kaluar · përditësohet çdo minutë
        </p>
      )}
      {phase === "upcoming" && campaign.startDate && (
        <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">Nis më {formatDay(campaign.startDate, new Date(campaign.startDate).getUTCFullYear() !== new Date(now).getUTCFullYear())}</p>
      )}
    </div>
  )
}

const GAPS: Record<AnalyticsGap, { icon: LucideIcon; title: string; body: string; edit: boolean }> = {
  "no-stores": {
    icon: StoreIcon,
    title: "Pa dyqane pjesëmarrëse",
    body: "Shto dyqanet e kampanjës që të shfaqen shitjet dhe performanca.",
    edit: true,
  },
  "no-dates": {
    icon: CalendarX2,
    title: "Mungon data e përfundimit",
    body: "Analitika shfaqet sapo kampanja të ketë një periudhë të plotë.",
    edit: true,
  },
  upcoming: {
    icon: Hourglass,
    title: "Kampanja nuk ka nisur ende",
    body: "Shitjet do të shfaqen këtu sapo të fillojë.",
    edit: false,
  },
  unavailable: {
    icon: CloudOff,
    title: "Të dhënat e ERP nuk janë të disponueshme",
    body: "Nuk arritëm të marrim shitjet për këtë kampanjë. Provo përsëri pak më vonë.",
    edit: false,
  },
}

function GapNotice({ gap, campaign }: { gap: AnalyticsGap; campaign: CampaignDetailData }) {
  const g = GAPS[gap]
  const Icon = g.icon
  return (
    <div className="flex h-full flex-col justify-center">
      <span className="inline-flex size-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
        <Icon className="size-5" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{g.title}</h2>
      <p className="mt-1 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">{g.body}</p>
      {g.edit && (
        <Link
          href={`/campaigns/${campaign.id}/edit`}
          className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-600 dark:text-brand-400"
        >
          <Pencil className="size-3.5" />
          Plotëso kampanjën
        </Link>
      )}
    </div>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  meter,
}: {
  icon: LucideIcon
  label: string
  value: string
  sub: string
  meter?: number
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-2 truncate text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.75rem] dark:text-neutral-50">{value}</div>
      {meter !== undefined && (
        <div className="mt-2 h-1.5 rounded-r-[4px] bg-brand-50 dark:bg-brand-500/10">
          <motion.div
            className="h-full rounded-r-[4px] bg-brand-500 dark:bg-brand-400"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(1, meter)) * 100}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      )}
      <p className="mt-1.5 truncate text-xs text-neutral-500 dark:text-neutral-400" title={sub}>
        {sub}
      </p>
    </div>
  )
}

// ---------- sidebar ----------

function DetailsCard({ campaign, timeline, now }: { campaign: CampaignDetailData; timeline: Timeline; now: number }) {
  const [copied, setCopied] = useState(false)
  const thisYear = new Date(now).getUTCFullYear()
  const day = (iso: string) => formatDay(iso, new Date(iso).getUTCFullYear() !== thisYear)

  const copyId = () => {
    navigator.clipboard.writeText(campaign.id).then(
      () => {
        setCopied(true)
        toast.success("ID u kopjua.")
        setTimeout(() => setCopied(false), 1500)
      },
      () => toast.error("Kopjimi dështoi.")
    )
  }

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Lloji", value: channelMeta(campaign.type).label },
    { label: "Buxheti", value: campaign.budget ? `€${formatInt(campaign.budget)}` : <Muted>Pa buxhet</Muted> },
    { label: "Fillimi", value: campaign.startDate ? day(campaign.startDate) : <Muted>Pa datë</Muted> },
    { label: "Përfundimi", value: campaign.endDate ? day(campaign.endDate) : <Muted>Pa datë</Muted> },
    { label: "Kohëzgjatja", value: timeline.totalDays ? `${timeline.totalDays} ditë` : <Muted>E hapur</Muted> },
    { label: "Krijuar", value: day(campaign.createdAt) },
    { label: "Përditësuar", value: day(campaign.updatedAt) },
  ]

  return (
    <Panel icon={CalendarRange} title="Detajet">
      <dl className="divide-y divide-neutral-100 px-5 dark:divide-neutral-800">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
            <dt className="text-neutral-500 dark:text-neutral-400">{r.label}</dt>
            <dd className="text-right font-medium text-neutral-900 dark:text-neutral-100">{r.value}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        onClick={copyId}
        title="Kopjo ID-në"
        className="group flex w-full cursor-pointer items-center justify-between gap-3 border-t border-neutral-100 px-5 py-2.5 text-left transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/40"
      >
        <span className="truncate font-mono text-[11px] text-neutral-400">{campaign.id}</span>
        {copied ? <Check className="size-3.5 shrink-0 text-emerald-500" /> : <Copy className="size-3.5 shrink-0 text-neutral-400 group-hover:text-neutral-600" />}
      </button>
    </Panel>
  )
}

const Muted = ({ children }: { children: React.ReactNode }) => (
  <span className="font-normal text-neutral-400 dark:text-neutral-500">{children}</span>
)

const STORES_COLLAPSED = 12

function StoresCard({ stores, totalStores, silentStores }: { stores: string[]; totalStores: number; silentStores: string[] }) {
  const [open, setOpen] = useState(false)
  const silent = new Set(silentStores)
  const sorted = [...stores].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }))
  const visible = open ? sorted : sorted.slice(0, STORES_COLLAPSED)
  const share = totalStores > 0 ? Math.min(1, stores.length / totalStores) : 0

  return (
    <Panel
      icon={StoreIcon}
      title="Dyqanet pjesëmarrëse"
      aside={
        <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
          <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{stores.length}</strong>/{totalStores}
        </span>
      }
    >
      <div className="px-5 py-4">
        {stores.length === 0 ? (
          <p className="text-sm text-neutral-400 italic">Kjo kampanjë nuk është e lidhur me asnjë dyqan.</p>
        ) : (
          <>
            <div className="mb-4 h-1.5 rounded-r-[4px] bg-brand-50 dark:bg-brand-500/10">
              <motion.div
                className="h-full rounded-r-[4px] bg-brand-500 dark:bg-brand-400"
                initial={{ width: 0 }}
                animate={{ width: `${share * 100}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {visible.map((name) => (
                <li
                  key={name}
                  title={silent.has(name) ? "Pa shitje në këtë periudhë" : undefined}
                  className={cx(
                    "rounded-lg border px-2 py-1 text-xs font-medium",
                    silent.has(name)
                      ? "border-dashed border-neutral-300 bg-transparent text-neutral-400 dark:border-neutral-600 dark:text-neutral-500"
                      : "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-300"
                  )}
                >
                  {name}
                </li>
              ))}
            </ul>
            {sorted.length > STORES_COLLAPSED && (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="mt-3 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                {open ? "Shfaq më pak" : `+${sorted.length - STORES_COLLAPSED} të tjera`}
                <ChevronDown className={cx("size-3.5 transition-transform", open && "rotate-180")} />
              </button>
            )}
            {silentStores.length > 0 && (
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                <Info className="size-3.5" />
                Dyqanet me vijë të ndërprerë nuk kanë shitje në këtë periudhë.
              </p>
            )}
          </>
        )}
      </div>
    </Panel>
  )
}
