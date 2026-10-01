// app/lib/presence.ts
// Who's online: users.lastSeenAt is refreshed when a signed-in user loads a page and by a once-a-minute
// ping while a tab is open (app/PresencePing.tsx). Admin-only views read it (app/users/page.tsx).
import "server-only"
import { prisma } from "./prisma"
import type { Dict } from "./i18n/dictionaries"

/** Seen within this long → online; within AWAY_MS → away; older → offline. */
export const ONLINE_MS = 2 * 60_000
export const AWAY_MS = 15 * 60_000

/**
 * Marks the user as seen now. Raw SQL on purpose: a Prisma update would also bump the automatic
 * updatedAt ("profile changed"). The WHERE clause skips the write if it already happened in the last
 * 50 seconds, so page loads and pings cost at most one write a minute per user.
 */
export async function touchPresence(userId: string) {
  await prisma.$executeRaw`
    UPDATE "users" SET "lastSeenAt" = now()
    WHERE "userId" = ${userId}::uuid
      AND ("lastSeenAt" IS NULL OR "lastSeenAt" < now() - interval '50 seconds')`
}

export type Presence = "online" | "away" | "offline"

export function presenceOf(lastSeen: Date | null, now = Date.now()): Presence {
  if (!lastSeen) return "offline"
  const ago = now - lastSeen.getTime()
  return ago < ONLINE_MS ? "online" : ago < AWAY_MS ? "away" : "offline"
}

/** "active now", "last seen 5 min ago", "last seen yesterday", … in the dictionary's language. */
export function lastSeenText(
  t: Dict,
  lastSeen: Date | null,
  now = Date.now(),
) {
  const l = t.users.lastSeen
  if (!lastSeen) return l.never
  const minutes = Math.floor((now - lastSeen.getTime()) / 60_000)
  if (minutes < 2) return l.now
  if (minutes < 60) return l.minutes(minutes)
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return l.hours(hours)
  const days = Math.floor(hours / 24)
  return days === 1 ? l.yesterday : l.days(days)
}
