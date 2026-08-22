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
  Trash2 
} from 'lucide-react'
import { getCampaignById } from '../actions'
import { Campaign } from '@/app/types/CampaignTypes'

// Explicit type matching your Prisma Schema
type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'PAUSED'


export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // TODO: Replace MOCK_CAMPAIGN with your Prisma query:
  // const campaign = await prisma.campaign.findUnique({ where: { id } })
  const campaign: Campaign | null = await getCampaignById(id)

  if (!campaign) {
    notFound()
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Top Header & Navigation */}
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
            <StatusBadge status={campaign.status} />
          </div>
        </div>

        {/* Action Controls */}
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

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left / Center Column: Content & Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Subject Line (If SMS or EMAIL / General Subject) */}
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

          {/* Campaign Blueprint / Content */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <FileText className="w-5 h-5 text-slate-500" />
                Përmbajtja / Blueprint
              </h2>
            </div>
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

          {/* Participating Stores */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-4 shadow-sm">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Store className="w-5 h-5 text-slate-500" />
              Dyqanet Pjesëmarrëse ({campaign.participatingStores.length})
            </h2>
            {campaign.participatingStores.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {campaign.participatingStores.map((store, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/50"
                  >
                    <Store className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    {store}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-slate-400">
                Kjo kampanjë nuk është e lidhur me asnjë dyqan specifik.
              </p>
            )}
          </div>
        </div>

        {/* Right Sidebar: Metadata & Dates */}
        <div className="space-y-6">
          
          {/* Metadata Card */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Detajet e Kampanjës
            </h3>

            <div className="space-y-4 text-sm">
              {/* Type */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-900">
                <span className="text-slate-500 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Lloji
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {campaign.type}
                </span>
              </div>

              {/* Budget */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-900">
                <span className="text-slate-500 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Buxheti
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {campaign.budget ? `$${campaign.budget}` : 'N/A'}
                </span>
              </div>

              {/* Start Date */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-900">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data e Fillimit
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {campaign.startDate
                    ? new Date(campaign.startDate).toLocaleDateString('sq-AL')
                    : 'Paparacaktuar'}
                </span>
              </div>

              {/* End Date */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-900">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
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

          {/* System Audit Information */}
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

// Color-coded badge helper for CampaignStatus
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