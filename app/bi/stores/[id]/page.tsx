// app/bi/stores/[id]/page.tsx: one store's BI view
import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Megaphone } from "lucide-react"
import { requireSession } from "@/app/lib/session"
import { prisma } from "@/app/lib/prisma"
import { getBiAttributes, getBiCategories, getBiProducts, getBiStores, getBiSummary, settle } from "@/app/lib/bi/erp"
import { brandOf, locationOf } from "@/app/lib/bi/brands"
import { keepSelected, productFilterText, productOptions } from "@/app/lib/bi/attributes"
import { compareLabel, compareParams, filterQuery, parseFilters, productFilter, rangeDays } from "@/app/lib/bi/filters"
import { formatDay } from "../../../campaigns/_components/campaign-utils"
import { StatusPill } from "../../../campaigns/_components/parts"
import FilterBar from "../../_components/FilterBar"
import { BiPendingProvider, PendingArea } from "../../_components/BiPending"
import { CategoriesVsChain, KpiRow, ProductList, SegmentsSection, StockAlertsSection, TOP_PRODUCTS, TrendSection } from "../../_components/sections"
import { Card, CardHeader, ErrorCard, SkeletonCard, growth } from "../../_components/ui"
import { getT } from "@/app/lib/i18n/server"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t.nav.bi }
}

export const dynamic = "force-dynamic"


export default async function BiStorePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireSession()
  const t = await getT()
  const st = t.bi.store
  const { id } = await params
  const orgId = Number(id)
  if (!Number.isInteger(orgId) || orgId <= 0) notFound()

  const filters = parseFilters(await searchParams)
  const { from, to } = filters
  const compare = compareParams(filters)
  const stores = String(orgId)
  const pf = productFilter(filters)
  const range = { from, to, ...compare, stores, ...pf }
  const chainRange = { from, to, ...compare, stores: "", ...pf }

  const [meta, summary, chain, categories, chainCategories, products, attrs, allAttrs] = await Promise.all([
    settle(getBiStores()),
    settle(getBiSummary(range)),
    settle(getBiSummary(chainRange)), // same request as the overview, so usually cached
    settle(getBiCategories(range)),
    settle(getBiCategories(chainRange)),
    settle(getBiProducts({ from, to, stores, ...pf }, TOP_PRODUCTS)),
    settle(getBiAttributes(stores, pf)), // only what this store sold, narrowed by the other filters
    settle(getBiAttributes()),
  ])
  const allOptions = allAttrs.data ? productOptions(allAttrs.data, t) : null
  const options = attrs.data ? keepSelected(productOptions(attrs.data, t), allOptions, filters) : allOptions
  const productText = productFilterText(filters, allOptions)

  const store = meta.data?.find((s) => s.orgId === orgId)
  if (meta.data && !store) notFound()
  const name = store?.name ?? st.fallbackName(orgId)

  // Rank by like-for-like growth across the chain
  const ranked = (chain.data?.stores ?? [])
    .filter((r) => r.lfl)
    .map((r) => ({ orgId: r.orgId, g: growth(r.current.sales, r.previous.sales) ?? -Infinity }))
    .sort((a, b) => b.g - a.g)
  const rank = ranked.findIndex((r) => r.orgId === orgId)

  // Campaigns live or scheduled in this store (campaigns store the ERP store name)
  const dbStore = await prisma.store.findUnique({ where: { id: orgId }, select: { name: true } })
  const campaigns = dbStore
    ? await prisma.campaign.findMany({
        where: { participatingStores: { has: dbStore.name }, status: { in: ["ACTIVE", "SCHEDULED"] } },
        select: { id: true, name: true, status: true, startDate: true, endDate: true },
        orderBy: { startDate: "asc" },
        take: 6,
      })
    : []

  const compareText = compareLabel(filters, t)
  const query = filterQuery(filters)
  const row = summary.data?.stores.find((r) => r.orgId === orgId)

  return (
    <BiPendingProvider>
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Link href={`/bi?${query}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
          <ArrowLeft className="size-4" />
          {st.back}
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase dark:text-brand-400">{brandOf(name)}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">{locationOf(name)}</h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {store?.firstSaleDate ? st.tradingSince(formatDay(t, store.firstSaleDate, true)) : st.noSales}
              {store && st.unitsInStock(store.stockUnits.toLocaleString("de-DE"))}
              {row && !row.lfl && st.notLfl}
              {productText && t.bi.productsLabel(productText)}
            </p>
          </div>
          {rank >= 0 && (
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              {st.rank(rank + 1, ranked.length)}
            </span>
          )}
        </div>
      </div>

      <FilterBar filters={filters} productOptions={options} />

      <PendingArea className="space-y-6">

      {summary.data ? (
        <KpiRow current={summary.data.totals.current} previous={summary.data.totals.previous} compareText={compareText} salesBasis={summary.data.salesBasis} />
      ) : (
        <ErrorCard message={summary.error!} />
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Suspense fallback={<SkeletonCard height="h-80" />}>
            <TrendSection range={range} compareText={compareText} />
          </Suspense>
        </div>
        <Card>
          <CardHeader icon={Megaphone} title={st.campaigns} sub={st.campaignsSub} />
          {campaigns.length === 0 ? (
            <p className="px-5 py-8 text-sm text-neutral-500 dark:text-neutral-400">{st.noCampaigns}</p>
          ) : (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {campaigns.map((c) => (
                <li key={c.id}>
                  <Link href={`/campaigns/${c.id}`} className="block px-5 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{c.name}</span>
                      <StatusPill status={c.status} />
                    </div>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      {c.startDate ? formatDay(t, c.startDate.toISOString()) : st.noStart} → {c.endDate ? formatDay(t, c.endDate.toISOString(), true) : st.openEnded}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {products.data ? <ProductList products={products.data} title={t.bi.products.titleHere} days={rangeDays(from, to)} /> : <ErrorCard message={products.error!} />}
        <Suspense fallback={<SkeletonCard height="h-80" />}>
          <StockAlertsSection stores={stores} showStore={false} query={query} filter={pf} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {categories.data && chainCategories.data ? (
          <CategoriesVsChain store={categories.data} chain={chainCategories.data} />
        ) : (
          <ErrorCard message={(categories.error ?? chainCategories.error)!} />
        )}
        <div className="min-w-0 lg:col-span-2">
          <Suspense fallback={<SkeletonCard height="h-72" />}>
            <SegmentsSection range={range} compareText={compareText} />
          </Suspense>
        </div>
      </div>
      </PendingArea>
    </div>
    </BiPendingProvider>
  )
}
