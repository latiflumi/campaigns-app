// app/campaigns/[id]/page.tsx

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  ArrowLeft, 
  Calendar, 
  Store, 
  Tag, 
  DollarSign, 
  Mail, 
  FileText, 
  Clock, 
  Edit3, 
  Trash2,
  TrendingUp,
  PackageCheck,
  Percent,
  ShoppingBag,
  Layers,
  Building2
} from 'lucide-react'
import { 
  getCampaignDetailedAnalytics, 
  CampaignDetailedAnalytics 
} from '../../api/erp/actions'

import { getCampaignById, fetchStoresAction } from '../actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'PAUSED'

// Currency parsing & formatting helper
const parseCurrency = (val: string | number | null | undefined): number | null => {
  if (val === null || val === undefined || val === '') return null
  const parsed = typeof val === 'number' ? val : parseFloat(val)
  return isNaN(parsed) ? null : parsed
}

const formatCurrency = (val: number | string | null | undefined) => {
  const numericValue = parseCurrency(val)
  if (numericValue === null) return 'N/A'
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(numericValue)
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // 1. Fetch main campaign & Prisma stores in parallel
  const [campaign, stores] = await Promise.all([
    getCampaignById(id),
    fetchStoresAction(),
  ])

  if (!campaign) {
    notFound()
  }

  // 2. Build the Store Name -> ID lookup map directly from Prisma
  const storeNameToIdMap = new Map<string, number>(
    (stores || []).map((s) => [s.name, s.id])
  )

  // 3. Map participatingStores items (strings/numbers/objects) to numeric string IDs
  const storeIds = (campaign.participatingStores || [])
    .map((item: number | string | { id: number }) => {
      if (typeof item === 'number') return item.toString()
      if (typeof item === 'object' && item?.id) return item.id.toString()
      if (typeof item === 'string') {
        const foundId = storeNameToIdMap.get(item)
        return foundId ? foundId.toString() : null
      }
      return null
    })
    .filter((storeId): storeId is string => storeId !== null)

  const from = campaign.startDate
    ? new Date(campaign.startDate).toISOString().split('T')[0]
    : null

  const to = campaign.endDate
    ? new Date(campaign.endDate).toISOString().split('T')[0]
    : null

  // 4. Fetch detailed analytics using resolved numeric store IDs
  let analytics: CampaignDetailedAnalytics | null = null

  if (storeIds.length > 0 && from && to) {
    try {
      analytics = await getCampaignDetailedAnalytics(storeIds, from, to)
    } catch (error) {
      console.error(`⚠️ Detailed analytics API failed for campaign ${campaign.id}:`, error)
      analytics = null
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation & Actions Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6 border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <Link
            href="/campaigns"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kthehu te Kampanjat
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {campaign.name}
            </h1>
            <StatusBadge status={campaign.status as CampaignStatus} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/campaigns/${campaign.id}/edit`}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 transition-colors"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Ndrysho
          </Link>
          <button
            type="button"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-900/50 dark:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Fshi
          </button>
        </div>
      </div>

      {/* Analytics KPI Overview Cards */}
      {analytics?.totals && (
  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
    <MetricCard 
      title="Qarkullimi (€)" 
      value={formatCurrency(analytics.totals.grossRevenue)} 
      icon={<DollarSign className="w-4 h-4 text-emerald-600" />} 
    />
    <MetricCard 
      title="Gross Margin" 
      value={`${analytics.totals.grossMarginPct ?? 0}%`} 
      icon={<Percent className="w-4 h-4 text-emerald-500" />} 
    />
    <MetricCard 
      title="Markdown (%)" 
      value={`${analytics.totals.markdownPct ?? 0}%`} 
      icon={<Percent className="w-4 h-4 text-amber-500" />} 
    />
    <MetricCard 
      title="Njësi të Shitura" 
      value={analytics.totals.totalUnitsSold.toLocaleString('sq-AL')} 
      icon={<PackageCheck className="w-4 h-4 text-slate-600" />} 
    />
  </div>
)}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Subject Display */}
          {campaign.subject && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                <Mail className="w-3.5 h-3.5" />
                Subjekti / Titulli Promovues
              </div>
              <p className="text-base font-medium text-slate-800 dark:text-slate-200">
                {campaign.subject}
              </p>
            </div>
          )}
           {/* Store Performance Grid */}
          {analytics?.storeBreakdown && analytics.storeBreakdown.length > 0 && (
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Building2 className="w-5 h-5 text-slate-500" />
                Performanca sipas Dyqaneve
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.storeBreakdown.map((store) => (
                  <div key={store.OrgId} className="p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-2">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Store className="w-4 h-4 text-slate-400" />
                      {store.OrgName}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 block">Qarkullimi</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(store.grossRevenue)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Gross Margin (%)</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{store.grossMarginPct ?? 0}%</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Sasia E Shitur</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{store.unitsSold} njësi</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Mark Down (%)</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{store.markdownPct ?? 0}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Top Products Table */}
          {analytics?.topProducts && analytics.topProducts.length > 0 && (
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
                <ShoppingBag className="w-5 h-5 text-slate-500" />
                Produktet më të Shitura
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                  <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Artikulli</th>
                      <th className="px-4 py-3">Kategoria</th>
                      <th className="px-4 py-3 text-right">Sasia</th>
                      <th className="px-4 py-3 text-right">Qarkullimi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {analytics.topProducts.map((prod) => (
                      <tr key={prod.ArtikulliId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          <div>{prod.ProductName}</div>
                          <span className="text-xs font-mono text-slate-400">#{prod.StyleNumber}</span>
                        </td>
                        <td className="px-4 py-3 text-xs">{prod.CategoryName}</td>
                        <td className="px-4 py-3 text-right font-semibold">{prod.unitsSold}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(prod.grossRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Campaign Blueprint Content */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-4 shadow-sm">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
              <FileText className="w-5 h-5 text-slate-500" />
              Përmbajtja / Blueprint
            </h2>
            {campaign.content ? (
              <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm whitespace-pre-line leading-relaxed">
                {campaign.content}
              </div>
            ) : (
              <p className="text-sm italic text-slate-400">
                Nuk ka përmbajtje ose udhëzime të shkruara për këtë kampanjë.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Top Categories */}
          {analytics?.topCategories && analytics.topCategories.length > 0 && (
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Kategoritë Kryesore
              </h3>
              <div className="space-y-3">
                {analytics.topCategories.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-900 last:border-none">
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                        {cat.CategoryName}
                      </div>
                      <div className="text-slate-400 text-[11px]">{cat.unitsSold} njësi të shitura</div>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(cat.grossRevenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stores Included */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Store className="w-4 h-4" />
              Dyqanet Pjesëmarrëse ({campaign.participatingStores?.length || 0})
            </h3>
            {campaign.participatingStores && campaign.participatingStores.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {campaign.participatingStores.map((storeName: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/50"
                  >
                    {storeName}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">
                Kjo kampanjë nuk është e lidhur me asnjë dyqan specifik.
              </p>
            )}
          </div>

          {/* Campaign Details Sidebar */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Detajet e Kampanjës
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-900">
                <span className="text-slate-500 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" />
                  Lloji
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {campaign.type}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-900">
                <span className="text-slate-500 flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5" />
                  Buxheti
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(campaign.budget)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-900">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Data e Fillimit
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {campaign.startDate
                    ? new Date(campaign.startDate).toLocaleDateString('sq-AL')
                    : 'Paparacaktuar'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-900">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Data e Përfundimit
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {campaign.endDate
                    ? new Date(campaign.endDate).toLocaleDateString('sq-AL')
                    : 'Paparacaktuar'}
                </span>
              </div>
            </div>
          </div>

          {/* System Audit */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-3 shadow-sm text-xs text-slate-500">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Informacion Sistemi
            </h3>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Krijuar më:
              </span>
              <span>{new Date(campaign.createdAt).toLocaleDateString('sq-AL')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Përditësuar më:
              </span>
              <span>{new Date(campaign.updatedAt).toLocaleDateString('sq-AL')}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-900 font-mono text-[11px] text-slate-400 truncate">
              ID: {campaign.id}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-1">
      <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
        <span>{title}</span>
        {icon}
      </div>
      <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
        {value}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: CampaignStatus }) {
  const styles: Record<CampaignStatus, string> = {
    DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    SCHEDULED: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/50',
    ACTIVE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/50',
    COMPLETED: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/50',
    PAUSED: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/50',
  }

  return (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-full border ${
        styles[status] || styles.DRAFT
      }`}
    >
      {status}
    </span>
  )
}