// app/campaigns/page.tsx
import CampaignList from "./CampaignList"
import { prisma } from "../lib/prisma"
import { fetchStoresAction } from "./actions";
import { fetchChannelsAction } from "./actions";
import { getCampaignRevenue } from "../api/erp/actions"

export default async function CampaignsPage() {
  const [campaigns, stores, channels] = await Promise.all([
    prisma.campaign.findMany({ orderBy: { startDate: "desc" } }),
    fetchStoresAction(),
    fetchChannelsAction(),
  ]);

  const now = new Date();

  await prisma.campaign.updateMany({
    where: {
      status: {
        in: ['SCHEDULED', 'DRAFT'],
      },
      startDate: {
        lte: now,
      },
    },
    data: {
      status: 'ACTIVE',
    },
  });

  // Create a Quick Lookup Map: Store Name -> Integer ID
  const storeNameToIdMap = new Map<string, number>(
    stores.map((s) => [s.name, s.id])
  );

  const campaignsWithRevenue = await Promise.all(
    campaigns.map(async (campaign) => {
      // Safely resolve store values to integer ID strings
      const storeIds = campaign.participatingStores
        .map((item: number | string | { id: number }) => {
          if (typeof item === "number") return item.toString();
          if (typeof item === "object" && item?.id) return item.id.toString();
          // If the array contains store names, lookup their numeric ID
          if (typeof item === "string") {
            const foundId = storeNameToIdMap.get(item);
            return foundId ? foundId.toString() : null;
          }
          return null;
        })
        .filter((id): id is string => id !== null);

      const from = campaign.startDate
        ? new Date(campaign.startDate).toISOString().split("T")[0]
        : null;

      const to = campaign.endDate
        ? new Date(campaign.endDate).toISOString().split("T")[0]
        : null;

      let grossRevenue: number | null = null;

      // Only query if valid store IDs and dates exist
      if (storeIds.length > 0 && from && to) {
        try {
          const analytics = await getCampaignRevenue(storeIds, from, to);
          grossRevenue = analytics?.grossRevenue ?? 0;
        } catch (error) {
          console.error(`⚠️ API failed for campaign ${campaign.id}:`, error);
          // Leaves grossRevenue as null so UI can render a fallback state ("N/A" or "-")
          grossRevenue = null;
        }
      }

      return {
        ...campaign,
        grossRevenue,
      };
    })
  );

  const serializedCampaigns = JSON.parse(JSON.stringify(campaignsWithRevenue));
  const serializedStores = JSON.parse(JSON.stringify(stores));

  return (
    <CampaignList
      initialCampaigns={serializedCampaigns}
      stores={serializedStores}
      channels={channels}
    />
  );
}