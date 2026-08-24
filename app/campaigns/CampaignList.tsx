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
  Tag
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
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200'

  if (normalized.includes('STORE')) {
    icon = Store
    colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200'
  } else if (normalized.includes('ONLINE') || normalized.includes('ECOMMERCE')) {
    icon = Globe
    colorClass = 'bg-cyan-50 text-cyan-700 border-cyan-200'
  } else if (normalized.includes('SMS')) {
    icon = MessageSquare
    colorClass = 'bg-amber-50 text-amber-700 border-amber-200'
  } else if (normalized.includes('EMAIL')) {
    icon = Mail
    colorClass = 'bg-purple-50 text-purple-700 border-purple-200'
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
  let colorClass = 'bg-slate-100 text-slate-600 border-slate-200'

  if (status === 'ACTIVE') {
    icon = CheckCircle2
    colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200'
  } else if (status === 'PAUSED') {
    icon = PauseCircle
    colorClass = 'bg-blue-50 text-blue-700 border-blue-200'
  } else if (status === 'DRAFT') {
    icon = AlertCircle
    colorClass = 'bg-amber-50 text-amber-700 border-amber-200'
  } else if (status === 'COMPLETED') {
    icon = CheckCircle2
    colorClass = 'bg-slate-100 text-slate-500 border-slate-200'
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

  // 1. Filter by search & store selection FIRST (Base set for dynamic counts)
  const storeFiltered = initialCampaigns.filter((c) => {
    const matchedSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchedStore = selectedStore === "All" ||   (c.participatingStores && c.participatingStores.includes(selectedStore))
    const matchedChannel = selectedChannel === "All" || c.type === selectedChannel

    return matchedSearch && matchedStore && matchedChannel
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Campaigns
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage, filter, and track all marketing campaigns in one place.
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-500 transition-colors"
        >
          + Create New Campaign
        </Link>
      </div>

      {/* Filter Toolbar & Status Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
        {/* Top Status Tabs using dynamic counts from storeFiltered */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto text-sm font-medium">
          <button
            onClick={() => setStatus("All")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              status === "All"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            All ({storeFiltered.length})
          </button>
          <button
            onClick={() => setStatus("ACTIVE")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              status === "ACTIVE"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            Active ({storeFiltered.filter((c) => c.status === "ACTIVE").length})
          </button>
          <button
            onClick={() => setStatus("DRAFT")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              status === "DRAFT"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            Drafts ({storeFiltered.filter((c) => c.status === "DRAFT").length})
          </button>
          <button
            onClick={() => setStatus("PAUSED")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              status === "PAUSED"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            Paused ({storeFiltered.filter((c) => c.status === "PAUSED").length})
          </button>
          <button
            onClick={() => setStatus("COMPLETED")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              status === "COMPLETED"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            Completed ({storeFiltered.filter((c) => c.status === "COMPLETED").length})
          </button>
        </div>

        {/* Search Input + Dynamic Store Dropdown */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by campaign name..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Dynamic Store Filter Dropdown */}
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="All">All Stores</option>
              {stores.map((store) => (
                <option key={store.id} value={store.name}>
                  {store.name}
                </option>
              ))}
            </select>

            <select 
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Rich Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-xs">
          Nuk u gjet asnjë kampanjë.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((campaign) => (
            <div
              key={campaign.id}
              className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-300"
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
                  className="font-semibold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 block"
                >
                  {campaign.name}
                </Link>

                {/* Structured Metadata Rows with Lucide Icons */}
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                      Kohëzgjatja:
                    </span>
                    <span className="font-medium text-slate-700">
                      {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A'} –{' '}
                      {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      Buxheti:
                    </span>
                    <span className="font-semibold text-slate-900">
                      {campaign.budget ? `€${campaign.budget}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      Dyqanet pjesemarrese:
                    </span>
                    <span className="font-semibold text-slate-900">
                      {campaign.participatingStores.length > 1 ? `${campaign.participatingStores.length} Dyqane` : campaign.participatingStores.length === 1 ? campaign.participatingStores[0] : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[11px] font-medium text-slate-400">
                  ID: #{campaign.id}
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/campaigns/${campaign.id}/edit`}
                    className="text-xs cursor-default font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded transition-colors"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="text-xs cursor-default font-medium text-blue-600 bg-slate-100 hover:bg-slate-200 hover:text-blue-500 px-2.5 py-1.5 rounded"
                  >
                    View →
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
                    className="text-xs font-medium text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2.5 py-1.5 rounded transition-colors"
                  >
                    Delete
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