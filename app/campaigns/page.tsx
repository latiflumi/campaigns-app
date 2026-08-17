// app/campaigns/page.tsx
import Link from 'next/link'

// TypeScript Types
export type CampaignStatus = 'Active' | 'Draft' | 'Completed' | 'Paused'
export type CampaignType = 'Email' | 'Social' | 'Search' | 'Push'

export interface Campaign {
  id: string
  name: string
  type: CampaignType
  status: CampaignStatus
  budget: string
  spent: string
  impressions: string
  clicks: string
  conversions: number
  ctr: string
  startDate: string
  endDate: string
}

// Mock Dataset
const CAMPAIGNS_DATA: Campaign[] = [
  {
    id: 'cmp-101',
    name: 'Summer Clearance Blitz',
    type: 'Email',
    status: 'Active',
    budget: '$5,000',
    spent: '$3,240',
    impressions: '45,200',
    clicks: '3,810',
    conversions: 1420,
    ctr: '8.4%',
    startDate: 'Aug 01, 2026',
    endDate: 'Aug 31, 2026',
  },
  {
    id: 'cmp-102',
    name: 'Back to School Social Ads',
    type: 'Social',
    status: 'Active',
    budget: '$8,500',
    spent: '$4,100',
    impressions: '120,400',
    clicks: '5,200',
    conversions: 890,
    ctr: '4.3%',
    startDate: 'Aug 05, 2026',
    endDate: 'Sep 10, 2026',
  },
  {
    id: 'cmp-103',
    name: 'Brand Search Retargeting',
    type: 'Search',
    status: 'Active',
    budget: '$3,000',
    spent: '$2,850',
    impressions: '18,900',
    clicks: '2,940',
    conversions: 2100,
    ctr: '15.5%',
    startDate: 'Jul 15, 2026',
    endDate: 'Ongoing',
  },
  {
    id: 'cmp-104',
    name: 'Autumn Product Launch Teaser',
    type: 'Push',
    status: 'Draft',
    budget: '$2,000',
    spent: '$0',
    impressions: '0',
    clicks: '0',
    conversions: 0,
    ctr: '0.0%',
    startDate: 'Sep 01, 2026',
    endDate: 'Sep 15, 2026',
  },
  {
    id: 'cmp-105',
    name: 'VIP Loyalty Promo Flash Sale',
    type: 'Email',
    status: 'Completed',
    budget: '$4,000',
    spent: '$4,000',
    impressions: '62,100',
    clicks: '6,100',
    conversions: 1850,
    ctr: '9.8%',
    startDate: 'Jul 01, 2026',
    endDate: 'Jul 10, 2026',
  },
  {
    id: 'cmp-106',
    name: 'Google Ads Remarketing Campaign',
    type: 'Search',
    status: 'Paused',
    budget: '$6,000',
    spent: '$1,450',
    impressions: '24,000',
    clicks: '1,120',
    conversions: 310,
    ctr: '4.6%',
    startDate: 'Jun 10, 2026',
    endDate: 'Aug 01, 2026',
  },
  {
    id: 'cmp-107',
    name: 'TikTok Video Lead Gen',
    type: 'Social',
    status: 'Draft',
    budget: '$10,000',
    spent: '$0',
    impressions: '0',
    clicks: '0',
    conversions: 0,
    ctr: '0.0%',
    startDate: 'Sep 15, 2026',
    endDate: 'Oct 15, 2026',
  },
]

export default function CampaignsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Campaigns
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage, filter, and track all marketing campaigns in one place.
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
        >
          + Create New Campaign
        </Link>
      </div>

      {/* Filter Toolbar & Status Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
        
        {/* Top Status Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto text-sm font-medium">
          <button className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs font-semibold">
            All ({CAMPAIGNS_DATA.length})
          </button>
          <button className="px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs transition-colors">
            Active (3)
          </button>
          <button className="px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs transition-colors">
            Drafts (2)
          </button>
          <button className="px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs transition-colors">
            Paused (1)
          </button>
          <button className="px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs transition-colors">
            Completed (1)
          </button>
        </div>

        {/* Search Input + Dropdown Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by campaign name or ID..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">
              🔍
            </span>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select className="w-full sm:w-auto px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Channels</option>
              <option value="email">Email</option>
              <option value="social">Social</option>
              <option value="search">Search</option>
              <option value="push">Push</option>
            </select>

            <select className="w-full sm:w-auto px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="budget_desc">Budget: High to Low</option>
              <option value="conversions_desc">Conversions: High to Low</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium border-b border-slate-200">
              <tr>
                <th className="p-4 w-10">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </th>
                <th className="px-4 py-3.5">Campaign</th>
                <th className="px-4 py-3.5">Channel</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Spent / Budget</th>
                <th className="px-4 py-3.5">Impressions</th>
                <th className="px-4 py-3.5">CTR</th>
                <th className="px-4 py-3.5">Conversions</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {CAMPAIGNS_DATA.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="p-4">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  </td>
                  
                  {/* Name + Dates */}
                  <td className="px-4 py-4">
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="font-semibold text-slate-900 hover:text-blue-600 transition-colors block"
                    >
                      {campaign.name}
                    </Link>
                    <span className="text-xs text-slate-400">
                      {campaign.startDate} – {campaign.endDate}
                    </span>
                  </td>

                  {/* Channel Tag */}
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
                      {campaign.type}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        campaign.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                          : campaign.status === 'Draft'
                          ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
                          : campaign.status === 'Paused'
                          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20'
                          : 'bg-slate-100 text-slate-600 ring-1 ring-slate-500/20'
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </td>

                  {/* Budget Spent */}
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900">{campaign.spent}</div>
                    <div className="text-xs text-slate-400">of {campaign.budget}</div>
                  </td>

                  {/* Impressions & Clicks */}
                  <td className="px-4 py-4">
                    <div className="text-slate-900 font-medium">{campaign.impressions}</div>
                    <div className="text-xs text-slate-400">{campaign.clicks} clicks</div>
                  </td>

                  {/* CTR */}
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {campaign.ctr}
                  </td>

                  {/* Conversions */}
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {campaign.conversions.toLocaleString()}
                  </td>

                  {/* Action Button Link */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-500 px-2.5 py-1.5 rounded"
                      >
                        View →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-900">1</span> to{' '}
            <span className="font-semibold text-slate-900">{CAMPAIGNS_DATA.length}</span> of{' '}
            <span className="font-semibold text-slate-900">{CAMPAIGNS_DATA.length}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled
              className="px-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium text-slate-400 bg-slate-50 cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled
              className="px-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium text-slate-400 bg-slate-50 cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}