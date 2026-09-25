// app/lib/campaign-status.ts
import { prisma } from "./prisma"

/**
 * Brings campaign statuses in line with the calendar:
 * past their end date → COMPLETED, start date reached → ACTIVE.
 *
 * Dates are stored as midnight UTC and endDate is the last day the campaign
 * runs, so a campaign is over once today's UTC midnight is past its endDate.
 * Finished campaigns close first, so the activation never picks them up.
 */
export async function syncCampaignStatuses(now = new Date()) {
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  await prisma.campaign.updateMany({
    where: {
      status: { not: "COMPLETED" },
      endDate: { lt: todayUtc },
    },
    data: { status: "COMPLETED" },
  })

  await prisma.campaign.updateMany({
    where: {
      status: { in: ["SCHEDULED", "DRAFT"] },
      startDate: { lte: now },
    },
    data: { status: "ACTIVE" },
  })
}
