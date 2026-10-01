"use client"

// app/bi/_components/BiPending.tsx
// Shares the filter bar's navigation transition with the page, so every card below the filters dims and
// pulses while a new date range or filter loads (the spinner in the filter bar stays too).
import { createContext, useContext, useTransition, type TransitionStartFunction } from "react"
import { cx } from "./ui"

const PendingContext = createContext<{ pending: boolean; start: TransitionStartFunction } | null>(null)

export function BiPendingProvider({ children }: { children: React.ReactNode }) {
  const [pending, start] = useTransition()
  return <PendingContext.Provider value={{ pending, start }}>{children}</PendingContext.Provider>
}

/** null outside a BiPendingProvider; the filter bar then uses its own transition. */
export const useBiPending = () => useContext(PendingContext)

/** Wraps the page's cards: dimmed, pulsing and not clickable while new data loads. */
export function PendingArea({ children, className }: { children: React.ReactNode; className?: string }) {
  const pending = useBiPending()?.pending ?? false
  return (
    <div
      aria-busy={pending}
      className={cx(
        "transition-[opacity,filter] duration-300",
        pending && "pointer-events-none animate-pulse opacity-60 saturate-50 motion-reduce:animate-none",
        className,
      )}
    >
      {children}
    </div>
  )
}
