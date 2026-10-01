// app/bi/page.tsx: BI overview (chain or one brand)
import { Suspense } from "react"
import { requireSession } from "@/app/lib/session"
import { getBiAttributes, getBiCategories, getBiProducts, getBiStores, getBiSummary, settle } from "@/app/lib/bi/erp"
import { brandKey, brandOf } from "@/app/lib/bi/brands"
import { keepSelected, productFilterText, productOptions } from "@/app/lib/bi/attributes"
import { compareLabel, compareParams, filterQuery, formatRange, hasProductFilter, parseFilters, productFilter, rangeDays } from "@/app/lib/bi/filters"
import FilterBar from "./_components/FilterBar"
import { BiPendingProvider, PendingArea } from "./_components/BiPending"
import StoreTable from "./_components/StoreTable"
import { CategoryMix, Exceptions, KpiRow, ProductList, SegmentsSection, StockAlertsSection, TOP_PRODUCTS, TrendSection } from "./_components/sections"
import { ErrorCard, SkeletonCard } from "./_components/ui"
import { getT } from "@/app/lib/i18n/server"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: `${t.nav.bi} · ${t.bi.overview}` }
}

export const dynamic = "force-dynamic"


export default async function BiOverviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireSession()
  const t = await getT()
  const filters = parseFilters(await searchParams)
  const { from, to } = filters

  // Brands come from the store names (the ERP has no brand field)
  const [storesRes, allAttrs] = await Promise.all([settle(getBiStores()), settle(getBiAttributes())])
  const allStores = storesRes.data ?? []
  const pf = productFilter(filters)
  const brands = [...new Set(allStores.map((s) => brandOf(s.name)))].sort().map((label) => ({ key: brandKey(label), label }))
  const brandLabel = brands.find((b) => b.key === filters.brand)?.label
  const scoped = brandLabel ? allStores.filter((s) => brandKey(brandOf(s.name)) === filters.brand) : allStores
  // '' = every store; '0' = a brand with no stores (returns nothing rather than everything)
  const stores = brandLabel ? scoped.map((s) => s.orgId).join(",") || "0" : ""

  const range = { from, to, ...compareParams(filters), stores, ...pf }
  // Filter options for this selection: only what these stores sold, narrowed by the other product filters
  const narrowed = stores !== "" || hasProductFilter(pf)
  const [summary, categories, products, attrs] = await Promise.all([
    settle(getBiSummary(range)),
    settle(getBiCategories(range)),
    settle(getBiProducts({ from, to, stores, ...pf }, TOP_PRODUCTS)),
    narrowed ? settle(getBiAttributes(stores, pf)) : Promise.resolve(allAttrs),
  ])
  const allOptions = allAttrs.data ? productOptions(allAttrs.data, t) : null
  const options = attrs.data ? keepSelected(productOptions(attrs.data, t), allOptions, filters) : allOptions
  const productText = productFilterText(filters, allOptions)

  const compareText = compareLabel(filters, t)
  const query = filterQuery(filters)

  return (
    <BiPendingProvider>
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase dark:text-brand-400">{t.bi.eyebrow}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">{t.bi.overview}</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {brandLabel ? t.bi.storesOf(brandLabel) : t.bi.allStores} · {t.bi.nStores(scoped.length)}
          {productText ? t.bi.productsFiltered(productText) : t.bi.salesInclVat}
        </p>
      </div>

      <FilterBar filters={filters} brands={brands} productOptions={options} />

      <PendingArea className="space-y-6">

      {summary.data ? (
        <KpiRow
          current={summary.data.totals.current}
          previous={summary.data.totals.previous}
          lfl={summary.data.lfl}
          compareText={compareText}
          salesBasis={summary.data.salesBasis}
        />
      ) : (
        <ErrorCard message={summary.error!} />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Suspense fallback={<SkeletonCard height="h-80" />}>
            <TrendSection range={range} compareText={compareText} />
          </Suspense>
        </div>
        {summary.data && <Exceptions stores={summary.data.stores} totals={summary.data.totals.current} compareText={compareText} query={query} />}
      </div>

      {/* Full width: the table has many columns and shouldn't need a sideways scroll on desktop */}
      {summary.data ? <StoreTable rows={summary.data.stores} compareLabel={compareText} query={query} /> : <ErrorCard message={summary.error!} />}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {products.data ? <ProductList products={products.data} days={rangeDays(from, to)} /> : <ErrorCard message={products.error!} />}
        <Suspense fallback={<SkeletonCard height="h-80" />}>
          <StockAlertsSection stores={stores} showStore query={query} filter={pf} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {categories.data ? <CategoryMix data={categories.data} compareText={compareText} /> : <ErrorCard message={categories.error!} />}
        <div className="min-w-0 lg:col-span-2">
          <Suspense fallback={<SkeletonCard height="h-72" />}>
            <SegmentsSection range={range} compareText={compareText} />
          </Suspense>
        </div>
      </div>

      </PendingArea>

      <p className="max-w-3xl text-xs text-neutral-500 dark:text-neutral-400">
        {t.bi.footnote.sales}
        {hasProductFilter(pf) && t.bi.footnote.productFilter} {t.bi.footnote.lfl}{" "}
        {t.bi.footnote.view(formatRange(t, from, to), formatRange(t, filters.cmpFrom, filters.cmpTo))} {t.bi.footnote.lastYear}{" "}
        {t.bi.footnote.refresh}
      </p>
    </div>
    </BiPendingProvider>
  )
}
