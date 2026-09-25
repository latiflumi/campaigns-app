// app/templates/page.tsx
import Link from 'next/link'
import { canManageCampaigns } from "../lib/roles"

// TypeScript Interfaces
export type TemplateCategory = 'Email' | 'Social' | 'Push' | 'Audience'

export interface CampaignTemplate {
  id: string
  title: string
  category: TemplateCategory
  description: string
  usageCount: number
  avgConversionRate: string
  lastUpdated: string
  tags: string[]
}

// Static Templates Dataset
const TEMPLATES_DATA: CampaignTemplate[] = [
  {
    id: 'tmpl-201',
    title: 'Flash Sale & Limited Time Offer',
    category: 'Email',
    description: 'High-urgency promotional layout with countdown timer blocks and clear single CTA button.',
    usageCount: 24,
    avgConversionRate: '9.4%',
    lastUpdated: 'Aug 02, 2026',
    tags: ['Promo', 'Urgency', 'Discount'],
  },
  {
    id: 'tmpl-202',
    title: 'Customer Onboarding Welcome Series',
    category: 'Email',
    description: '3-part automated email drip sequence introducing key platform features and first-purchase incentive.',
    usageCount: 52,
    avgConversionRate: '12.1%',
    lastUpdated: 'Jul 28, 2026',
    tags: ['Automation', 'Welcome', 'Drip'],
  },
  {
    id: 'tmpl-203',
    title: 'Cart Abandonment Recovery',
    category: 'Email',
    description: 'Triggered message with dynamic product grid and personal checkout link.',
    usageCount: 38,
    avgConversionRate: '14.8%',
    lastUpdated: 'Jul 19, 2026',
    tags: ['E-Commerce', 'Triggered', 'Recovery'],
  },
  {
    id: 'tmpl-204',
    title: 'Meta/Instagram Single Image Ad Copy',
    category: 'Social',
    description: 'Short-form hook-driven headline and caption preset optimized for mobile feed placement.',
    usageCount: 18,
    avgConversionRate: '4.2%',
    lastUpdated: 'Aug 10, 2026',
    tags: ['Paid Social', 'Direct Response'],
  },
  {
    id: 'tmpl-205',
    title: 'High-Value VIP Shoppers Segment',
    category: 'Audience',
    description: 'Pre-configured targeting rules: >$300 total spend, 3+ orders in last 90 days.',
    usageCount: 41,
    avgConversionRate: '16.2%',
    lastUpdated: 'Jun 15, 2026',
    tags: ['Audience', 'Retention'],
  },
  {
    id: 'tmpl-206',
    title: 'Re-engagement Push Notification',
    category: 'Push',
    description: 'Brevity-focused mobile push text for inactive app users (>30 days since last open).',
    usageCount: 12,
    avgConversionRate: '6.5%',
    lastUpdated: 'May 30, 2026',
    tags: ['Push', 'Winback'],
  },
]

export default async function TemplatesPage() {
  const canManage = await canManageCampaigns()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Campaign Templates
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Standardize your messaging, reuse high-converting blueprints, and save audience segments.
          </p>
        </div>
        <button className="inline-flex items-center justify-center rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors">
          + Create Template
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs space-y-4">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 overflow-x-auto text-sm font-medium">
          <button className="px-3 py-1.5 rounded-md bg-neutral-900 text-white text-xs font-semibold">
            All Templates ({TEMPLATES_DATA.length})
          </button>
          <button className="px-3 py-1.5 rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 text-xs transition-colors">
            Email Blueprints (3)
          </button>
          <button className="px-3 py-1.5 rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 text-xs transition-colors">
            Social Copy (1)
          </button>
          <button className="px-3 py-1.5 rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 text-xs transition-colors">
            Push Alerts (1)
          </button>
          <button className="px-3 py-1.5 rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 text-xs transition-colors">
            Audience Segments (1)
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="Search templates by title, tag, or description..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-neutral-50/50"
            />
            <span className="absolute left-3 top-2.5 text-neutral-400 text-sm">
              🔍
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select className="w-full sm:w-auto px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="most_used">Sort: Most Used</option>
              <option value="highest_cvr">Sort: Highest Avg CVR</option>
              <option value="recent">Sort: Recently Updated</option>
            </select>
          </div>
        </div>

      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES_DATA.map((template) => (
          <div
            key={template.id}
            className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition-all group"
          >
            <div className="space-y-3">
              {/* Top Badge & Category */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    template.category === 'Email'
                      ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-600/20'
                      : template.category === 'Social'
                      ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20'
                      : template.category === 'Audience'
                      ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
                      : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                  }`}
                >
                  {template.category}
                </span>
                <span className="text-xs text-neutral-400">
                  Used {template.usageCount} times
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h2 className="text-base font-semibold text-neutral-900 group-hover:text-brand-700 transition-colors">
                  {template.title}
                </h2>
                <p className="text-xs text-neutral-500 mt-1.5 line-clamp-3 leading-relaxed">
                  {template.description}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Card Footer Metrics & Use Button */}
            <div className="pt-5 mt-4 border-t border-neutral-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase font-medium">
                  Avg. Conversion
                </span>
                <span className="text-sm font-bold text-emerald-600">
                  {template.avgConversionRate}
                </span>
              </div>

              {canManage && (
                <Link
                  href={`/campaigns/new?templateId=${template.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white px-3 py-2 rounded-lg transition-colors"
                >
                  Use Template →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}