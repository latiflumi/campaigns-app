// app/campaigns/new/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createCampaign } from '../actions'
import { fetchStoresAction } from '../actions'
import { CampaignStatus, CampaignType } from '@/app/types/CampaignTypes'


export type Step = 1 | 2 | 3 | 4

interface Store {
  id: string,
  name: string
}

interface CampaignFormData {
  name: string
  type: CampaignType
  status: CampaignStatus
  subject: string
  targetAudience: string
  participatingStores: string[]
  budget: string
  startDate: string
  endDate: string
  content: string
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stores, setStores] = useState<Store[]>([])
  
  useEffect(() => {
    const fetchStores = async () => {
      const storesData = await fetchStoresAction()
      setStores(storesData)
    }
    fetchStores()
  }, [])

  // Form State matching Prisma Enums
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    type: 'STORE' as 'STORE' | 'ECOMMERCE' | 'SMS' | 'EMAIL',
    status: 'DRAFT' as 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'PAUSED',
    subject: '',
    targetAudience: 'All Subscribers',
    participatingStores: [] as string[],
    budget: '',
    startDate:'',
    endDate: '',
    content: '',
  })

  
  const requiresStoreSelection = formData.type === 'STORE';

  // Generic handler for input, select, and textarea fields
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Toggle store selection in participatingStores array
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

  const handleNext = () => {
    if (currentStep === 1 && !formData.name.trim()) {
      toast.error('Ju lutem shkruani emrin e kampanjes para se te vazhdoni')
      return
    }
    if(currentStep === 2 && !formData.startDate && !formData.endDate){
      toast.error('Ju lutem plotesoni Datat')
      return
    }
    if (
  currentStep === 2 &&
  formData.startDate &&
  formData.endDate &&
  new Date(formData.startDate) > new Date(formData.endDate)
) {
  toast.error('Data e mbarimit nuk mund te jete me e hershme se data e fillimit')
  return
}
    if (currentStep < 4) setCurrentStep((prev) => (prev + 1) as Step)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as Step)
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsSubmitting(true)

  try {
    const result = await createCampaign({
      ...formData
    })

    if (result && !result.success) {
      // Trigger error toast with the custom Zod message from your Server Action
      toast.error(result.error || 'Gabim gjatë krijimit të kampanjës')
      setIsSubmitting(false)
      return
    }

    // Trigger success toast and redirect
    toast.success('Kampanja u krijua me sukses!')
    router.push('/campaigns')
  } catch (error) {
    console.error('Failed to create campaign:', error)
    toast.error('Një gabim i papritur ndodhi. Ju lutemi provoni përsëri.')
    setIsSubmitting(false)
  }
}
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create New Campaign
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure targeting, budget, participating stores, and messaging.
          </p>
        </div>
        <Link
          href="/campaigns"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
        >
          Cancel & Exit
        </Link>
      </div>

      {/* Wizard Progress Stepper */}
      <nav aria-label="Progress">
        <ol className="grid grid-cols-4 gap-2 sm:gap-4">
          {[
            { id: 1, title: 'Details' },
            { id: 2, title: 'Audience & Stores' },
            { id: 3, title: 'Creative Content' },
            { id: 4, title: 'Review & Launch' },
          ].map((step) => (
            <li key={step.id} className="flex flex-col">
              <div
                className={`h-1.5 w-full rounded-full transition-colors ${
                  currentStep >= step.id ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
              <span className="mt-2 text-xs font-semibold text-slate-700 hidden sm:inline">
                {step.id}. {step.title}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      {/* Form Steps Container */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        
        {/* STEP 1: Basic Campaign Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
              Step 1: Campaign Setup
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
                  <option value="STORE">Ne dyqane</option>
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
                  placeholder="p.sh 50% zbritje ne te gjithe artikujt..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/30"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Audience, Stores & Budgeting */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
              Step 2: Audience, Stores & Budget
            </h2>

            {/* Participating Stores Selector */}
            {requiresStoreSelection && (
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
             ) }
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
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
        )}

        {/* STEP 3: Content / Copy Editor */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
              Step 3: Creative Content & Copy
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
        )}

        {/* STEP 4: Review & Final Launch */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
              Step 4: Review & Finalize
            </h2>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Campaign Name:</span>
                  <p className="font-semibold text-slate-900">{formData.name || 'Untitled Campaign'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Channel:</span>
                  <p className="font-semibold text-slate-900">{formData.type}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Budget:</span>
                  <p className="font-semibold text-slate-900">${formData.budget || '0'}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-xs font-semibold text-slate-400 uppercase">Participating Stores:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {formData.participatingStores.length > 0 ? (
                    formData.participatingStores.map((st) => (
                      <span
                        key={st}
                        className="bg-blue-100 text-blue-800 text-[11px] font-medium px-2 py-0.5 rounded border border-blue-200"
                      >
                        {st}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs italic">No stores selected</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-xs font-semibold text-slate-400 uppercase">Preview Message:</span>
                <p className="text-xs text-slate-700 mt-1 italic bg-white p-3 rounded border border-slate-200">
                  {formData.content || 'No content written.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Controls */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              currentStep === 1 || isSubmitting
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ← Back
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Continue →
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs font-semibold text-white rounded-lg transition-colors ${
                isSubmitting
                  ? 'bg-emerald-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {isSubmitting ? 'Saving to Postgres...' : '🚀 Launch Campaign'}
            </button>
          )}
        </div>

      </form>
    </div>
  )
}