// app/campaigns/[id]/edit/EditCampaignForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { fetchStoresAction, updateCampaign } from '../../actions'
import { Campaign } from '@/app/types/CampaignTypes'
import Link from 'next/link'

interface EditCampaignFormProps {
  initialCampaign: Campaign
}

interface Store {
  id: number,
  name: string
}

export default function EditCampaignForm({ initialCampaign }: EditCampaignFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stores, setStores] = useState<Store[]>([])

  useEffect(() => {
      const fetchStores = async () => {
        const storesData = await fetchStoresAction()
        setStores(storesData)
      }
      fetchStores()
    }, [])
  
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


    // Populate initial state from the server-fetched campaign data
  const [formData, setFormData] = useState({
    name: initialCampaign.name ?? '',
    type: initialCampaign.type,
    status: initialCampaign.status,
    subject: initialCampaign.subject ?? '',
    participatingStores: initialCampaign.participatingStores ?? [],
    budget: initialCampaign.budget ?? '',
    startDate: initialCampaign.startDate
      ? new Date(initialCampaign.startDate).toISOString().split('T')[0]
      : '',
    endDate: initialCampaign.endDate
      ? new Date(initialCampaign.endDate).toISOString().split('T')[0]
      : '',
    content: initialCampaign.content ?? '',
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await updateCampaign(initialCampaign.id, formData)

      if (result && !result.success) {
        toast.error(result.error || 'Gabim gjatë përditësimit të kampanjës')
        setIsSubmitting(false)
        return
      }

      toast.success('Kampanja u përditësua me sukses!')
      router.push('/campaigns')
    } catch (error) {
      console.error('Failed to update campaign:', error)
      toast.error('Një gabim i papritur ndodhi.')
      setIsSubmitting(false)
    }
  }

  return (
  <div className="max-w-4xl mx-auto space-y-8">
    {/* Header */}
    <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Edit Campaign: {initialCampaign.name}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Update campaign parameters, budget, participating locations, or creative copy.
        </p>
      </div>
      <Link
        href="/campaigns"
        className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-3 py-2 rounded-lg transition-colors"
      >
        Cancel & Exit
      </Link>
    </div>

    {/* Form Container */}
    <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs space-y-6">
      
      {/* SECTION 1: Core Details */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          1. Campaign Details
        </h2>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
            Campaign Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g. Autumn Product Launch Blitz"
            required
            className="w-full px-3.5 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-neutral-50/30 dark:bg-neutral-800/50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
              Marketing Channel *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="STORE">Në dyqane</option>
              <option value="ECOMMERCE">Ecommerce</option>
              <option value="SMS">SMS</option>
              <option value="EMAIL">EMAIL</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
              Subject Line / Tagline
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder="p.sh 50% zbritje në të gjithë artikujt..."
              className="w-full px-3.5 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-neutral-50/30 dark:bg-neutral-800/50"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Target Locations & Logistics */}
      <div className="space-y-5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          2. Locations, Budget & Lifecycle
        </h2>

        {formData.type === 'STORE' && (
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Participating Retail Locations ({formData.participatingStores.length} Selected)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
              {stores.map((store) => {
                const isSelected = formData.participatingStores.includes(store.name)
                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => handleStoreToggle(store.name)}
                    className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md border transition-all text-left ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-500/10 border-brand-500 text-brand-900 dark:text-brand-200 font-semibold'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    <span>{store.name}</span>
                    <span
                      className={`h-4 w-4 rounded flex items-center justify-center text-[10px] font-bold ${
                        isSelected
                          ? 'bg-brand-700 text-white'
                          : 'border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
              Total Allocated Budget ($)
            </label>
            <input
              type="text"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              placeholder="5000"
              className="w-full px-3.5 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-neutral-50/30 dark:bg-neutral-800/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="PAUSED">Paused</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-neutral-900"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: Content / Copy Editor */}
      <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          3. Creative Content & Copy
        </h2>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
            Campaign Body Copy / Message Blueprint
          </label>
          <textarea
            name="content"
            rows={6}
            value={formData.content}
            onChange={handleInputChange}
            placeholder="Write your campaign body, promotional offer details, or ad copy hook here..."
            className="w-full px-3.5 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-neutral-50/30 dark:bg-neutral-800/50"
          />
        </div>
      </div>

      {/* Navigation & Submit Controls */}
      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <Link
          href="/campaigns"
          className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-5 py-2 text-xs font-semibold text-white rounded-lg transition-colors ${
            isSubmitting
              ? 'bg-brand-400 cursor-not-allowed'
              : 'bg-brand-700 hover:bg-brand-600'
          }`}
        >
          {isSubmitting ? 'Updating Postgres...' : '💾 Save Changes'}
        </button>
      </div>

    </form>
  </div>
)
}