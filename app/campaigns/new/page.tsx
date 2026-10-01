// app/campaigns/new/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createCampaign } from '../actions'
import { fetchStoresAction } from '../actions'
import { CampaignStatus, CampaignType } from '@/app/types/CampaignTypes'
import { useT } from '@/app/lib/i18n/client'


export type Step = 1 | 2 | 3 | 4

interface Store {
  id: number,
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
  const t = useT()
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
      toast.error(t.form.errName)
      return
    }
    if(currentStep === 2 && !formData.startDate && !formData.endDate){
      toast.error(t.form.errDates)
      return
    }
    if (
  currentStep === 2 &&
  formData.startDate &&
  formData.endDate &&
  new Date(formData.startDate) > new Date(formData.endDate)
) {
  toast.error(t.form.errDateOrder)
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
      toast.error(result.error || t.form.createFailed)
      setIsSubmitting(false)
      return
    }

    // Trigger success toast and redirect
    toast.success(t.form.created)
    router.push('/campaigns')
  } catch (error) {
    console.error('Failed to create campaign:', error)
    toast.error(t.common.unexpectedError)
    setIsSubmitting(false)
  }
}
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {t.form.newTitle}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            {t.form.newSubtitle}
          </p>
        </div>
        <Link
          href="/campaigns"
          className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-3 py-2 rounded-lg transition-colors"
        >
          {t.form.cancelExit}
        </Link>
      </div>

      {/* Wizard Progress Stepper */}
      <nav aria-label={t.form.progress}>
        <ol className="grid grid-cols-4 gap-2 sm:gap-4">
          {t.form.steps.map((title, i) => ({ id: i + 1, title })).map((step) => (
            <li key={step.id} className="flex flex-col">
              <div
                className={`h-1.5 w-full rounded-full transition-colors ${
                  currentStep >= step.id ? 'bg-brand-700' : 'bg-neutral-200 dark:bg-neutral-800'
                }`}
              />
              <span className="mt-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hidden sm:inline">
                {step.id}. {step.title}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      {/* Form Steps Container */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs space-y-6">
        
        {/* STEP 1: Basic Campaign Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-3">
              {t.form.step1}
            </h2>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                {t.form.name}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={t.form.namePlaceholder}
                required
                className="w-full px-3.5 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-neutral-50/30 dark:bg-neutral-800/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  {t.form.channel}
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="STORE">{t.form.channelOptions.STORE}</option>
                  <option value="ECOMMERCE">{t.form.channelOptions.ECOMMERCE}</option>
                  <option value="SMS">{t.form.channelOptions.SMS}</option>
                  <option value="EMAIL">{t.form.channelOptions.EMAIL}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  {t.form.subject}
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder={t.form.subjectPlaceholder}
                  className="w-full px-3.5 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-neutral-50/30 dark:bg-neutral-800/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Audience, Stores & Budgeting */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-3">
              {t.form.step2}
            </h2>

            {/* Participating Stores Selector */}
            {requiresStoreSelection && (
              <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                {t.form.stores(formData.participatingStores.length)}
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
             ) }
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  {t.form.budget}
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
                  {t.form.status}
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="DRAFT">{t.status.DRAFT}</option>
                  <option value="SCHEDULED">{t.status.SCHEDULED}</option>
                  <option value="ACTIVE">{t.status.ACTIVE}</option>
                  <option value="COMPLETED">{t.status.COMPLETED}</option>
                  <option value="PAUSED">{t.status.PAUSED}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  {t.form.startDate}
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
                  {t.form.endDate}
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
        )}

        {/* STEP 3: Content / Copy Editor */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-3">
              {t.form.step3}
            </h2>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                {t.form.body}
              </label>
              <textarea
                name="content"
                rows={6}
                value={formData.content}
                onChange={handleInputChange}
                placeholder={t.form.bodyPlaceholder}
                className="w-full px-3.5 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-neutral-50/30 dark:bg-neutral-800/50"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Review & Final Launch */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-3">
              {t.form.step4}
            </h2>

            <div className="bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase">{t.form.reviewName}</span>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">{formData.name || t.form.untitled}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase">{t.form.reviewChannel}</span>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">{t.form.channelOptions[formData.type] ?? formData.type}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
                <div>
                  <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase">{t.form.reviewBudget}</span>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">€{formData.budget || '0'}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
                <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase">{t.form.reviewStores}</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {formData.participatingStores.length > 0 ? (
                    formData.participatingStores.map((st) => (
                      <span
                        key={st}
                        className="bg-brand-100 dark:bg-brand-500/15 text-brand-800 dark:text-brand-200 text-[11px] font-medium px-2 py-0.5 rounded border border-brand-200 dark:border-brand-500/30"
                      >
                        {st}
                      </span>
                    ))
                  ) : (
                    <span className="text-neutral-400 dark:text-neutral-500 text-xs italic">{t.form.noStoresSelected}</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
                <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase">{t.form.reviewMessage}</span>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1 italic bg-white dark:bg-neutral-900 p-3 rounded border border-neutral-200 dark:border-neutral-800">
                  {formData.content || t.form.noContent}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Controls */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              currentStep === 1 || isSubmitting
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            {t.form.back}
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 text-xs font-semibold bg-brand-700 hover:bg-brand-600 text-white rounded-lg transition-colors"
            >
              {t.form.continue}
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
              {isSubmitting ? t.form.saving : t.form.launch}
            </button>
          )}
        </div>

      </form>
    </div>
  )
}