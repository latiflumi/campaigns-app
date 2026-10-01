"use client"

// app/bi/_components/FilterBar.tsx
// Quick period presets, the date picker (any period vs any comparison), store chain, plus the product
// filter (gender / season / brand).
// Changing a filter updates the URL; the server page re-renders with it.
import { useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Loader2, X } from "lucide-react"
import { PRESETS, QUICK_PRESETS, filterQuery, type BiFilters, type Preset, type UrlFilters } from "@/app/lib/bi/filters"
import type { ProductOptions } from "@/app/lib/bi/attributes"
import DateRangePicker from "./DateRangePicker"
import FilterPicker from "./FilterPicker"
import { cx } from "./ui"
import { useT } from "@/app/lib/i18n/client"
import { useBiPending } from "./BiPending"

interface Props {
  filters: BiFilters
  /** Store chains (from the store names); omitted on a single store page */
  brands?: { key: string; label: string }[]
  /** Product filter options; null when erp-api could not load them */
  productOptions?: ProductOptions | null
}

function Segmented<T extends string>({ options, value, onChange, id }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; id: string }) {
  return (
    <div role="radiogroup" className="flex max-w-full gap-0.5 overflow-x-auto rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800/70">
      {options.map((o) => {
        const active = o.id === value
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={cx(
              "relative shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
              active ? "text-neutral-900 dark:text-white" : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-neutral-200/80 dark:bg-neutral-900 dark:ring-neutral-700"
                transition={{ type: "spring", bounce: 0.18, duration: 0.4 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function FilterBar({ filters, brands, productOptions }: Props) {
  const router = useRouter()
  const t = useT()
  const pathname = usePathname()
  // Share the page's transition when there is one, so the cards dim while loading too
  const shared = useBiPending()
  const [localPending, localStart] = useTransition()
  const pending = shared?.pending ?? localPending
  const startTransition = shared?.start ?? localStart

  const update = (next: Partial<UrlFilters>) =>
    startTransition(() => router.push(`${pathname}?${filterQuery({ ...filters, ...next })}`, { scroll: false }))

  const productActive = filters.gender !== "all" || filters.season !== "all" || filters.pbrand !== "all"

  return (
    <div className="space-y-2 rounded-2xl border border-neutral-200 bg-white/90 p-3 shadow-xs backdrop-blur-md lg:sticky lg:top-[4.75rem] lg:z-30 dark:border-neutral-800 dark:bg-neutral-900/90">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <Segmented
          id="period"
          options={PRESETS.filter((p) => (QUICK_PRESETS as readonly string[]).includes(p.id)).map((p) => ({ id: p.id, label: t.bi.presets[p.id] }))}
          value={filters.period as Preset}
          onChange={(period: Preset) => update({ period })}
        />
        <DateRangePicker value={filters} onApply={(v) => update(v)} />
        {brands && (
          <FilterPicker
            label={t.bi.filter.storeChain}
            allLabel={t.bi.filter.allStores}
            value={filters.brand}
            groups={[{ options: brands.map((b) => ({ value: b.key, label: t.bi.filter.chainStores(b.label) })) }]}
            onChange={(brand) => update({ brand })}
            className="lg:w-48"
          />
        )}
        {pending && <Loader2 className="size-4 shrink-0 animate-spin text-neutral-400 lg:ml-auto" aria-label={t.bi.filter.loading} />}
      </div>
      {productOptions && (
        <div className="grid grid-cols-2 gap-2 border-t border-neutral-100 pt-2 sm:flex sm:items-center dark:border-neutral-800">
          <span className="col-span-2 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase sm:mr-1">{t.bi.filter.products}</span>
          <FilterPicker label={t.bi.filter.gender} allLabel={t.bi.filter.allGenders} value={filters.gender} groups={[{ options: productOptions.genders }]} onChange={(gender) => update({ gender })} className="sm:w-40" />
          <FilterPicker label={t.bi.filter.season} allLabel={t.bi.filter.allSeasons} value={filters.season} groups={productOptions.seasons} onChange={(season) => update({ season })} className="sm:w-52" />
          <FilterPicker label={t.bi.filter.productBrand} allLabel={t.bi.filter.allBrands} value={filters.pbrand} groups={[{ options: productOptions.brands }]} onChange={(pbrand) => update({ pbrand })} className="col-span-2 sm:w-48" />
          {productActive && (
            <button
              type="button"
              onClick={() => update({ gender: "all", season: "all", pbrand: "all" })}
              className="col-span-2 inline-flex h-9 cursor-pointer items-center justify-center gap-1 rounded-xl px-3 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 sm:col-span-1 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            >
              <X className="size-3.5" />
              {t.bi.filter.clear}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
