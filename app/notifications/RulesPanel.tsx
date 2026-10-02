"use client"

// app/notifications/RulesPanel.tsx: "My alerts". The user's alert rules (switch on/off, delete), a form to
// add one (pick a type, then a few settings), and for admins a "Run checks now" button for testing.
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BellPlus, Boxes, Megaphone, Play, Trash2, TrendingDown, type LucideIcon } from "lucide-react"
import { useT } from "../lib/i18n/client"
import { describeRule } from "../lib/alerts/render"
import type { AlertTypeName, StoreScope } from "../lib/alerts/types"
import { cx } from "../bi/_components/ui"
import { createRule, deleteRule, runChecksNow, setRuleActive, type RuleInput } from "./actions"

interface Option {
  key: string
  label: string
}

interface Props {
  rules: { id: string; type: string; params: unknown; active: boolean }[]
  stores: { orgId: number; name: string }[]
  chains: Option[]
  brands: Option[]
  isAdmin: boolean
}

const ICONS: Record<AlertTypeName, LucideIcon> = { SALES_DROP: TrendingDown, OUT_OF_STOCK: Boxes, CAMPAIGN: Megaphone }
const TONES: Record<AlertTypeName, string> = {
  SALES_DROP: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  OUT_OF_STOCK: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  CAMPAIGN: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
}

const field =
  "h-9 w-full rounded-lg border border-neutral-200 bg-white px-2.5 text-sm text-neutral-900 focus:ring-2 focus:ring-brand-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
const labelCls = "mb-1 block text-[11px] font-semibold tracking-wider text-neutral-500 uppercase dark:text-neutral-400"

