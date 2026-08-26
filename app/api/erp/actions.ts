"use server"

export interface CampaignDetailedAnalytics {
  totals: {
    grossRevenue: number
    netRevenue: number
    totalCost: number
    grossProfit: number
    totalUnitsSold: number
  }
  storeBreakdown: Array<{
    OrgId: number
    OrgName: string
    grossRevenue: number
    netRevenue: number
    unitsSold: number
    grossProfit: number
  }>
  topProducts: Array<{
    ArtikulliId: number
    StyleNumber: string
    ProductName: string
    CategoryName: string
    unitsSold: number
    grossRevenue: number
    netRevenue: number
  }>
  topCategories: Array<{
    CategoryName: string
    unitsSold: number
    grossRevenue: number
  }>
}

export async function getCampaignDetailedAnalytics(
  stores: string[],
  from: string | Date,
  to: string | Date
): Promise<CampaignDetailedAnalytics | null> {
  if (!stores || stores.length === 0 || !from || !to) {
    return null
  }

  const storeParams = stores.join(',')

  // Safely format Date or string to YYYY-MM-DD
  const formattedFrom = new Date(from).toISOString().split('T')[0]
  const formattedTo = new Date(to).toISOString().split('T')[0]

  try {
    const targetUrl = `http://${process.env.API_URL}/campaigns/campaign-analytics?stores=${storeParams}&from=${formattedFrom}&to=${formattedTo}&mode=detailed`
console.log('Fetching Analytics URL:', targetUrl)
    const res = await fetch(
      targetUrl,
      {
        headers: {
          'x-api-key': process.env.INTERNAL_API_KEY!,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 60 },
      }
    )

    if (!res.ok) {
      console.error('Failed to fetch analytics:', res.statusText)
      return null
    }

    return await res.json()
  } catch (error) {
    console.error('Error fetching detailed analytics:', error)
    return null
  }
}

export async function getCampaignRevenue(stores: string[], from: string, to: string) {
  const storeParams = stores.join(',')
  
  
  const res = await fetch(
    `http://${process.env.API_URL}/campaigns/campaign-analytics?stores=${storeParams}&from=${from}&to=${to}&mode=summary`,
    {
      headers: {
        "x-api-key": process.env.INTERNAL_API_KEY!,
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 },
    }
  )

  if (!res.ok) return { grossRevenue: 0, netRevenue: 0, totalUnitsSold: 0 }
  
  const data = await res.json()
  return data.summary;
}