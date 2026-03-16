'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ProspectionNav } from '@/components/admin/prospection/ProspectionNav'
import { CampaignStatusBadge, ChannelIcon } from '@/components/admin/prospection/StatsCards'
import { Plus, AlertCircle } from 'lucide-react'
import type { ProspectionCampaign } from '@/types/prospection'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<ProspectionCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchCampaigns = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      setError(null)
      const params = new URLSearchParams({ status: statusFilter })
      const res = await fetch(`/api/admin/prospection/campaigns?${params}`, { signal })
      if (!res.ok) throw new Error(`Server error (${res.status})`)
      const data = await res.json()
      if (data.success) {
        setCampaigns(data.data)
      } else {
        setError(data.error?.message || 'Loading error')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError('Loading error')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    const controller = new AbortController()
    fetchCampaigns(controller.signal)
    return () => controller.abort()
  }, [fetchCampaigns])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospection</h1>
          <p className="text-gray-500 mt-1">Campaign management</p>
        </div>
        <Link
          href="/admin/prospection/campaigns/create"
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New campaign
        </Link>
      </div>

      <ProspectionNav />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {['all', 'draft', 'sending', 'paused', 'completed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg border ${statusFilter === s ? 'bg-blue-50 border-blue-200 text-blue-700' : 'hover:bg-gray-50'}`}
          >
            {s === 'all' ? 'All' : s === 'draft' ? 'Drafts' : s === 'sending' ? 'Sending' : s === 'paused' ? 'Paused' : 'Completed'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm" aria-label="Prospection campaigns list">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="text-left px-4 py-3 font-medium text-gray-500">Campaign</th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-gray-500">Channel</th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th scope="col" className="text-right px-4 py-3 font-medium text-gray-500">Sent</th>
              <th scope="col" className="text-right px-4 py-3 font-medium text-gray-500">Delivered</th>
              <th scope="col" className="text-right px-4 py-3 font-medium text-gray-500">Replies</th>
              <th scope="col" className="text-right px-4 py-3 font-medium text-gray-500">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No campaigns. Create your first prospection campaign.
                </td>
              </tr>
            ) : (
              campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/prospection/campaigns/${camp.id}`} className="font-medium text-blue-600 hover:underline">
                      {camp.name}
                    </Link>
                    <div className="text-xs text-gray-400 capitalize">{camp.audience_type}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <ChannelIcon channel={camp.channel} className="w-4 h-4 text-gray-400" />
                      <span className="capitalize">{camp.channel === 'whatsapp' ? 'WhatsApp' : camp.channel.toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><CampaignStatusBadge status={camp.status} /></td>
                  <td className="px-4 py-3 text-right">{camp.sent_count.toLocaleString('en-US')}</td>
                  <td className="px-4 py-3 text-right">{camp.delivered_count.toLocaleString('en-US')}</td>
                  <td className="px-4 py-3 text-right">{camp.replied_count.toLocaleString('en-US')}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{camp.actual_cost.toFixed(2)} €</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
