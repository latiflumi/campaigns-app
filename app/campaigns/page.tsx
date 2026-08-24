// app/campaigns/page.tsx
import CampaignList from "./CampaignList"
import { prisma } from "../lib/prisma"
import { fetchStoresAction } from "./actions";
import { fetchChannelsAction } from "./actions";

export default async function CampaignsPage() {
const [campaigns, stores, channels] = await Promise.all([
    prisma.campaign.findMany({
      orderBy: { startDate: "desc" },
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

  const serializedCampaigns = JSON.parse(JSON.stringify(campaigns))
  const serializedStores = JSON.parse(JSON.stringify(stores))
  


  return <CampaignList initialCampaigns={serializedCampaigns} stores={serializedStores} channels={channels} />
}

