"use client"

import { useState } from "react"
import { Campaign } from "../types/CampaignTypes"
import Link from "next/link"
import {
  Store,
  Globe,
  MessageSquare,
  Mail,
  CalendarDays,
  Clock,
  CheckCircle2,
  PauseCircle,
  FileText,
  AlertCircle,
  Tag,
  Calendar, 
  ArrowRight, 
  X,
  Pencil, 
  Eye, 
  Trash2,
  TrendingUp
} from 'lucide-react'
import { deleteCampaign } from "./actions"
import { toast } from "sonner"

interface Store {
  id: string
  name: string
}

interface CampaignListProps {
  initialCampaigns?: Campaign[]
  stores?: Store[]
  channels?: { type: string }[]
}

// Helper for Channel Icons & Badges
function ChannelBadge({ type }: { type: string }) {
  const normalized = type?.toUpperCase() || ''
  
  let icon = Tag
  let colorClass = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'

  if (normalized.includes('STORE')) {
    icon = Store
    colorClass = 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60'
  } else if (normalized.includes('ONLINE') || normalized.includes('ECOMMERCE')) {
    icon = Globe
    colorClass = 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/60'
  } else if (normalized.includes('SMS')) {
    icon = MessageSquare
    colorClass = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
  } else if (normalized.includes('EMAIL')) {
    icon = Mail
    colorClass = 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/60'
  }

  const IconComponent = icon

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${colorClass}`}>
      <IconComponent className="h-3 w-3" />
      {type}
    </span>
  )
}

// Helper for Status Badges
function StatusBadge({ status }: { status: string }) {
  let icon = FileText
  let colorClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'

  if (status === 'ACTIVE') {
    icon = CheckCircle2
    colorClass = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
  } else if (status === 'PAUSED') {
    icon = PauseCircle
    colorClass = 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60'
  } else if (status === 'DRAFT') {
    icon = AlertCircle
    colorClass = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
  } else if (status === 'COMPLETED') {
    icon = CheckCircle2
    colorClass = 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
  }

  const IconComponent = icon

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${colorClass}`}>
      <IconComponent className="h-3 w-3" />
      {status}
    </span>
  )
}

