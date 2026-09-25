"use client"

// app/UserMenu.tsx
// Header avatar that opens a small menu: View profile / Log out.

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { LogOut, UserRound } from "lucide-react"
import UserAvatar from "./UserAvatar"
import { logoutAction } from "./actions/auth"

export default function UserMenu({
  name,
  userName,
  avatarSrc,
}: {
  name: string
  userName: string
  avatarSrc: string | null
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click / tap and on Escape
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  // Move focus into the menu when it opens
  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus()
  }, [open])

  // Up/Down arrows move between the two items
  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
    e.preventDefault()
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])
    const i = items.indexOf(document.activeElement as HTMLElement)
    const next = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length
    items[next]?.focus()
  }

  const item =
    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none"

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${name}`}
        className={`flex cursor-pointer rounded-full ring-2 transition-shadow focus-visible:ring-brand-400 focus-visible:outline-none ${
          open ? "ring-neutral-300" : "ring-neutral-700 hover:ring-neutral-400"
        }`}
      >
        <UserAvatar name={name} src={avatarSrc} className="size-8 text-xs" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            role="menu"
            aria-label="Account"
            onKeyDown={onMenuKeyDown}
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.1 } }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            style={{ transformOrigin: "top right" }}
            className="absolute top-full right-0 z-50 mt-2 w-60 rounded-xl border border-neutral-200 bg-white p-1.5 text-neutral-900 shadow-lg shadow-neutral-900/10 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:shadow-black/40"
          >
            <div className="flex items-center gap-3 px-3 pt-2 pb-3">
              <UserAvatar name={name} src={avatarSrc} className="size-9 text-sm" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{name}</div>
                <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">@{userName}</div>
              </div>
            </div>
            <div className="my-1 h-px bg-neutral-100 dark:bg-neutral-800" />

            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`${item} text-neutral-700 hover:bg-neutral-100 focus-visible:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus-visible:bg-neutral-800`}
            >
              <UserRound className="size-4 text-neutral-400" />
              View profile
            </Link>

            {/* Posts to the logoutAction server action, which clears the auth cookies and redirects */}
            <form action={logoutAction}>
              <button
                type="submit"
                role="menuitem"
                className={`${item} text-red-600 hover:bg-red-50 focus-visible:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:focus-visible:bg-red-500/10`}
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
