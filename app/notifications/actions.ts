"use server"

// app/notifications/actions.ts
// Notifications (the bell) and the user's own alert rules. Every action checks the session and only
// touches the caller's own rows. "Run checks now" is admin-only.
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma"
import { getSession, requireSession } from "../lib/session"
import { isAdmin } from "../lib/roles"
import { getT } from "../lib/i18n/server"
import { runAlertRound } from "../lib/alerts/engine"

// ---------- bell ----------

export interface BellItem {
  id: string
  kind: string
  data: unknown
  createdAt: string
  read: boolean
}

/** Unread count + the latest notifications, for the header bell. Quiet (no redirect) when signed out. */
export async function getBell(limit = 8): Promise<{ unread: number; items: BellItem[] }> {
  const session = await getSession()
  if (!session) return { unread: 0, items: [] }
  const [unread, rows] = await Promise.all([
    prisma.notification.count({ where: { userId: session.userId, readAt: null } }),
    prisma.notification.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" }, take: limit }),
  ])
  return {
    unread,
    items: rows.map((n) => ({ id: n.id, kind: n.kind, data: n.data, createdAt: n.createdAt.toISOString(), read: n.readAt !== null })),
  }
}

export async function markRead(id: string) {
  const session = await requireSession()
  await prisma.notification.updateMany({ where: { id, userId: session.userId, readAt: null }, data: { readAt: new Date() } })
  revalidatePath("/notifications")
}

export async function markAllRead() {
  const session = await requireSession()
  await prisma.notification.updateMany({ where: { userId: session.userId, readAt: null }, data: { readAt: new Date() } })
  revalidatePath("/notifications")
}

// ---------- rules ----------

const scopeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("all") }),
  z.object({ kind: z.literal("chain"), chain: z.string().regex(/^[a-z0-9-]{1,40}$/) }),
  z.object({ kind: z.literal("store"), orgId: z.number().int().positive() }),
])

const ruleSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("SALES_DROP"),
    params: z.object({ scope: scopeSchema, threshold: z.number().int().min(5).max(90), period: z.enum(["yesterday", "mtd"]) }),
  }),
  z.object({
    type: z.literal("OUT_OF_STOCK"),
    params: z.object({ scope: scopeSchema, noosOnly: z.boolean(), brand: z.string().regex(/^[a-z0-9-]{1,60}$/).nullable() }),
  }),
  z.object({
    type: z.literal("CAMPAIGN"),
    params: z.object({ starts: z.boolean(), ends: z.boolean() }).refine((p) => p.starts || p.ends),
  }),
])

export type RuleInput = z.input<typeof ruleSchema>

export async function createRule(input: RuleInput): Promise<{ success: true } | { success: false; error: string }> {
  const session = await requireSession()
  const t = await getT()
  const parsed = ruleSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t.alerts.rules.invalid }
  await prisma.alertRule.create({
    data: { userId: session.userId, type: parsed.data.type, params: parsed.data.params as Prisma.InputJsonValue },
  })
  revalidatePath("/notifications")
  return { success: true }
}

export async function setRuleActive(id: string, active: boolean) {
  const session = await requireSession()
  await prisma.alertRule.updateMany({ where: { id, userId: session.userId }, data: { active } })
  revalidatePath("/notifications")
}

export async function deleteRule(id: string) {
  const session = await requireSession()
  await prisma.alertRule.deleteMany({ where: { id, userId: session.userId } })
  revalidatePath("/notifications")
}

/** Admins: run one round now, ignoring the time-of-day window (handy for testing). */
export async function runChecksNow(): Promise<{ ok: boolean; message: string }> {
  const session = await requireSession()
  const t = await getT()
  if (!(await isAdmin(session))) return { ok: false, message: t.serverErrors.forbidden }
  const r = await runAlertRound({ force: true })
  revalidatePath("/notifications")
  if (r.skipped) return { ok: false, message: t.alerts.rules.runSkipped }
  return { ok: r.errors.length === 0, message: r.errors.length ? `${t.alerts.rules.runDone(r.notifications)} ${t.alerts.rules.runErrors}` : t.alerts.rules.runDone(r.notifications) }
}
