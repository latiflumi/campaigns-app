"use server"

export async function getCampaignRevenue(stores: string[], from: string, to: string) {
    const storeParams = stores.join(',')
    const res = await fetch(`http://192.168.0.150/campaigns/campaign-analytics?stores=${storeParams}&from=${from}&to=${to}&mode=summary`,{
        next: { revalidate: 60 } }
    )

    if (!res.ok) return { grossRevenue: 0, netRevenue: 0, totalUnitsSold: 0 }
    const data = await res.json()
    return data.summary;
    }
