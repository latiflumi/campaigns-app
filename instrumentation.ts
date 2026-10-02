// instrumentation.ts: runs once when the Next.js server starts.
// Starts the background alert checks (app/lib/alerts). Node.js runtime only, and not during `next build`.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (process.env.NEXT_PHASE === "phase-production-build") return
  const { startAlertScheduler } = await import("./app/lib/alerts/scheduler")
  startAlertScheduler()
}
