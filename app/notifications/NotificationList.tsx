"use client"

// app/notifications/NotificationList.tsx: the inbox. Unread ones are highlighted; clicking marks it read
// and opens the page it's about.
import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BellRing, CheckCheck } from "lucide-react"
import { useT } from "../lib/i18n/client"
import { agoText, renderNotification, type Tone } from "../lib/alerts/render"
import ProductThumb from "../ProductThumb"
import { markAllRead, markRead, type BellItem } from "./actions"

const DOT: Record<Tone, string> = { red: "bg-red-500", amber: "bg-amber-500", sky: "bg-sky-500", neutral: "bg-neutral-400" }

export default function NotificationList({ items, hasRules }: { items: BellItem[]; hasRules: boolean }) {
  const t = useT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  // Client clock for "5 min ago"; the server-rendered text may differ by a few seconds, hence suppressHydrationWarning
  const [now] = useState(() => Date.now())

  const open = (item: BellItem, href: string) => {
    if (!item.read) void markRead(item.id)
    router.push(href)
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center dark:border-neutral-700 dark:bg-neutral-900">
        <BellRing className="mx-auto size-8 text-neutral-300 dark:text-neutral-600" />
        <p className="mt-3 font-semibold text-neutral-700 dark:text-neutral-200">{t.alerts.empty}</p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t.alerts.emptyHint}</p>
        {!hasRules && (
          <Link href="/notifications?tab=rules" className="mt-4 inline-flex rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 dark:bg-brand-500">
            {t.alerts.rules.add}
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.some((i) => !i.read) && (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => { await markAllRead(); router.refresh() })}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-600 disabled:opacity-50 dark:text-brand-400"
          >
            <CheckCheck className="size-3.5" />
            {t.alerts.markAllRead}
          </button>
        </div>
      )}
      <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
        {items.map((item) => {
          const r = renderNotification(item, t)
          return (
            <li key={item.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => open(item, r.href)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open(item, r.href))}
                className={`flex w-full cursor-pointer items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:outline-none dark:hover:bg-neutral-800/40 dark:focus-visible:bg-neutral-800/40 ${item.read ? "" : "bg-brand-50/40 dark:bg-brand-500/5"}`}
              >
                <span className={`mt-2 size-2 shrink-0 rounded-full ${item.read ? "bg-neutral-200 dark:bg-neutral-700" : DOT[r.tone]}`} aria-hidden />
                {r.product && (
                  // The photo zooms / opens on its own; don't also open the row's page
                  <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                    <ProductThumb styleNumber={r.product.styleNumber} colorCode={r.product.colorCode} alt={r.product.name} width={32} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${item.read ? "text-neutral-700 dark:text-neutral-300" : "font-semibold text-neutral-900 dark:text-neutral-100"}`}>{r.title}</span>
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400">{r.body}</span>
                </span>
                <span className="shrink-0 text-[11px] text-neutral-400 tabular-nums" suppressHydrationWarning>
                  {agoText(item.createdAt, t, now)}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
