"use client"

// app/bi/_components/DateRangePicker.tsx
// Period + comparison picker: presets or any custom range, compared with the same dates last year,
// the same weekdays last year, the previous period, or any custom range. Changes apply on "Apply".
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ArrowRight, CalendarDays, ChevronDown } from "lucide-react"
import {
  COMPARES,
  MAX_DAYS,
  PRESETS,
  comparisonRange,
  formatRange,
  presetRange,
  rangeDays,
  rangeError,
  todayIso,
  type Compare,
  type Period,
  type Preset,
  type RangeError,
} from "@/app/lib/bi/filters"
import { cx } from "./ui"
import { useT } from "@/app/lib/i18n/client"

export interface PickerValue {
  period: Period
  from: string
  to: string
  compare: Compare
  cmpFrom: string
  cmpTo: string
}

const dateInput =
  "h-9 w-full min-w-0 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm text-neutral-900 tabular-nums focus:ring-2 focus:ring-brand-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:[color-scheme:dark]"

function DateFields({ from, to, max, onChange, label }: { from: string; to: string; max: string; onChange: (from: string, to: string) => void; label: string }) {
  const t = useT()
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
      <input type="date" aria-label={t.bi.picker.start(label)} className={dateInput} value={from} max={max} onChange={(e) => onChange(e.target.value, to)} />
      <ArrowRight className="size-3.5 text-neutral-400" aria-hidden />
      <input type="date" aria-label={t.bi.picker.end(label)} className={dateInput} value={to} max={max} onChange={(e) => onChange(from, e.target.value)} />
    </div>
  )
}

