// app/lib/alerts/types.ts
// Shapes shared by the alert engine (server), the rule form and the notification list (client).

/** Which stores an alert watches. Chains are the store-name brands from app/lib/bi/brands.ts. */
export type StoreScope = { kind: "all" } | { kind: "chain"; chain: string } | { kind: "store"; orgId: number }

/** SALES_DROP: a store sold `threshold`% or more below the same dates last year (like-for-like stores). */
export interface SalesDropParams {
  scope: StoreScope
  threshold: number // percent, e.g. 20
  period: "yesterday" | "mtd" // mtd = 1st of the month up to yesterday (complete days)
}

/** OUT_OF_STOCK: a product that sold well in the last 28 days is at 0 in a store. */
export interface OutOfStockParams {
  scope: StoreScope
  noosOnly: boolean
  brand: string | null // product brand key from /bi/attributes, null = any
}

/** CAMPAIGN: a campaign starts or ends tomorrow. */
export interface CampaignParams {
  starts: boolean
  ends: boolean
}

export type AlertParams = SalesDropParams | OutOfStockParams | CampaignParams
export type AlertTypeName = "SALES_DROP" | "OUT_OF_STOCK" | "CAMPAIGN"

// ---------- notification data (stored as JSON, turned into text by render.ts) ----------

export interface SalesDropData {
  orgId: number
  storeName: string
  period: SalesDropParams["period"]
  from: string
  to: string
  growth: number // ratio, e.g. -0.27
  sales: number
  previous: number
}

export interface OutOfStockData {
  orgId: number
  storeName: string
  articleId: number
  productName: string
  styleNumber: string | null
  colorCode: string | null
  size: string | null
  color: string | null
  unitsSold: number
  days: number
  /** First suggested transfer source, when there is one */
  sendFrom: { name: string; units: number; isWarehouse: boolean } | null
}

export interface ManyData {
  count: number
  /** Where "see all" should go */
  href: string
  period?: SalesDropParams["period"]
}

export interface CampaignData {
  campaignId: string
  name: string
  date: string
  stores: number
}

export type NotificationKind =
  | "sales_drop"
  | "sales_drop_many"
  | "out_of_stock"
  | "out_of_stock_many"
  | "campaign_starts"
  | "campaign_ends"
  | "campaign_many"
