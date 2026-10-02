"use client"

// app/NotificationBell.tsx
// Header bell: red counter of unread notifications (refreshed every minute while the tab is visible) and
// a dropdown with the latest ones. Clicking one marks it read and opens the right page.
// Phones: the list opens as a centered panel under the header over a dimmed page (rendered in <body>,
// because the header's backdrop blur would otherwise trap a fixed panel inside it).
import { useEffect, useRef, useState, useTransition } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { Bell, CheckCheck } from "lucide-react"
import { useT } from "./lib/i18n/client"
import { agoText, renderNotification, type Tone } from "./lib/alerts/render"
import { getBell, markAllRead, markRead, type BellItem } from "./notifications/actions"

const DOT: Record<Tone, string> = { red: "bg-red-500", amber: "bg-amber-500", sky: "bg-sky-500", neutral: "bg-neutral-400" }

export default function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const t = useT()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(initialUnread)
  const [items, setItems] = useState<BellItem[] | null>(null)
  const [now, setNow] = useState(0)
  const [, startTransition] = useTransition()
  const [phone, setPhone] = useState(false) // layout decided when opening
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Keep the counter fresh while the tab is visible
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") getBell(0).then((b) => setUnread(b.unread)).catch(() => {})
    }
    const timer = setInterval(refresh, 60_000)
    return () => clearInterval(timer)
  }, [])

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const toggle = () => {
    if (open) return setOpen(false)
    setPhone(window.matchMedia("(max-width: 639px)").matches)
    setOpen(true)
    setNow(Date.now())
    getBell(8)
      .then((b) => {
        setItems(b.items)
        setUnread(b.unread)
      })
      .catch(() => setItems([]))
  }

  const openItem = (item: BellItem, href: string) => {
    setOpen(false)
    if (!item.read) {
      setUnread((n) => Math.max(0, n - 1))
      void markRead(item.id)
    }
    router.push(href)
  }

  const readAll = () =>
    startTransition(async () => {
      await markAllRead()
      setUnread(0)
      setItems((list) => list?.map((i) => ({ ...i, read: true })) ?? null)
    })

  const panel = (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-label={t.alerts.bell}
      initial={{ opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.12 }}
      style={{ transformOrigin: phone ? "top center" : "top right" }}
      className={`${phone ? "fixed inset-x-4 top-[4.5rem] z-[70] mx-auto max-w-sm" : "absolute top-full right-0 z-50 mt-2 w-[22rem]"} overflow-hidden rounded-2xl border border-neutral-200 bg-white text-neutral-900 shadow-xl dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
        <span className="text-sm font-semibold">{t.alerts.bell}</span>
        {unread > 0 && (
          <button type="button" onClick={readAll} className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-600 dark:text-brand-400">
            <CheckCheck className="size-3.5" />
            {t.alerts.markAllRead}
          </button>
        )}
      </div>

      <div className="max-h-[min(26rem,60vh)] overflow-y-auto overscroll-contain">
        {items === null ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{t.alerts.empty}</p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{t.alerts.emptyHint}</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {items.map((item) => {
              const r = renderNotification(item, t)
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openItem(item, r.href)}
                    className={`flex w-full cursor-pointer gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${item.read ? "" : "bg-brand-50/40 dark:bg-brand-500/5"}`}
                  >
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.read ? "bg-neutral-200 dark:bg-neutral-700" : DOT[r.tone]}`} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm ${item.read ? "text-neutral-600 dark:text-neutral-300" : "font-semibold"}`}>{r.title}</span>
                      <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">{r.body}</span>
                      <span className="mt-0.5 block text-[11px] text-neutral-400">{agoText(item.createdAt, t, now)}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Link
        href="/notifications"
        onClick={() => setOpen(false)}
        className="block border-t border-neutral-100 px-4 py-2.5 text-center text-xs font-semibold text-brand-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-brand-400 dark:hover:bg-neutral-800/50"
      >
        {t.alerts.seeAll}
      </Link>
    </motion.div>
  )

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unread > 0 ? `${t.alerts.bell} · ${t.alerts.unread(unread)}` : t.alerts.bell}
        title={t.alerts.bell}
        className="relative inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-4 font-bold text-white ring-2 ring-white tabular-nums dark:ring-neutral-900">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Desktop: dropdown under the bell */}
      <AnimatePresence>{open && !phone && panel}</AnimatePresence>

      {/* Phones: centered panel over a dimmed page */}
      {open &&
        phone &&
        createPortal(
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[69] bg-black/40 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            {panel}
          </>,
          document.body,
        )}
    </div>
  )
}
