"use client"

import { useState } from "react"
import { Campaign } from "../types/CampaignTypes"
import Link from "next/link"
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
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
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
            onChange = {(e) => setSelectedChannel(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="All">All Channels</option>
              {channels.map((channel, index) =>(
                <option key={index} value={channel.type}>
                  {channel.type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Campaign</th>
                <th className="px-4 py-3.5">Channel</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Budget</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Nuk u gjet asnjë kampanjë.
                  </td>
                </tr>
              ) : (
                filtered.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-4 py-4">
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600 transition-colors block"
                      >
                        {campaign.name}
                      </Link>
                      <span className="text-xs text-slate-400">
                        {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A'} –{' '}
                        {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {campaign.type}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                            : campaign.status === 'DRAFT'
                            ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
                            : campaign.status === 'PAUSED'
                            ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20'
                            : 'bg-slate-100 text-slate-600 ring-1 ring-slate-500/20'
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-medium text-slate-900">
                      {campaign.budget ? `$${campaign.budget}` : 'N/A'}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/campaigns/${campaign.id}/edit`}
                          className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded transition-colors"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="text-xs font-medium text-blue-600 hover:text-blue-500 px-2.5 py-1.5 rounded"
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
          // Wrap the async Server Action in toast.promise
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-900">{filtered.length > 0 ? 1 : 0}</span> to{' '}
            <span className="font-semibold text-slate-900">{filtered.length}</span> of{' '}
            <span className="font-semibold text-slate-900">{filtered.length}</span> results
          </div>
        </div>
      </div>
    </div>
  )
}