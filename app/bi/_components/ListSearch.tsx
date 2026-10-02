"use client"

// app/bi/_components/ListSearch.tsx
// Search box for the product lists (top products, stock alerts): filters the loaded list by product name
// or style number. Case and accents don't matter ("celes" finds "Çelës"); every word must match.
import { Search, X } from "lucide-react"
import { useT } from "@/app/lib/i18n/client"

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()

/** Builds the matcher once per query; an empty query matches everything. */
export function productMatcher(query: string) {
  const words = fold(query).replace(/#/g, " ").split(/\s+/).filter(Boolean)
  if (words.length === 0) return () => true
  return (p: { productName: string; styleNumber: string | null }) => {
    const text = fold(`${p.productName} ${p.styleNumber ?? ""}`)
    return words.every((w) => text.includes(w))
  }
}

export default function ListSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useT()
  return (
    <div className="relative border-b border-neutral-100 px-5 py-2 dark:border-neutral-800">
      <Search className="pointer-events-none absolute top-1/2 left-7.5 size-3.5 -translate-y-1/2 text-neutral-400" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onChange("")}
        placeholder={t.bi.search.placeholder}
        aria-label={t.bi.search.placeholder}
        className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-1.5 pr-8 pl-8 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:focus:bg-neutral-900 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t.bi.search.clear}
          title={t.bi.search.clear}
          className="absolute top-1/2 right-7 inline-flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

/** Shown in place of the list when the search finds nothing */
export function NoMatch({ query }: { query: string }) {
  const t = useT()
  return <p className="px-5 py-8 text-center text-sm text-neutral-500">{t.bi.search.none(query.trim())}</p>
}