export default function CampaignList({
  initialCampaigns = [],
  stores = [],
  channels = [],
}: CampaignListProps) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("All")
  const [selectedStore, setSelectedStore] = useState("All")
  const [selectedChannel, setSelectedChannel] = useState("All")
  const [startDateFilter, setStartDateFilter] = useState("")
  const [endDateFilter, setEndDateFilter] = useState("")

  // 1. Filter by search & store selection FIRST (Base set for dynamic counts)
  const storeFiltered = initialCampaigns.filter((c) => {
    const matchedSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchedStore = selectedStore === "All" || (c.participatingStores && c.participatingStores.includes(selectedStore))
    const matchedChannel = selectedChannel === "All" || c.type === selectedChannel
    
    // Date Range Overlap Logic
    let matchedDate = true

    if (c.startDate && c.endDate) {
      const campaignStart = new Date(c.startDate).getTime()
      const campaignEnd = new Date(c.endDate).getTime()

      if (startDateFilter) {
        const filterStart = new Date(startDateFilter).setHours(0, 0, 0, 0)
        if (campaignEnd < filterStart) matchedDate = false
      }

      if (endDateFilter && matchedDate) {
        const filterEnd = new Date(endDateFilter).setHours(23, 59, 59, 999)
        if (campaignStart > filterEnd) matchedDate = false
      }
    }

    return matchedSearch && matchedStore && matchedChannel && matchedDate
  })

  // 2. Filter by status tab SECOND (Final set for table view)
  const filtered = storeFiltered.filter((c) => {
    return status === "All" || c.status === status
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Campaigns
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage, filter, and track all marketing campaigns in one place.
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-500 dark:hover:bg-blue-500 transition-colors"
        >
          + Create New Campaign
        </Link>
      </div>

      {/* Filter Toolbar & Status Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-4">
        {/* Top Status Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto text-sm font-medium">
          <button
            onClick={() => setStatus("All")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              status === "All"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            All ({storeFiltered.length})
          </button>
          <button
            onClick={() => setStatus("ACTIVE")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              status === "ACTIVE"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            Active ({storeFiltered.filter((c) => c.status === "ACTIVE").length})
          </button>
          <button
            onClick={() => setStatus("DRAFT")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              status === "DRAFT"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            Drafts ({storeFiltered.filter((c) => c.status === "DRAFT").length})
          </button>
          <button
            onClick={() => setStatus("PAUSED")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              status === "PAUSED"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            Paused ({storeFiltered.filter((c) => c.status === "PAUSED").length})
          </button>
          <button
            onClick={() => setStatus("COMPLETED")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              status === "COMPLETED"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            Completed ({storeFiltered.filter((c) => c.status === "COMPLETED").length})
          </button>
        </div>

        {/* Search Input + Dynamic Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 dark:border-slate-500">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by campaign name..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </span>
          </div>

          {/* Date Range Filters */}
          <div className="w-full sm:w-auto">
            <div className="bg-slate-50/80 dark:bg-slate-800/60 p-2 sm:p-1.5 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl sm:rounded-xl shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                {/* Start Date */}
                <div className="relative flex items-center w-full sm:w-auto">
                  <Calendar className="absolute left-3 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="w-full sm:w-36 pl-9 pr-3 py-2 sm:py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 sm:border-0 rounded-xl sm:rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-2xs ring-0 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer appearance-none min-h-[38px] sm:min-h-0"
                  />
                </div>

                {/* Arrow Separator */}
                <div className="hidden sm:flex items-center justify-center shrink-0">
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                </div>

                {/* End Date */}
                <div className="relative flex items-center w-full sm:w-auto">
                  <Calendar className="absolute left-3 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="w-full sm:w-36 pl-9 pr-3 py-2 sm:py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 sm:border-0 rounded-xl sm:rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-2xs ring-0 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer appearance-none min-h-[38px] sm:min-h-0"
                  />
                </div>

                {/* Clear Action */}
                {(startDateFilter || endDateFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDateFilter("")
                      setEndDateFilter("")
                    }}
                    className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-200/60 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl sm:rounded-lg transition-colors cursor-pointer mt-1 sm:mt-0"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span className="sm:hidden">Reset Dates</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Store Dropdown */}
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
            >
              <option value="All">All Stores</option>
              {stores.map((store) => (
                <option key={store.id} value={store.name}>
                  {store.name}
                </option>
              ))}
            </select>

            {/* Channel Dropdown */}
            <select 
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All Channels</option>
              {channels.map((channel, index) => (
                <option key={index} value={channel.type}>
                  {channel.type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-400 dark:text-slate-500 shadow-xs">
          Nuk u gjet asnjë kampanjë.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((campaign) => (
            <div
              key={campaign.id}
              className="group relative flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all hover:shadow-md dark:hover:border-slate-700 hover:border-slate-300"
            >
              <div>
                {/* Header Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <ChannelBadge type={campaign.type} />
                  <StatusBadge status={campaign.status} />
                </div>

                {/* Campaign Name */}
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="font-semibold text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 block"
                >
                  {campaign.name}
                </Link>

                {/* Structured Metadata Rows */}
                <div className="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      Kohëzgjatja:
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString('en-GB') : 'N/A'} –{' '}
                      {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString('en-GB') : 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Store className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      Buxheti:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {campaign.budget ? `€${campaign.budget}` : 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      Dyqanet pjesemarrese:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {campaign.participatingStores.length > 1 ? `${campaign.participatingStores.length} Dyqane` : campaign.participatingStores.length === 1 ? campaign.participatingStores[0] : 'N/A'}
                    </span>
                  </div>

                  {/* Dynamic Gross Revenue Display */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      Qarkullimi Bruto:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      €{(campaign.grossRevenue ?? 0).toLocaleString("de-DE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  ID: #{campaign.id}
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/campaigns/${campaign.id}/edit`}
                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    onClick={() => {
                      toast('Delete item permanently?', {
                        duration: Infinity,
                        action: {
                          label: 'Delete',
                          onClick: () => {
                            toast.promise(deleteCampaign(campaign.id), {
                              loading: 'Deleting campaign...',
                              success: 'Campaign deleted successfully!',
                              error: 'Failed to delete campaign.',
                            });
                          },
                        },
                        cancel: {
                          label: 'Cancel',
                          onClick: () => {
                            toast.info('Deletion cancelled.', { duration: 2000 });
                          },
                        },
                      });
                    }}
                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}