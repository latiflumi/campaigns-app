// app/analytics/page.tsx
import Link from 'next/link'

// TypeScript Interfaces
export interface ChannelPerformance {
  channel: string
  spend: string
  conversions: number
  cpa: string // Cost Per Acquisition
  roas: string // Return on Ad Spend
  share: number // Percentage of total spend
}

export interface TopCampaign {
  id: string
  name: string
  channel: string
  conversions: number
  conversionRate: string
  roas: string
}

// Static Analytics Datasets
const CHANNEL_DATA: ChannelPerformance[] = [
  {
    channel: 'Email Marketing',
    spend: '$7,240',
    conversions: 3270,
    cpa: '$2.21',
    roas: '8.4x',
    share: 35,
  },
  {
    channel: 'Paid Search (Google Ads)',
    spend: '$4,300',
    conversions: 2410,
    cpa: '$1.78',
    roas: '6.2x',
    share: 21,
  },
  {
    channel: 'Paid Social (Meta & TikTok)',
    spend: '$4,100',
    conversions: 890,
    cpa: '$4.60',
    roas: '3.1x',
    share: 20,
  },
  {
    channel: 'Push Notifications',
    spend: '$0',
    conversions: 0,
    cpa: '$0.00',
    roas: '0.0x',
    share: 0,
  },
]

const TOP_CAMPAIGNS: TopCampaign[] = [
  {
    id: 'cmp-103',
    name: 'Brand Search Retargeting',
    channel: 'Search',
    conversions: 2100,
    conversionRate: '15.5%',
    roas: '9.2x',
  },
  {
    id: 'cmp-105',
    name: 'VIP Loyalty Promo Flash Sale',
    channel: 'Email',
    conversions: 1850,
    conversionRate: '9.8%',
    roas: '8.1x',
  },
  {
    id: 'cmp-101',
    name: 'Summer Clearance Blitz',
    channel: 'Email',
    conversions: 1420,
    conversionRate: '8.4%',
    roas: '7.5x',
  },
  {
    id: 'cmp-102',
    name: 'Back to School Social Ads',
    channel: 'Social',
    conversions: 890,
    conversionRate: '4.3%',
    roas: '3.1x',
  },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header & Date Range Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Analytics & Performance
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track return on ad spend (ROAS), channel efficiency, and conversion funnels.
          </p>
        </div>

        {/* Global Date Filter Controls */}
        <div className="flex items-center gap-3">
          <select className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs">
            <option value="last_30">Last 30 Days</option>
            <option value="last_90">Last 90 Days</option>
            <option value="year_to_date">Year to Date (2026)</option>
            <option value="custom">Custom Range...</option>
          </select>
          <button className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs">
            Export CSV
          </button>
        </div>
      </div>

      {/* Top Level Macro Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Revenue Generated
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-2">$86,450</div>
          <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
            ↑ 18.2% vs previous period
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Blended ROAS
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-2">5.53x</div>
          <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
            ↑ 0.4x efficiency boost
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average CPA
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-2">$2.49</div>
          <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
            ↓ $0.35 lower acquisition cost
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Conversions
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-2">6,570</div>
          <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
            ↑ 12.4% order volume
          </div>
        </div>
      </div>

      {/* Main Chart Placeholder Area */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Conversions vs. Spend Trend
            </h2>
            <p className="text-xs text-slate-500">
              Daily trajectory of ad spend allocation against generated conversions.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span> Conversions
            </span>
            <span className="flex items-center gap-1 ml-3">
              <span className="w-3 h-3 rounded-full bg-slate-300 inline-block"></span> Spend ($)
            </span>
          </div>
        </div>

        {/* Visual Chart Graphic Wireframe */}
        <div className="h-64 bg-slate-50 rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-full h-full flex items-end justify-between gap-2 px-4 pt-8 pb-2">
            {[40, 65, 55, 80, 95, 70, 85, 100, 60, 75, 90, 80].map((height, i) => (
              <div key={i} className="w-full flex flex-col items-center gap-1 h-full justify-end group">
                <div 
                  className="w-full bg-blue-500 group-hover:bg-blue-600 transition-all rounded-t-sm" 
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-[10px] text-slate-400">Day {i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Channel Efficiency Breakdown & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Channel Efficiency Table (2 Columns wide on desktop) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Channel Efficiency
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of acquisition performance grouped by marketing channel.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Channel</th>
                  <th className="px-5 py-3.5">Total Spend</th>
                  <th className="px-5 py-3.5">Conversions</th>
                  <th className="px-5 py-3.5">Avg CPA</th>
                  <th className="px-5 py-3.5 text-right">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {CHANNEL_DATA.map((item) => (
                  <tr key={item.channel} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {item.channel}
                    </td>
                    <td className="px-5 py-4">{item.spend}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {item.conversions.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-900">{item.cpa}</td>
                    <td className="px-5 py-4 text-right font-bold text-emerald-600">
                      {item.roas}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Campaigns Leaderboard (1 Column wide on desktop) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Top Campaigns by ROAS
            </h2>
            <p className="text-xs text-slate-500">
              Highest converting campaigns for the selected timeframe.
            </p>
          </div>

          <div className="space-y-3">
            {TOP_CAMPAIGNS.map((campaign, index) => (
              <div
                key={campaign.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                    #{index + 1}
                  </span>
                  <div>
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="text-xs font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                    >
                      {campaign.name}
                    </Link>
                    <span className="text-[11px] text-slate-400">
                      {campaign.channel} • {campaign.conversionRate} CVR
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                  {campaign.roas}
                </span>
              </div>
            ))}
          </div>

          <Link
            href="/campaigns"
            className="block text-center text-xs font-semibold text-blue-600 hover:text-blue-500 pt-2"
          >
            View all campaign reports →
          </Link>
        </div>

      </div>
    </div>
  )
}