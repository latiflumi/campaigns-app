// app/campaigns/page.tsx
import { cookies } from "next/headers"
import CampaignList from "./CampaignList"
import { prisma } from "@/app/lib/prisma"
import { syncCampaignStatuses } from "@/app/lib/campaign-status"
import { requireSession } from "@/app/lib/session"
import { fetchStoresAction, fetchChannelsAction } from "./actions"
import { getCampaignRevenue } from "../api/erp/actions"
import { VIEW_COOKIE, type CampaignListItem, type ViewMode } from "./_components/campaign-utils"

const toDay = (d: Date | null) => (d ? d.toISOString().split("T")[0] : null)

const parseBudget = (budget: string | null) => {
  if (!budget) return null
  const n = Number(budget.replace(",", "."))
  return Number.isFinite(n) && n > 0 ? n : null
}

export default async function CampaignsPage() {
  await requireSession()
  const now = new Date()

  // Sync statuses with the calendar before reading, so this render is current
  await syncCampaignStatuses(now)

  const [campaigns, stores, channels, cookieStore] = await Promise.all([
    prisma.campaign.findMany({ orderBy: { startDate: "desc" } }),
    fetchStoresAction(),
    fetchChannelsAction(),
    cookies(),
  ])

  // Quick lookup: store name -> numeric ERP id
  const storeNameToId = new Map(stores.map((s) => [s.name, s.id]))

  const items: CampaignListItem[] = await Promise.all(
    campaigns.map(async (campaign) => {
      const storeIds = campaign.participatingStores
        .map((name) => storeNameToId.get(name)?.toString() ?? null)
        .filter((id): id is string => id !== null)

      const from = toDay(campaign.startDate)
      const to = toDay(campaign.endDate)

      let grossRevenue: number | null = null
      let netRevenue: number | null = null
      let grossProfit: number | null = null
      let markdownAmount: number | null = null
      let unitsSold: number | null = null

      // Only query the ERP when there are resolvable stores and a full date range
      if (storeIds.length > 0 && from && to) {
        try {
          const summary = await getCampaignRevenue(storeIds, from, to)
          grossRevenue = summary?.grossRevenue ?? 0
          netRevenue = summary?.netRevenue ?? null
          grossProfit = summary?.grossProfit ?? null
          markdownAmount = summary?.markdownAmount ?? null
          unitsSold = summary?.totalUnitsSold ?? null
        } catch (error) {
          // Leave the figures null so the UI renders its "no data" state
          console.error(`⚠️ API failed for campaign ${campaign.id}:`, error)
        }
      }

      return {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        subject: campaign.subject,
        participatingStores: campaign.participatingStores,
        budget: parseBudget(campaign.budget),
        startDate: campaign.startDate?.toISOString() ?? null,
        endDate: campaign.endDate?.toISOString() ?? null,
        updatedAt: campaign.updatedAt.toISOString(),
        grossRevenue,
        netRevenue,
        grossProfit,
        markdownAmount,
        unitsSold,
      }
    })
  )

  const initialView: ViewMode = cookieStore.get(VIEW_COOKIE)?.value === "grid" ? "grid" : "list"

  return (
    <CampaignList
      campaigns={items}
      stores={stores}
      channels={channels.map((c) => c.type)}
      now={now.toISOString()}
      initialView={initialView}
    />
  )
}
