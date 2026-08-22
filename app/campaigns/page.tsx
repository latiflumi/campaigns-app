// app/campaigns/page.tsx
import CampaignList from "./CampaignList"
import { prisma } from "../lib/prisma"
import { fetchStoresAction } from "./actions";
import { fetchChannelsAction } from "./actions";

export default async function CampaignsPage() {
const [campaigns, stores, channels] = await Promise.all([
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
    }),
    fetchStoresAction(),
    fetchChannelsAction(),
  ]); 

  const now = new Date();

  await prisma.campaign.updateMany({
    where: {
      status: 'SCHEDULED',
      startDate: {
        lte: now,
      },
    },
    data: {
      status: 'ACTIVE',
    },
  });


  return <CampaignList initialCampaigns={campaigns} stores={stores} channels={channels} />
}

