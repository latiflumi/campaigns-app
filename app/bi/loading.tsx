// app/bi/loading.tsx: shown while a BI page fetches from the ERP
import { SkeletonCard } from "./_components/ui"
import { getT } from "@/app/lib/i18n/server"

export default async function Loading() {
  const t = await getT()
  return (
    <div className="mx-auto max-w-7xl space-y-6" aria-busy="true" aria-label={t.common.loading}>
      <div className="space-y-2">
        <div className="h-3 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-8 w-56 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <SkeletonCard height="h-14" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => <SkeletonCard key={i} height="h-28" />)}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SkeletonCard height="h-80" className="lg:col-span-2" />
        <SkeletonCard height="h-80" />
      </div>
    </div>
  )
}
