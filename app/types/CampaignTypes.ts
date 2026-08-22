// types/CampaignTypes.ts
import { Campaign as PrismaCampaign, CampaignStatus, CampaignType } from "@prisma/client"

export type Campaign = PrismaCampaign
export type { CampaignStatus, CampaignType }