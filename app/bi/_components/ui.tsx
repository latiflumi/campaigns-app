// app/bi/_components/ui.tsx
// Presentational building blocks for the BI module (no hooks: safe in server and client components).
import type { LucideIcon } from "lucide-react"
import { AlertTriangle } from "lucide-react"
/** Joins class names, skipping falsy ones. (parts.tsx has one too, but it is a client module.) */
export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ")
}

const one = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** cur/prev − 1, or null when there's nothing to compare with. */
export const growth = (cur: number, prev: number) => (prev > 0 ? cur / prev - 1 : null)

/** "+3,4%" / "−12,0%" from a ratio (0.034). */
export const signedPct = (ratio: number) => `${ratio >= 0 ? "+" : "−"}${one.format(Math.abs(ratio) * 100)}%`

/** "+1,2 pp" from a difference of two percentages (45.3 − 44.1). */
export const signedPp = (diff: number) => `${diff >= 0 ? "+" : "−"}${one.format(Math.abs(diff))} pp`

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cx("min-w-0 rounded-2xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900", className)}>
      {children}
    </section>
  )
}

/** `iconClass` overrides the icon's colour (grey by default). */
export function CardHeader({ icon: Icon, title, sub, aside, iconClass = "text-neutral-400" }: { icon?: LucideIcon; title: string; sub?: string; aside?: React.ReactNode; iconClass?: string }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {Icon && <Icon className={cx("size-4", iconClass)} />}
          {title}
        </h2>
        {sub && <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{sub}</p>}
      </div>
      {aside}
    </header>
  )
}

/**
 * Change chip. Arrow = real direction; colour = whether that is good.
 * `invert` for metrics where down is good (markdown).
 */
/** `na` is the text shown when there is nothing to compare (t.bi.kpi.na). */
export function Delta({ value, kind, invert, na = "n/a" }: { value: number | null; kind: "pct" | "pp"; invert?: boolean; na?: string }) {
  if (value === null || !Number.isFinite(value)) {
    return <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">{na}</span>
  }
  const flat = Math.abs(kind === "pct" ? value : value / 100) < 0.0005
  const good = invert ? value < 0 : value > 0
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
        flat
          ? "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
          : good
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
            : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
      )}
    >
      {flat ? "•" : value > 0 ? "▲" : "▼"} {kind === "pct" ? signedPct(value) : signedPp(value)}
    </span>
  )
}

export function KpiTile({
  label,
  value,
  delta,
  foot,
  badge,
  badgeTitle,
}: {
  label: string
  value: string
  delta: React.ReactNode
  foot: string
  badge?: string
  badgeTitle?: string
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
        <span className="truncate">{label}</span>
        {badge && (
          <span className="rounded border border-neutral-200 px-1 text-[10px] font-bold tracking-wider text-neutral-400 dark:border-neutral-700" title={badgeTitle}>
            {badge}
          </span>
        )}
      </div>
      <div className="mt-2 truncate text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.75rem] dark:text-neutral-50">{value}</div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
        {delta}
        <span className="truncate">{foot}</span>
      </div>
    </div>
  )
}

export function ErrorCard({ message, className }: { message: string; className?: string }) {
  return (
    <Card className={cx("flex items-center gap-3 px-5 py-6 text-sm text-neutral-500 dark:text-neutral-400", className)}>
      <AlertTriangle className="size-4 shrink-0 text-amber-500" />
      {message}
    </Card>
  )
}

/** One-hue magnitude bar, square at the baseline, rounded data end. */
export function Bar({ share, lead }: { share: number; lead?: boolean }) {
  return (
    <div className="h-2 w-full rounded-r-[4px] bg-neutral-100 dark:bg-neutral-800">
      <div
        className={cx("h-full rounded-r-[4px]", lead ? "bg-brand-600 dark:bg-brand-400" : "bg-neutral-400 dark:bg-neutral-500")}
        style={{ width: `${Math.max(0, Math.min(1, share)) * 100}%` }}
      />
    </div>
  )
}

export function SkeletonCard({ height = "h-64", className }: { height?: string; className?: string }) {
  return <div className={cx("animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100/70 dark:border-neutral-800 dark:bg-neutral-900", height, className)} />
}
