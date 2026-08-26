// types/CampaignTypes.ts
import { Campaign as PrismaCampaign, CampaignStatus, CampaignType } from "@prisma/client"

export type Campaign = PrismaCampaign &{
    grossRevenue?: number
}
export type { CampaignStatus, CampaignType }