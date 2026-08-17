// app/page.tsx
import Link from 'next/link'

// TypeScript interface for campaign items
interface Campaign {
  id: string
  name: string
  type: 'Email' | 'Social' | 'Search' | 'Push'
  status: 'Active' | 'Draft' | 'Completed' | 'Paused'
  budget: string
  spent: string
  conversions: number
  startDate: string
}

// Static mock data
const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'cmp-101',
    name: 'Summer Clearance Blitz',
    type: 'Email',
    status: 'Active',
    budget: '$5,000',
    spent: '$3,240',
    conversions: 1420,
    startDate: 'Aug 01, 2026',
  },
  {
    id: 'cmp-102',
    name: 'Back to School Social Ads',
    type: 'Social',
    status: 'Active',
    budget: '$8,500',
    spent: '$4,100',
    conversions: 890,
    startDate: 'Aug 05, 2026',
  },
  {
    id: 'cmp-103',
    name: 'Brand Search Retargeting',
    type: 'Search',
    status: 'Active',
    budget: '$3,000',
    spent: '$2,850',
    conversions: 2100,
    startDate: 'Jul 15, 2026',
  },
  {
    id: 'cmp-104',
    name: 'Autumn Product Launch Teaser',
    type: 'Push',
    status: 'Draft',
    budget: '$2,000',
    spent: '$0',
    conversions: 0,
    startDate: 'Sep 01, 2026',
  },
  {
    id: 'cmp-105',
    name: 'VIP Loyalty Promo',
    type: 'Email',
    status: 'Completed',
    budget: '$4,000',
    spent: '$4,000',
    conversions: 1850,
    startDate: 'Jul 01, 2026',
  },
]

export default function HomePage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Campaign Overview
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitor active marketing campaigns and track key metrics.
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
        >
          + Create Campaign
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Campaigns
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-2">12</p>
          <span className="text-xs font-medium text-emerald-600 mt-1 inline-block">
            3 running now
          </span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Budget Spent
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-2">$14,190</p>
          <span className="text-xs font-medium text-slate-500 mt-1 inline-block">
            out of $22,500 total
          </span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Conversions
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-2">6,260</p>
          <span className="text-xs font-medium text-emerald-600 mt-1 inline-block">
            +14% vs last month
          </span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Avg. Conversion Rate
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-2">4.18%</p>
          <span className="text-xs font-medium text-emerald-600 mt-1 inline-block">
            +0.5% this week
          </span>
        </div>
      </div>

      {/* Campaign List Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Campaigns
          </h2>
          <Link
            href="/campaigns"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            View all →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Campaign Name</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Spent / Budget</th>
                <th className="px-6 py-3.5">Conversions</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {MOCK_CAMPAIGNS.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {campaign.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                      {campaign.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        campaign.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                          : campaign.status === 'Draft'
                          ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
                          : 'bg-slate-100 text-slate-600 ring-1 ring-slate-500/20'
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {campaign.spent} / <span className="text-slate-400">{campaign.budget}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {campaign.conversions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}