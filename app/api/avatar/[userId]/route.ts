// app/api/avatar/[userId]/route.ts
// Serves a user's avatar from Postgres. /api is outside the middleware matcher,
// so this checks the session itself.

import type { NextRequest } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { getSession } from "@/app/lib/session"

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/avatar/[userId]">) {
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { userId } = await ctx.params
  const user = await prisma.user
    .findUnique({ where: { userId }, select: { avatar: true, avatarType: true } })
    .catch(() => null) // malformed uuid

  if (!user?.avatar || !user.avatarType) return new Response("Not found", { status: 404 })

  return new Response(new Uint8Array(user.avatar), {
    headers: {
      "Content-Type": user.avatarType,
      // URLs carry ?v=<updatedAt>, so a cached copy never goes stale
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
