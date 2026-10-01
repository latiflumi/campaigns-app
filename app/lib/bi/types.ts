// app/lib/bi/types.ts
// Response shapes of the erp-api /bi/* endpoints (see erp-api README for metric definitions).

export interface BiMetrics {
  sales: number // payments incl. VAT
  netSales: number
  units: number
  cost: number
  grossProfit: number
  marginPct: number | null
  markdownAmount: number
  markdownPct: number | null
  receipts: number
  atv: number | null
  upt: number | null
}

export interface BiStoreMeta {
  orgId: number
  name: string
  firstSaleDate: string | null
  lastSaleDate: string | null
  stockUnits: number
  itemsInStock: number
}

export interface BiStoreRow {
  orgId: number
  name: string
  firstSaleDate: string | null
  lfl: boolean
  current: BiMetrics
  previous: BiMetrics
}

export interface BiComparison {
  mode: "ly" | "lyw" | "pp" | "custom"
  from: string
  to: string
}

export interface BiSummary {
  period: { from: string; to: string; days: number }
  comparison: BiComparison
  /** 'lines' when a product filter is on: sales = matching items' value incl. VAT, not payments */
  salesBasis: "payments" | "lines"
  totals: { current: BiMetrics; previous: BiMetrics }
  lfl: { storeCount: number; current: BiMetrics; previous: BiMetrics }
  stores: BiStoreRow[]
}

export interface BiTimeseries {
  grain: "day" | "week"
  comparison: BiComparison
  points: {
    bucketStart: string
    bucketEnd: string
    /** null when the comparison period is shorter than this one */
    previousStart: string | null
    previousEnd?: string | null
    sales: number
    units: number
    previousSales: number
    previousUnits: number
  }[]
}

export interface BiCategorySide {
  sales: number
  netSales: number
  units: number
  marginPct: number | null
  sharePct: number | null
}

/** Stock on hand now in the selected stores; missing from erp-api builds before stock per category */
export interface BiCategoryStock {
  units: number
  retailValue: number // at shelf price incl. VAT
  costValue: number
  sharePct: number | null // share of the stores' stock value
  weeksCover: number | null
}

export interface BiCategories {
  comparison: BiComparison
  stockTotal?: { retailValue: number }
  categories: { category: string; current: BiCategorySide; previous: BiCategorySide; stock?: BiCategoryStock }[]
}

/** Product attributes from the ERP (Artikujt K2..K5, BrendId). Labels are the ERP's own. */
export interface BiItemAttributes {
  color: string | null
  size: string | null
  gender: string | null // ERP label: Femra, Meshkuj, Djem, Vajza, Femije, Unisex
  season: string | null // "NOOS", "Sep 2026", ...
  brand: string | null // brand group, e.g. "Jack & Jones"
  subBrand: string | null // e.g. "JACK&JONES PREMIUM"
  colorCode?: string | null // K41 colour code, e.g. "3909943" (product image file name)
}

export interface BiProduct extends BiItemAttributes {
  articleId: number
  styleNumber: string | null
  productName: string
  category: string | null
  sales: number
  netSales: number
  units: number
  marginPct: number | null // over the lines that have a cost in the ERP
  /** Some (or all) sales had no cost in the ERP; missing from older erp-api builds */
  costMissing?: boolean
  stockOnHand: number
  /** Units sold per store in the period, biggest first; missing from older erp-api builds */
  stores?: { orgId: number; storeName: string; units: number }[]
}

export interface BiStockAlert extends BiItemAttributes {
  kind: "out" | "low" | "slow"
  orgId: number
  storeName: string
  articleId: number
  styleNumber: string | null
  productName: string
  category: string | null
  stock: number
  unitsSold: number
  weeksCover: number | null
  /** 'slow' only: last time stock of this item arrived in the store */
  lastDeliveryDate: string | null
  /** 'out'/'low' only: units needed to reach `window.coverWeeks` of this store's own sales */
  transferNeed?: number // missing from erp-api builds before suggested quantities
  /**
   * 'out'/'low' only: up to 2 places with spare stock (more than their own next 4 weeks of sales).
   * `send` = suggested units from that place (most spare first, never more than its spare).
   */
  transferFrom: { orgId: number; storeName: string; spare: number; send: number; isWarehouse: boolean }[]
}

export interface BiStockAlerts {
  window: { days: number; minUnits: number; slowStock: number; coverWeeks: number }
  alerts: BiStockAlert[]
}

export interface BiSegmentRow {
  key: string
  name: string
  current: BiCategorySide
  previous: BiCategorySide
}

export interface BiSegments {
  comparison: BiComparison
  gender: BiSegmentRow[]
  season: BiSegmentRow[] // keys: 'noos', collection year '26', 'other'
  brand: BiSegmentRow[]
}

export interface BiAttributes {
  window: { days: number }
  genders: { id: number; name: string; sales: number }[]
  seasons: {
    noos: { key: string; label: string; sales: number }
    years: { key: string; label: string; sales: number }[]
    collections: { key: string; label: string; sales: number }[]
  }
  brands: { key: string; name: string; brandIds: number[]; subBrands: string[]; sales: number }[]
}
