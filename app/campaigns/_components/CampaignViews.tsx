"use client"

// app/campaigns/_components/CampaignViews.tsx
// The two layouts for the campaigns list: a dense, scannable list and a card grid.

import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import {
  channelMeta,
  formatRange,
  formatInt,
  type CampaignListItem,
  type Timeline,
} from "./campaign-utils"
import {
  cx,
  StatusPill,
  ChannelTile,
  TimelineBar,
  timelineTone,
  StoreCoverage,
  RevenueCell,
  RowActions,
  Highlight,
} from "./parts"

export interface ViewRow {
  campaign: CampaignListItem
  timeline: Timeline
}

export interface ViewSection {
  key: string
  title: string | null // null = flat list, no header
  hint?: string
  rows: ViewRow[]
}

interface ViewProps {
  sections: ViewSection[]
  now: number
  query: string
  totalStores: number
  maxRevenue: number
  onDelete: (c: CampaignListItem) => void
}

const itemMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
}

function metaLine(c: CampaignListItem) {
  const parts = [channelMeta(c.type).label]
  if (c.budget) parts.push(`Buxheti €${formatInt(c.budget)}`)
  if (c.subject?.trim()) parts.push(c.subject.trim())
  return parts.join(" · ")
}

function SectionHeader({ section, className }: { section: ViewSection; className?: string }) {
  if (!section.title) return null
  const live = section.key === "live"
  return (
    <div className={cx("flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400", className)}>
      {live && (
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
      )}
      <span>{section.title}</span>
      <span className="rounded-full bg-neutral-200/70 px-1.5 py-px text-[10px] tabular-nums text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
        {section.rows.length}
      </span>
      {section.hint && <span className="font-normal normal-case tracking-normal text-neutral-400 dark:text-neutral-500">{section.hint}</span>}
    </div>
  )
}

function TimelineBlock({ row, now }: { row: ViewRow; now: number }) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="truncate font-medium text-neutral-600 dark:text-neutral-300">{formatRange(row.campaign, now)}</span>
        <span className={cx("shrink-0 font-semibold", timelineTone(row.timeline))}>{row.timeline.label}</span>
      </div>
      <div className="mt-2">
        <TimelineBar timeline={row.timeline} />
      </div>
    </div>
  )
}

// ---------- list ----------

const listCols =
  "lg:grid-cols-[minmax(0,2.4fr)_7.5rem_minmax(0,1.7fr)_minmax(0,1fr)_9.5rem_6.5rem]"

export function ListView({ sections, now, query, totalStores, maxRevenue, onDelete }: ViewProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
      <div
        className={cx(
          "hidden border-b border-neutral-200 bg-neutral-50/80 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 lg:grid lg:gap-6 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-500",
          listCols
        )}
      >
        <span>Kampanja</span>
        <span>Statusi</span>
        <span>Kohëzgjatja</span>
        <span>Dyqanet</span>
        <span className="text-right">Qarkullimi bruto</span>
        <span className="sr-only">Actions</span>
      </div>

      {sections.map((section) => (
        <section key={section.key}>
          {section.title && (
            <SectionHeader
              section={section}
              className="border-b border-neutral-100 bg-neutral-50/50 px-5 py-2 dark:border-neutral-800 dark:bg-neutral-950/30"
            />
          )}
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            <AnimatePresence initial={false} mode="popLayout">
              {section.rows.map((row) => {
                const { campaign: c, timeline } = row
                const live = timeline.phase === "live" || timeline.phase === "open"
                return (
                  <motion.li
                    key={c.id}
                    layout="position"
                    {...itemMotion}
                    className={cx(
                      "group relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-3 px-4 py-4 transition-colors hover:bg-neutral-50/80 sm:px-5 lg:items-center lg:gap-6 dark:hover:bg-neutral-800/40",
                      listCols
                    )}
                  >
                    {/* accent: permanent for live campaigns, channel colour on hover otherwise */}
                    <span
                      aria-hidden
                      className={cx(
                        "absolute inset-y-3 left-0 w-[3px] rounded-r-full transition-opacity",
                        live ? "bg-emerald-400" : channelMeta(c.type).accent,
                        live ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}
                    />

                    <div className="flex min-w-0 items-center gap-3">
                      <ChannelTile type={c.type} />
                      <div className="min-w-0">
                        <Link
                          href={`/campaigns/${c.id}`}
                          className="block truncate font-semibold text-neutral-900 transition-colors after:absolute after:inset-0 group-hover:text-brand-700 dark:text-neutral-100 dark:group-hover:text-brand-400"
                        >
                          <Highlight text={c.name} query={query} />
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">{metaLine(c)}</p>
                      </div>
                    </div>

                    <div className="justify-self-end lg:justify-self-start">
                      <StatusPill status={c.status} />
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <TimelineBlock row={row} now={now} />
                    </div>

                    <StoreCoverage stores={c.participatingStores} totalStores={totalStores} />

                    <div className="justify-self-end lg:justify-self-stretch">
                      <RevenueCell campaign={c} maxRevenue={maxRevenue} />
                    </div>

                    <div className="relative z-10 col-span-2 flex justify-end transition-opacity lg:col-span-1 lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
                      <RowActions id={c.id} name={c.name} onDelete={() => onDelete(c)} />
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        </section>
      ))}
    </div>
  )
}

// ---------- grid ----------

export function GridView({ sections, now, query, totalStores, maxRevenue, onDelete }: ViewProps) {
  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <section key={section.key} className="space-y-3">
          <SectionHeader section={section} className="px-1" />
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence initial={false} mode="popLayout">
              {section.rows.map((row) => {
                const { campaign: c, timeline } = row
                const live = timeline.phase === "live" || timeline.phase === "open"
                return (
                  <motion.li
                    key={c.id}
                    layout="position"
                    {...itemMotion}
                    className={cx(
                      "group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-5 shadow-xs transition-[box-shadow,border-color] hover:shadow-lg hover:shadow-neutral-200/60 dark:bg-neutral-900 dark:hover:shadow-black/30",
                      live
                        ? "border-emerald-200/80 hover:border-emerald-300 dark:border-emerald-500/25"
                        : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700"
                    )}
                  >
                    {live && (
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-emerald-400/10 blur-2xl dark:bg-emerald-400/10"
                      />
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <ChannelTile type={c.type} size="lg" />
                      <StatusPill status={c.status} />
                    </div>

                    <Link
                      href={`/campaigns/${c.id}`}
                      className="mt-4 line-clamp-2 text-base leading-snug font-semibold text-neutral-900 transition-colors after:absolute after:inset-0 group-hover:text-brand-700 dark:text-neutral-100 dark:group-hover:text-brand-400"
                    >
                      <Highlight text={c.name} query={query} />
                    </Link>
                    <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">{metaLine(c)}</p>

                    <div className="mt-5">
                      <TimelineBlock row={row} now={now} />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                      <div className="min-w-0">
                        <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Dyqanet</div>
                        <StoreCoverage stores={c.participatingStores} totalStores={totalStores} />
                      </div>
                      <div className="min-w-0">
                        <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Qarkullimi bruto</div>
                        <RevenueCell campaign={c} maxRevenue={maxRevenue} align="left" />
                      </div>
                    </div>

                    <div className="relative z-10 mt-auto flex items-center justify-between pt-4">
                      <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-600">#{c.id.slice(-8)}</span>
                      <RowActions id={c.id} name={c.name} onDelete={() => onDelete(c)} />
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        </section>
      ))}
    </div>
  )
}
