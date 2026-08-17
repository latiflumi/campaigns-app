// app/campaigns/[id]/edit/page.tsx
'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

const AVAILABLE_STORES = [
  'Prishtina Main Mall',
  'Albi Mall Branch',
  'Prizren Square Store',
  'Peja Retail Center',
  'Ferizaj Outlet',
  'Gjakova Main Store',
]

export default function EditCampaignPage({ params }: PageProps) {
  const router = useRouter()
  // Unwrap params Promise (Next.js 15+)
  const { id } = use(params)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'EMAIL',
    status: 'ACTIVE',
    subject: '',
    targetAudience: 'All Subscribers',
    participatingStores: [] as string[],
    budget: '',
    startDate: '',
    endDate: '',
    content: '',
  })

  // Simulate fetching campaign by ID
  useEffect(() => {
    async function loadCampaign() {
      setIsLoading(true)
      // Replace with your database fetch/Server Action call
      setFormData({
        name: `Autumn Product Launch (${id.slice(0, 5)})`,
        type: 'EMAIL',
        status: 'ACTIVE',
        subject: 'Exclusive 20% Off Fall Collection',
        targetAudience: 'VIP Buyers',
        participatingStores: ['Prishtina Main Mall', 'Albi Mall Branch', 'Prizren Square Store'],
        budget: '3500',
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        content: 'Check out our newly released fall catalog and enjoy early bird discounts.',
      })
      setIsLoading(false)
    }

    loadCampaign()
  }, [id])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleStoreToggle = (storeName: string) => {
    setFormData((prev) => {
      const exists = prev.participatingStores.includes(storeName)
      return {
        ...prev,
        participatingStores: exists
          ? prev.participatingStores.filter((s) => s !== storeName)
          : [...prev.participatingStores, storeName],
      }
    })
  }

  const handleSelectAllStores = () => {
    if (formData.participatingStores.length === AVAILABLE_STORES.length) {
      setFormData((prev) => ({ ...prev, participatingStores: [] }))
    } else {
      setFormData((prev) => ({ ...prev, participatingStores: [...AVAILABLE_STORES] }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    // Connect your Server Action here
    console.log(`Updating campaign ${id}:`, formData)

    setTimeout(() => {
      setIsSaving(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }, 600)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this campaign? This cannot be undone.')) {
      console.log(`Deleting campaign ${id}`)
      router.push('/campaigns')
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-slate-500">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto"></div>
          <div className="h-64 bg-slate-100 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Edit Campaign
            </h1>
            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">
              ID: {id}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Update campaign configuration, participating retail stores, or edit messaging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-lg transition-colors border border-rose-200"
          >
            Delete
          </button>
          <Link
            href="/campaigns"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* Main Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        
        {/* General Details */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            General Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Campaign Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
              >
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Channel
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EMAIL">Email Marketing</option>
                <option value="SOCIAL">Paid Social (Meta/TikTok)</option>
                <option value="SEARCH">Search Engine (Google Ads)</option>
                <option value="PUSH">Push Notification</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Subject Line / Tagline
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/30"
              />
            </div>
          </div>
        </div>

        {/* Participating Stores Section */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Participating Stores
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select physical retail branches where this campaign promotion applies.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSelectAllStores}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition-colors"
            >
              {formData.participatingStores.length === AVAILABLE_STORES.length
                ? 'Deselect All'
                : 'Select All Stores'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {AVAILABLE_STORES.map((store) => {
              const isChecked = formData.participatingStores.includes(store)
              return (
                <label
                  key={store}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-blue-50/50 border-blue-300 text-slate-900 shadow-2xs'
                      : 'bg-slate-50/30 border-slate-200 text-slate-600 hover:bg-slate-100/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleStoreToggle(store)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{store}</span>
                </label>
              )
            })}
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
            <strong>Active Selection:</strong>{' '}
            {formData.participatingStores.length > 0
              ? `${formData.participatingStores.length} store(s) active (${formData.participatingStores.join(', ')})`
              : 'No stores selected (Online only / Universal)'}
          </div>
        </div>

        {/* Audience & Budgeting */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            Targeting & Budget
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Target Audience Segment
              </label>
              <select
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All Subscribers">All Subscribers (12,400 contacts)</option>
                <option value="VIP Buyers">High-Value VIP Buyers (&gt;$300 spent)</option>
                <option value="Inactive 60 Days">Inactive Customers (&gt;60 days)</option>
                <option value="Cart Abandoners">Cart Abandoners (Last 7 days)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Allocated Budget ($)
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            Creative Messaging
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Body Copy / Promotional Content
            </label>
            <textarea
              name="content"
              rows={5}
              value={formData.content}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/30"
            />
          </div>
        </div>

        {/* Form Controls */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          {saveSuccess ? (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              ✓ Campaign updated successfully!
            </span>
          ) : (
            <span className="text-xs text-slate-400">
              Changes affect live tracking immediately upon saving.
            </span>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/campaigns')}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Back to List
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}