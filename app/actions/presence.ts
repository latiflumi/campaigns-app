"use server"

// app/actions/presence.ts
// The "still here" ping from app/PresencePing.tsx. Uses getSession (not requireSession) so a background
// ping from an expired session does nothing instead of redirecting.
import { getSession } from "../lib/session"
import { touchPresence } from "../lib/presence"

export async function pingPresence() {
  const session = await getSession()
  if (session) await touchPresence(session.userId)
}