export default function RulesPanel({ rules, stores, chains, brands, isAdmin }: Props) {
  const t = useT()
  const r = t.alerts.rules
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [adding, setAdding] = useState(rules.length === 0)

  const names = {
    stores: new Map(stores.map((s) => [s.orgId, s.name])),
    chains: new Map(chains.map((c) => [c.key, c.label])),
    brands: new Map(brands.map((b) => [b.key, b.label])),
  }

  const run = () =>
    startTransition(async () => {
      const res = await runChecksNow()
      if (res.ok) toast.success(res.message)
      else toast.error(res.message)
      router.refresh()
    })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-xs text-neutral-500 dark:text-neutral-400">{r.schedule}</p>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={run}
              disabled={pending}
              title={r.runHint}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <Play className={cx("size-3.5", pending && "animate-pulse")} />
              {r.runNow}
            </button>
          )}
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 dark:bg-brand-500 dark:hover:bg-brand-400"
            >
              <BellPlus className="size-3.5" />
              {r.add}
            </button>
          )}
        </div>
      </div>

      {adding && <AddRule stores={stores} chains={chains} brands={brands} onDone={() => setAdding(false)} canCancel={rules.length > 0} />}

      {rules.length === 0 && !adding ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 px-6 py-10 text-center text-sm text-neutral-500 dark:border-neutral-700">{r.none}</p>
      ) : (
        <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
          {rules.map((rule) => {
            const type = rule.type as AlertTypeName
            const Icon = ICONS[type]
            return (
              <li key={rule.id} className={cx("flex items-center gap-3 px-5 py-3.5", !rule.active && "opacity-60")}>
                <span className={cx("inline-flex size-9 shrink-0 items-center justify-center rounded-xl", TONES[type])}>
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100">{r.types[type]?.title ?? type}</span>
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400">{describeRule(rule, t, names)}</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={rule.active}
                  aria-label={rule.active ? r.on : r.off}
                  onClick={() => startTransition(async () => { await setRuleActive(rule.id, !rule.active); router.refresh() })}
                  className={cx(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                    rule.active ? "bg-brand-600 dark:bg-brand-500" : "bg-neutral-300 dark:bg-neutral-700",
                  )}
                >
                  <span className={cx("inline-block size-4 rounded-full bg-white shadow transition-transform", rule.active ? "translate-x-[18px]" : "translate-x-0.5")} />
                </button>
                <button
                  type="button"
                  aria-label={r.delete}
                  title={r.delete}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteRule(rule.id)
                      toast.success(r.deleted)
                      router.refresh()
                    })
                  }
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ---------- add form ----------

function AddRule({
  stores,
  chains,
  brands,
  onDone,
  canCancel,
}: {
  stores: Props["stores"]
  chains: Option[]
  brands: Option[]
  onDone: () => void
  canCancel: boolean
}) {
  const t = useT()
  const r = t.alerts.rules
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [type, setType] = useState<AlertTypeName>("SALES_DROP")
  // Scope as one select value: "all", "chain:<key>" or "store:<orgId>"
  const [scope, setScope] = useState("all")
  const [threshold, setThreshold] = useState(20)
  const [period, setPeriod] = useState<"yesterday" | "mtd">("yesterday")
  const [noosOnly, setNoosOnly] = useState(false)
  const [brand, setBrand] = useState("")
  const [starts, setStarts] = useState(true)
  const [ends, setEnds] = useState(true)

  const parsedScope = (): StoreScope =>
    scope.startsWith("chain:") ? { kind: "chain", chain: scope.slice(6) } : scope.startsWith("store:") ? { kind: "store", orgId: Number(scope.slice(6)) } : { kind: "all" }

  const save = () =>
    startTransition(async () => {
      const input: RuleInput =
        type === "SALES_DROP"
          ? { type, params: { scope: parsedScope(), threshold, period } }
          : type === "OUT_OF_STOCK"
            ? { type, params: { scope: parsedScope(), noosOnly, brand: brand || null } }
            : { type, params: { starts, ends } }
      const res = await createRule(input)
      if (!res.success) return void toast.error(res.error)
      toast.success(r.created)
      onDone()
      router.refresh()
    })

  const types: AlertTypeName[] = ["SALES_DROP", "OUT_OF_STOCK", "CAMPAIGN"]

  return (
    <div className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
      <div>
        <div className={labelCls}>{r.chooseType}</div>
        <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
          {types.map((k) => {
            const Icon = ICONS[k]
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={type === k}
                onClick={() => setType(k)}
                className={cx(
                  "flex cursor-pointer flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors",
                  type === k ? "border-brand-300 bg-brand-50/60 dark:border-brand-500/40 dark:bg-brand-500/10" : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800/60",
                )}
              >
                <span className={cx("inline-flex size-8 items-center justify-center rounded-lg", TONES[k])}>
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{r.types[k].title}</span>
                <span className="text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">{r.types[k].hint}</span>
              </button>
            )
          })}
        </div>
      </div>

      {type !== "CAMPAIGN" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>{r.stores}</span>
            <select value={scope} onChange={(e) => setScope(e.target.value)} className={field}>
              <option value="all">{r.allStores}</option>
              <optgroup label={r.stores}>
                {chains.map((c) => (
                  <option key={c.key} value={`chain:${c.key}`}>
                    {r.chainStores(c.label)}
                  </option>
                ))}
              </optgroup>
              <optgroup label={r.oneStore}>
                {stores.map((s) => (
                  <option key={s.orgId} value={`store:${s.orgId}`}>
                    {s.name.replace(/\s+/g, " ").trim()}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>

          {type === "SALES_DROP" ? (
            <label className="block">
              <span className={labelCls}>{r.period}</span>
              <select value={period} onChange={(e) => setPeriod(e.target.value as "yesterday" | "mtd")} className={field}>
                <option value="yesterday">{r.periodOptions.yesterday}</option>
                <option value="mtd">{r.periodOptions.mtd}</option>
              </select>
            </label>
          ) : (
            <label className="block">
              <span className={labelCls}>{r.brand}</span>
              <select value={brand} onChange={(e) => setBrand(e.target.value)} className={field}>
                <option value="">{r.anyBrand}</option>
                {brands.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      {type === "SALES_DROP" && (
        <div>
          <div className={labelCls}>{r.threshold}</div>
          <div className="flex flex-wrap gap-1.5">
            {[10, 15, 20, 30, 40].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setThreshold(n)}
                aria-pressed={threshold === n}
                className={cx(
                  "cursor-pointer rounded-full px-3 py-1 text-xs font-semibold tabular-nums transition-colors",
                  threshold === n ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300",
                )}
              >
                −{n}%
              </button>
            ))}
          </div>
        </div>
      )}

      {type === "OUT_OF_STOCK" && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
          <input type="checkbox" checked={noosOnly} onChange={(e) => setNoosOnly(e.target.checked)} className="size-4 accent-[var(--color-brand-600)]" />
          {r.noosOnly}
        </label>
      )}

      {type === "CAMPAIGN" && (
        <div className="flex flex-wrap gap-4 text-sm text-neutral-700 dark:text-neutral-200">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={starts} onChange={(e) => setStarts(e.target.checked)} className="size-4 accent-[var(--color-brand-600)]" />
            {r.starts}
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={ends} onChange={(e) => setEnds(e.target.checked)} className="size-4 accent-[var(--color-brand-600)]" />
            {r.ends}
          </label>
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
        {canCancel && (
          <button type="button" onClick={onDone} className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800">
            {t.common.cancel}
          </button>
        )}
        <button
          type="button"
          onClick={save}
          disabled={pending || (type === "CAMPAIGN" && !starts && !ends)}
          className="cursor-pointer rounded-lg bg-brand-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-400"
        >
          {r.save}
        </button>
      </div>
    </div>
  )
}
