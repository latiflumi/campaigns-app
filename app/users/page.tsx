// app/users/page.tsx: admin only. Everyone with an account, who's online, away or offline, and when they
// were last seen (users.lastSeenAt, see app/lib/presence.ts).
import type { Metadata } from "next"
import { requireAdminPage } from "../lib/roles"
import { prisma } from "../lib/prisma"
import { avatarUrl } from "../lib/avatar"
import { getT } from "../lib/i18n/server"
import { lastSeenText, presenceOf, type Presence } from "../lib/presence"
import UserAvatar from "../UserAvatar"
import AutoRefresh from "./AutoRefresh"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).users.title }
}

const RANK: Record<Presence, number> = { online: 0, away: 1, offline: 2 }

const DOT: Record<Presence, string> = {
  online: "bg-emerald-500",
  away: "bg-amber-400",
  offline: "bg-neutral-300 dark:bg-neutral-600",
}

const PILL: Record<Presence, string> = {
  online: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25",
  away: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25",
  offline: "bg-neutral-100 text-neutral-600 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700",
}

export default async function UsersPage() {
  const session = await requireAdminPage() // viewers are sent back to /campaigns
  const t = await getT()
  const now = new Date().getTime()

  const users = await prisma.user.findMany({
    select: { userId: true, userName: true, fullName: true, role: true, avatarUpdatedAt: true, lastSeenAt: true },
  })
  const rows = users
    .map((u) => ({ ...u, presence: presenceOf(u.lastSeenAt, now) }))
    .sort((a, b) => RANK[a.presence] - RANK[b.presence] || (b.lastSeenAt?.getTime() ?? 0) - (a.lastSeenAt?.getTime() ?? 0))
  const count = (p: Presence) => rows.filter((r) => r.presence === p).length

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <AutoRefresh seconds={30} />
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">{t.users.title}</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t.users.subtitle}</p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        {(["online", "away", "offline"] as const).map((p) => (
          <span key={p} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1 ring-inset ${PILL[p]}`}>
            <span className={`size-1.5 rounded-full ${DOT[p]}`} />
            {t.users[p]} <span className="tabular-nums opacity-70">{count(p)}</span>
          </span>
        ))}
      </div>

      <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
        {rows.map((u) => {
          const name = u.fullName?.trim() || u.userName
          return (
            <li key={u.userId} className="flex items-center gap-4 px-5 py-3.5">
              <span className="relative shrink-0">
                <UserAvatar name={name} src={u.avatarUpdatedAt ? avatarUrl(u.userId, u.avatarUpdatedAt) : null} className="size-10 text-sm" />
                <span
                  className={`absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-white dark:ring-neutral-900 ${DOT[u.presence]}`}
                  aria-hidden
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {name}
                  {u.userId === session.userId && <span className="ml-1.5 font-normal text-neutral-400">({t.users.you})</span>}
                </span>
                <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                  @{u.userName} · {t.users.roles[u.role] ?? u.role}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${PILL[u.presence]}`}>
                  <span className={`size-1.5 rounded-full ${DOT[u.presence]} ${u.presence === "online" ? "animate-pulse" : ""}`} />
                  {t.users[u.presence]}
                </span>
                <span className="mt-1 block text-[11px] text-neutral-500 dark:text-neutral-400">{lastSeenText(t, u.lastSeenAt, now)}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