export default function DateRangePicker({ value, onApply }: { value: PickerValue; onApply: (v: PickerValue) => void }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const boxRef = useRef<HTMLDivElement>(null)

  // Start from the applied value every time the picker opens
  const toggle = () => {
    if (!open) setDraft(value)
    setOpen(!open)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const today = todayIso()
  const errText = (e: RangeError | null) => (e === "both" ? t.bi.picker.errBoth : e === "order" ? t.bi.picker.errOrder : e === "max" ? t.bi.picker.errMax(MAX_DAYS) : null)
  const periodError = errText(rangeError(draft.from, draft.to)) ?? (draft.from > today ? t.bi.picker.errFuture : null)
  const cmp =
    draft.compare === "custom"
      ? { from: draft.cmpFrom, to: draft.cmpTo }
      : periodError
        ? null
        : comparisonRange(draft.from, draft.to, draft.compare)
  const cmpError = draft.compare === "custom" ? errText(rangeError(draft.cmpFrom, draft.cmpTo)) : null
  const error = periodError ?? cmpError
  // Ranges are cut off at today, like the server does
  const effTo = draft.to > today ? today : draft.to

  const pickPreset = (p: Preset) => setDraft({ ...draft, period: p, ...presetRange(p) })
  const setPeriod = (from: string, to: string) => setDraft({ ...draft, period: "custom", from, to })
  const setCompare = (compare: Compare) => {
    if (compare !== "custom" || draft.compare === "custom") return setDraft({ ...draft, compare })
    // Switching to custom: start from what "same dates last year" would be
    const seed = rangeError(draft.from, draft.to) ? { from: draft.cmpFrom, to: draft.cmpTo } : comparisonRange(draft.from, draft.to, "ly")
    setDraft({ ...draft, compare, cmpFrom: seed.from, cmpTo: seed.to })
  }

  const apply = () => {
    if (error || !cmp) return
    onApply({ ...draft, to: effTo, cmpFrom: cmp.from, cmpTo: cmp.to })
    setOpen(false)
  }

  const active = value.period === "custom" || !["7d", "30d", "mtd", "qtd", "ytd"].includes(value.period) || value.compare !== "ly"

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cx(
          "flex h-9 w-full cursor-pointer items-center gap-2 rounded-xl border px-3 text-left text-xs font-semibold transition-colors lg:w-auto",
          active
            ? "border-brand-200 bg-brand-50/60 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
            : "border-neutral-200 bg-neutral-50/60 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-200 dark:hover:bg-neutral-800",
        )}
      >
        <CalendarDays className="size-4 shrink-0" />
        <span className="min-w-0 truncate">
          {formatRange(t, value.from, value.to)}
          <span className="font-normal opacity-70"> {t.bi.picker.vs} {formatRange(t, value.cmpFrom, value.cmpTo)}</span>
        </span>
        <ChevronDown className={cx("ml-auto size-4 shrink-0 opacity-60 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={t.bi.picker.choose}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-11 left-0 z-50 w-[min(40rem,calc(100vw-2rem))] origin-top-left overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl lg:right-0 lg:left-auto lg:origin-top-right dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="grid sm:grid-cols-[11rem_minmax(0,1fr)]">
              <ul className="flex gap-1 overflow-x-auto border-b border-neutral-100 p-2 sm:flex-col sm:overflow-visible sm:border-r sm:border-b-0 dark:border-neutral-800">
                {PRESETS.map((p) => (
                  <li key={p.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => pickPreset(p.id)}
                      className={cx(
                        "w-full cursor-pointer rounded-lg px-3 py-1.5 text-left text-xs font-medium whitespace-nowrap transition-colors",
                        draft.period === p.id
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                          : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
                      )}
                    >
                      {t.bi.presets[p.id]}
                    </button>
                  </li>
                ))}
                <li className="shrink-0">
                  <span
                    className={cx(
                      "block rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap",
                      draft.period === "custom" ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300" : "text-neutral-400",
                    )}
                  >
                    {t.bi.custom}
                  </span>
                </li>
              </ul>

              <div className="space-y-4 p-4">
                <section>
                  <h3 className="mb-2 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">{t.bi.picker.period}</h3>
                  <DateFields label={t.bi.picker.period} from={draft.from} to={draft.to} max={today} onChange={setPeriod} />
                </section>

                <section>
                  <h3 className="mb-2 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">{t.bi.picker.compareWith}</h3>
                  <div role="radiogroup" className="grid gap-1 sm:grid-cols-2">
                    {COMPARES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        role="radio"
                        aria-checked={draft.compare === c.id}
                        onClick={() => setCompare(c.id)}
                        className={cx(
                          "cursor-pointer rounded-lg border px-3 py-2 text-left transition-colors",
                          draft.compare === c.id
                            ? "border-brand-300 bg-brand-50/60 dark:border-brand-500/40 dark:bg-brand-500/10"
                            : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800/60",
                        )}
                      >
                        <span className={cx("block text-xs font-semibold", draft.compare === c.id ? "text-brand-700 dark:text-brand-300" : "text-neutral-800 dark:text-neutral-100")}>{t.bi.compares[c.id].label}</span>
                        <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">{t.bi.compares[c.id].hint}</span>
                      </button>
                    ))}
                  </div>
                  {draft.compare === "custom" && (
                    <div className="mt-2">
                      <DateFields label={t.bi.picker.comparison} from={draft.cmpFrom} to={draft.cmpTo} max={today} onChange={(cmpFrom, cmpTo) => setDraft({ ...draft, cmpFrom, cmpTo })} />
                    </div>
                  )}
                </section>

                <div className="flex flex-col gap-3 border-t border-neutral-100 pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                  <p className={cx("text-xs", error ? "text-red-600 dark:text-red-400" : "text-neutral-500 dark:text-neutral-400")}>
                    {error ??
                      (cmp && (
                        <>
                          <span className="font-medium text-neutral-800 dark:text-neutral-100">{formatRange(t, draft.from, effTo)}</span>
                          {` ${t.bi.picker.vs} `}
                          <span className="font-medium text-neutral-800 dark:text-neutral-100">{formatRange(t, cmp.from, cmp.to)}</span>
                          {rangeDays(draft.from, effTo) !== rangeDays(cmp.from, cmp.to) && (
                            <span className="text-amber-700 dark:text-amber-400">
                              {" "}
                              · {t.bi.picker.days(rangeDays(draft.from, effTo), rangeDays(cmp.from, cmp.to))}
                            </span>
                          )}
                        </>
                      ))}
                  </p>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="h-9 cursor-pointer rounded-lg px-3 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={apply}
                      disabled={!!error}
                      className="h-9 cursor-pointer rounded-lg bg-brand-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-400"
                    >
                      {t.common.apply}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
