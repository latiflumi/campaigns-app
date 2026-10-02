// app/notifications/page.tsx: the user's notifications and the alerts they subscribed to.
//   ?tab=rules → "My alerts" (add / switch off / delete), otherwise the inbox.
import Link from "next/link"
import type { Metadata } from "next"
import { requireSession } from "../lib/session"
import { isAdmin } from "../lib/roles"
import { prisma } from "../lib/prisma"
import { getT } from "../lib/i18n/server"
import { getBiAttributes, getBiStores, settle } from "../lib/bi/erp"
import { brandKey, brandOf } from "../lib/bi/brands"
import { cx } from "../bi/_components/ui"
import NotificationList from "./NotificationList"
import RulesPanel from "./RulesPanel"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).alerts.title }
}

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await requireSession()
  const t = await getT()
  const tab = (await searchParams).tab === "rules" ? "rules" : "inbox"

  const [notifications, rules, admin] = await Promise.all([
    prisma.notification.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.alertRule.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "asc" } }),
    isAdmin(session),
  ])
  const unread = notifications.filter((n) => !n.readAt).length

  // Names for the rule form and the rule descriptions (stores, chains, product brands)
  const [stores, attrs] = tab === "rules" ? await Promise.all([settle(getBiStores()), settle(getBiAttributes())]) : [null, null]
  const storeList = (stores?.data ?? []).map((s) => ({ orgId: s.orgId, name: s.name }))
  const chains = [...new Map(storeList.map((s) => [brandKey(brandOf(s.name)), brandOf(s.name)])).entries()].map(([key, label]) => ({ key, label }))
  const brands = (attrs?.data?.brands ?? []).map((b) => ({ key: b.key, label: b.name }))

  const tabClass = (active: boolean) =>
    cx(
      "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
      active ? "bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:text-white dark:ring-neutral-700" : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200",
    )

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">{t.alerts.title}</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t.alerts.subtitle}</p>
      </div>

      <nav className="inline-flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800/70" aria-label={t.alerts.title}>
        <Link href="/notifications" className={tabClass(tab === "inbox")} aria-current={tab === "inbox" ? "page" : undefined}>
          {t.alerts.tabInbox}
          {unread > 0 && <span className="ml-1.5 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white tabular-nums">{unread}</span>}
        </Link>
        <Link href="/notifications?tab=rules" className={tabClass(tab === "rules")} aria-current={tab === "rules" ? "page" : undefined}>
          {t.alerts.tabRules}
          <span className="ml-1.5 text-xs text-neutral-400 tabular-nums">{rules.length}</span>
        </Link>
      </nav>

      {tab === "inbox" ? (
        <NotificationList
          items={notifications.map((n) => ({ id: n.id, kind: n.kind, data: n.data, createdAt: n.createdAt.toISOString(), read: n.readAt !== null }))}
          hasRules={rules.length > 0}
        />
      ) : (
        <RulesPanel
          rules={rules.map((r) => ({ id: r.id, type: r.type, params: r.params, active: r.active }))}
          stores={storeList}
          chains={chains}
          brands={brands}
          isAdmin={admin}
        />
      )}
    </div>
  )
}
