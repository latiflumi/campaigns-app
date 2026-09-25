// app/campaigns/[id]/page.tsx

import { notFound } from "next/navigation"
import { getCampaignDetailedAnalytics, type CampaignDetailedAnalytics } from "../../api/erp/actions"
import { getCampaignById, fetchStoresAction } from "../actions"
import { syncCampaignStatuses } from "@/app/lib/campaign-status"
import { requireSession } from "@/app/lib/session"
import CampaignDetail, { type CampaignDetailData, type AnalyticsGap } from "./CampaignDetail"

export const dynamic = "force-dynamic"
export const revalidate = 0

const toDay = (d: Date | null) => (d ? d.toISOString().split("T")[0] : null)

const parseBudget = (budget: string | null) => {
  if (!budget) return null
  const n = Number(budget.replace(",", "."))
  return Number.isFinite(n) && n > 0 ? n : null
}

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession()
  const { id } = await params
  const now = new Date()

  await syncCampaignStatuses(now)

  const [campaign, stores] = await Promise.all([getCampaignById(id), fetchStoresAction()])

  if (!campaign) {
    notFound()
  }

  // Store names -> numeric ERP ids
  const storeNameToId = new Map(stores.map((s) => [s.name, s.id]))
  const storeIds = campaign.participatingStores
    .map((name) => storeNameToId.get(name)?.toString() ?? null)
    .filter((storeId): storeId is string => storeId !== null)

  const from = toDay(campaign.startDate)
  const to = toDay(campaign.endDate)

  // Work out why analytics might be missing, so the page can say so instead of going blank
  let analytics: CampaignDetailedAnalytics | null = null
  let gap: AnalyticsGap | null = null

  if (storeIds.length === 0) gap = "no-stores"
  else if (!from || !to) gap = "no-dates"
  else if (campaign.startDate && campaign.startDate > now) gap = "upcoming"
  else {
    try {
      analytics = await getCampaignDetailedAnalytics(storeIds, from, to)
    } catch (error) {
      console.error(`⚠️ Detailed analytics API failed for campaign ${campaign.id}:`, error)
    }
    if (!analytics?.totals) {
      analytics = null
      gap = "unavailable"
    }
  }

  // Participating stores that don't appear in the ERP breakdown made no sales in the period
  const sellingIds = new Set(analytics?.storeBreakdown?.map((s) => s.OrgId) ?? [])
  const silentStores = analytics
    ? campaign.participatingStores.filter((name) => {
        const storeId = storeNameToId.get(name)
        return storeId !== undefined && !sellingIds.has(storeId)
      })
    : []

  const data: CampaignDetailData = {
    id: campaign.id,
    name: campaign.name,
    type: campaign.type,
    status: campaign.status,
    subject: campaign.subject,
    content: campaign.content,
    participatingStores: campaign.participatingStores,
    budget: parseBudget(campaign.budget),
    startDate: campaign.startDate?.toISOString() ?? null,
    endDate: campaign.endDate?.toISOString() ?? null,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
  }

  return (
    <CampaignDetail
      campaign={data}
      analytics={analytics}
      gap={gap}
      silentStores={silentStores}
      totalStores={stores.length}
      now={now.toISOString()}
    />
  )
}
