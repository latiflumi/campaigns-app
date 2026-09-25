// app/lib/roles.ts
// Role checks. The role is read from the database on every check (not stored in
// the JWT), so promoting or demoting a user takes effect on their next request.

import "server-only"
import { redirect } from "next/navigation"
import { prisma } from "./prisma"
import { getSession, requireSession, type TokenPayLoad } from "./session"

export const FORBIDDEN_MESSAGE = "Vetëm administratorët mund ta bëjnë këtë veprim."

async function isAdminUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { userId }, select: { role: true } })
  return user?.role === "ADMIN"
}

/** For rendering: whether the signed-in user may create, edit or delete campaigns. */
export async function canManageCampaigns(): Promise<boolean> {
  const session = await getSession()
  return session ? isAdminUser(session.userId) : false
}

/** For admin-only pages: signed out → /login, signed in but not admin → /campaigns. */
export async function requireAdminPage(): Promise<TokenPayLoad> {
  const session = await requireSession()
  if (!(await isAdminUser(session.userId))) redirect("/campaigns")
  return session
}

/** For server actions: true when the caller is a signed-in admin. */
export async function isAdmin(session: TokenPayLoad): Promise<boolean> {
  return isAdminUser(session.userId)
}
