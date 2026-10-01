"use client"

// app/bi/_components/FilterPicker.tsx
// Styled replacement for the native <select> in the BI filter bar. Desktop: a popover under the button
// with search, option groups and a sales-share bar per option. Phones: the same list as a bottom sheet.
// Keyboard: ↑/↓ move, Enter picks, Esc closes; typing goes straight into the search box.
import { useEffect, useId, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"
import { Check, ChevronDown, Search } from "lucide-react"
import type { Option, OptionGroup } from "@/app/lib/bi/attributes"
import { useT } from "@/app/lib/i18n/client"
import { cx } from "./ui"

interface Props {
  label: string
  allLabel: string
  value: string
  groups: OptionGroup[]
  onChange: (value: string) => void
  className?: string
  /** Show the search box (on by default when there are more than 8 options) */
  searchable?: boolean
}

const one = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 })
const isPhone = () => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches

export default function FilterPicker({ label, allLabel, value, groups, onChange, className, searchable }: Props) {
  const t = useT()
  const f = t.bi.filter
  const id = useId()
  const [open, setOpen] = useState(false)
  const [sheet, setSheet] = useState(false) // phone layout, decided when opening
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const all = groups.flatMap((g) => g.options)
  const selected = all.find((o) => o.value === value)
  const withSearch = searchable ?? all.length > 8
  // Lists with sales shares (product filters) flag options that sold nothing in this selection
  const hasShares = all.some((o) => o.share !== undefined)

  // Visible options: "all" first, then each group filtered by the search text
  const q = query.trim().toLowerCase()
  const visible = useMemo(
    () => groups.map((g) => ({ ...g, options: q ? g.options.filter((o) => o.label.toLowerCase().includes(q)) : g.options })).filter((g) => g.options.length > 0),
    [groups, q],
  )
  const flat: Option[] = useMemo(() => [...(q ? [] : [{ value: "all", label: allLabel }]), ...visible.flatMap((g) => g.options)], [visible, q, allLabel])

  const openPicker = () => {
    setRefocus(false)
    setSheet(isPhone())
    setQuery("")
    setActive(Math.max(0, [{ value: "all" }, ...all].findIndex((o) => o.value === value)))
    setOpen(true)
  }
  const [refocus, setRefocus] = useState(false)
  const close = (focusButton = true) => {
    setRefocus(focusButton)
    setOpen(false)
  }
  const pick = (v: string) => {
    if (v !== value) onChange(v)
    close()
  }

  // Close on a click outside the button and the panel (the sheet lives in <body>)
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) close(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [open])

  // Give focus back to the button after closing with the keyboard or a pick
  useEffect(() => {
    if (!open && refocus) buttonRef.current?.focus()
  }, [open, refocus])

  // Focus the search box (or the list) when opening; keep the active option in view
  useEffect(() => {
    if (!open) return
    if (withSearch && !sheet) searchRef.current?.focus()
    else listRef.current?.focus()
  }, [open, withSearch, sheet])
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" })
  }, [active])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault()
      close()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => Math.min(flat.length - 1, i + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (flat[active]) pick(flat[active].value)
    } else if (e.key === "Tab") {
      close(false)
    }
  }

  const optionId = (i: number) => `${id}-opt-${i}`
  const indexOf = new Map(flat.map((o, i) => [o.value, i]))
  const rowProps = (o: Option) => {
    const i = indexOf.get(o.value) ?? 0
    return {
      option: o,
      id: optionId(i),
      index: i,
      active: i === active,
      selected: o.value === value,
      flagUnsold: hasShares && o.value !== "all",
      unsoldText: f.notSoldHere,
      onHover: setActive,
      onPick: pick,
    }
  }

  const panel = (
    <motion.div
      ref={panelRef}
      initial={sheet ? { y: "100%" } : { opacity: 0, y: -4, scale: 0.98 }}
      animate={sheet ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
      exit={sheet ? { y: "100%" } : { opacity: 0, y: -4, scale: 0.98 }}
      transition={sheet ? { type: "spring", bounce: 0.1, duration: 0.35 } : { duration: 0.12 }}
      onKeyDown={onKey}
      className={cx(
        "z-[60] flex flex-col overflow-hidden border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900",
        sheet
          ? "fixed inset-x-0 bottom-0 max-h-[75vh] rounded-t-2xl pb-[env(safe-area-inset-bottom,0px)]"
          : "absolute top-11 left-0 max-h-[22rem] w-72 origin-top-left rounded-2xl",
      )}
    >
      {sheet && (
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="mx-auto h-1 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700" aria-hidden />
        </div>
      )}
      {sheet && <div className="px-4 pb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{label}</div>}
      {withSearch && (
        <label className="mx-2 mt-2 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 dark:border-neutral-700 dark:bg-neutral-800/60">
          <Search className="size-4 shrink-0 text-neutral-400" aria-hidden />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            placeholder={f.search}
            aria-label={f.search}
            aria-controls={`${id}-list`}
            aria-activedescendant={flat[active] ? optionId(active) : undefined}
            className="h-9 w-full bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100"
          />
        </label>
      )}
      <div
        ref={listRef}
        id={`${id}-list`}
        role="listbox"
        aria-label={label}
        tabIndex={-1}
        aria-activedescendant={flat[active] ? optionId(active) : undefined}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 outline-none"
      >
        {!q && <OptionRow {...rowProps({ value: "all", label: allLabel })} />}
        {visible.map((g, gi) => (
          <div key={g.label ?? `g${gi}`} role="group" aria-label={g.label}>
            {g.label && <div className="px-2.5 pt-2.5 pb-1 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase">{g.label}</div>}
            {g.options.map((o) => (
              <OptionRow key={o.value} {...rowProps(o)} />
            ))}
          </div>
        ))}
        {flat.length === 0 && <p className="px-3 py-6 text-center text-sm text-neutral-500">{f.noMatches}</p>}
      </div>
    </motion.div>
  )

  return (
    <div ref={rootRef} className={cx("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? close() : openPicker())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            openPicker()
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${selected?.label ?? allLabel}`}
        className={cx(
          "flex h-9 w-full cursor-pointer items-center gap-2 rounded-xl border bg-neutral-50/60 pr-2.5 pl-3 text-left text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none dark:bg-neutral-800/50",
          value !== "all"
            ? "border-brand-200 text-brand-700 dark:border-brand-500/30 dark:text-brand-300"
            : "border-neutral-200 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800",
        )}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? allLabel}</span>
        <ChevronDown className={cx("size-4 shrink-0 text-neutral-400 transition-transform", open && "rotate-180")} />
      </button>

      {/* Desktop: popover under the button */}
      <AnimatePresence>{open && !sheet && panel}</AnimatePresence>

      {/* Phones: bottom sheet over a dimmed page (in <body>, so the sticky filter bar can't trap it) */}
      {open &&
        sheet &&
        createPortal(
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[59] bg-black/40 backdrop-blur-[2px]"
              onClick={() => close(false)}
              aria-hidden
            />
            {panel}
          </>,
          document.body,
        )}
    </div>
  )
}

function OptionRow({
  option: o,
  id,
  index,
  active,
  selected,
  flagUnsold,
  unsoldText,
  onHover,
  onPick,
}: {
  option: Option
  id: string
  index: number
  active: boolean
  selected: boolean
  flagUnsold: boolean
  unsoldText: string
  onHover: (i: number) => void
  onPick: (value: string) => void
}) {
  return (
    <div
      id={id}
      data-index={index}
      role="option"
      aria-selected={selected}
      onPointerMove={() => onHover(index)}
      onClick={() => onPick(o.value)}
      className={cx(
        "grid cursor-pointer grid-cols-[minmax(0,1fr)_auto_1rem] items-center gap-3 rounded-lg px-2.5 py-2 text-sm sm:py-1.5",
        active && "bg-neutral-100 dark:bg-neutral-800",
        selected ? "font-semibold text-brand-700 dark:text-brand-300" : "text-neutral-700 dark:text-neutral-200",
      )}
    >
      <span className="min-w-0">
        <span className="block truncate">{o.label}</span>
        {o.share !== undefined ? (
          <span className="mt-1 block h-1 rounded-full bg-neutral-100 dark:bg-neutral-800">
            <span className="block h-full rounded-full bg-brand-400/80" style={{ width: `${Math.max(2, Math.min(100, o.share))}%` }} />
          </span>
        ) : (
          flagUnsold && <span className="block text-[10.5px] font-normal text-neutral-400">{unsoldText}</span>
        )}
      </span>
      <span className="text-[11px] font-normal text-neutral-400 tabular-nums">{o.share !== undefined ? `${one.format(o.share)}%` : ""}</span>
      {selected ? <Check className="size-4 text-brand-600 dark:text-brand-400" /> : <span />}
    </div>
  )
}
