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
  id: string,
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
    <div className="flex items-center justify-between border-b border-slate-200 pb-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Campaign: {initialCampaign.name}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Update campaign parameters, budget, participating locations, or creative copy.
        </p>
      </div>
      <Link
        href="/campaigns"
        className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
      >
        Cancel & Exit
      </Link>
    </div>

    {/* Form Container */}
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
      
      {/* SECTION 1: Core Details */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
          1. Campaign Details
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Campaign Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g. Autumn Product Launch Blitz"
            required
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/30"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Marketing Channel *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="STORE">Në dyqane</option>
              <option value="ECOMMERCE">Ecommerce</option>
              <option value="SMS">SMS</option>
              <option value="EMAIL">EMAIL</option>
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
              placeholder="p.sh 50% zbritje në të gjithë artikujt..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/30"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Target Locations & Logistics */}
      <div className="space-y-5 pt-4 border-t border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
          2. Locations, Budget & Lifecycle
        </h2>

        {formData.type === 'STORE' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Participating Retail Locations ({formData.participatingStores.length} Selected)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              {stores.map((store) => {
                const isSelected = formData.participatingStores.includes(store.name)
                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => handleStoreToggle(store.name)}
                    className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md border transition-all text-left ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>{store.name}</span>
                    <span
                      className={`h-4 w-4 rounded flex items-center justify-center text-[10px] font-bold ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-300 bg-slate-100 text-transparent'
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
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Total Allocated Budget ($)
            </label>
            <input
              type="text"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              placeholder="5000"
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
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* SECTION 3: Content / Copy Editor */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
          3. Creative Content & Copy
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Campaign Body Copy / Message Blueprint
          </label>
          <textarea
            name="content"
            rows={6}
            value={formData.content}
            onChange={handleInputChange}
            placeholder="Write your campaign body, promotional offer details, or ad copy hook here..."
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/30"
          />
        </div>
      </div>

      {/* Navigation & Submit Controls */}
      <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
        <Link
          href="/campaigns"
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-5 py-2 text-xs font-semibold text-white rounded-lg transition-colors ${
            isSubmitting
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500'
          }`}
        >
          {isSubmitting ? 'Updating Postgres...' : '💾 Save Changes'}
        </button>
      </div>

    </form>
  </div>
)
}