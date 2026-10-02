// app/lib/alerts/scheduler.ts
// Starts the alert checks inside the Next.js server process (called once from instrumentation.ts), so
// no extra pm2 process is needed. First round a minute after start, then every ALERTS_INTERVAL_MINUTES
// (default 30). The engine itself skips rounds at night and never runs two at once.
// Turn it off with ALERTS_ENABLED=false in .env.
import { runAlertRound } from "./engine"

const g = globalThis as unknown as { __alertsTimer?: ReturnType<typeof setInterval> }

export function startAlertScheduler() {
  if (g.__alertsTimer) return // dev reloads can import this twice
  if (process.env.ALERTS_ENABLED === "false") {
    console.log("[alerts] disabled (ALERTS_ENABLED=false)")
    return
  }
  const minutes = Number(process.env.ALERTS_INTERVAL_MINUTES) || 30

  const round = async () => {
    const r = await runAlertRound()
    if (r.skipped) return
    console.log(`[alerts] ${r.rules} rules · ${r.notifications} notifications · ${r.ms} ms${r.errors.length ? ` · errors: ${r.errors.join("; ")}` : ""}`)
  }

  setTimeout(() => void round(), 60_000)
  g.__alertsTimer = setInterval(() => void round(), minutes * 60_000)
  console.log(`[alerts] checks every ${minutes} min (07:00–22:00 Kosovo time)`)
}
