'use client'

import { useEffect, useState, useCallback } from 'react'
import { ProspectionNav } from '@/components/admin/prospection/ProspectionNav'
import { StatsCards } from '@/components/admin/prospection/StatsCards'
import { AlertCircle } from 'lucide-react'
import type { OverviewStats, ChannelPerformance } from '@/types/prospection'

export default function AnalyticsPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [channels, setChannels] = useState<ChannelPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null)
      const res = await fetch('/api/admin/prospection/analytics', { signal })
      if (!res.ok) throw new Error(`Server error (${res.status})`)
      const data = await res.json()
      if (data.success) {
        setStats(data.data.overview)
        setChannels(data.data.channels)
      } else {
        setError(data.error?.message || 'Loading error')
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError('Loading error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchAnalytics(controller.signal)
    return () => controller.abort()
  }, [fetchAnalytics])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Prospection</h1>
        <p className="text-gray-500 mt-1">Statistics and analytics</p>
      </div>

      <ProspectionNav />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      <StatsCards stats={stats} loading={loading} />

      {/* Detailed table by channel */}
      <div className="mt-8 bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-semibold">Detail by channel</h2>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm" aria-label="Channel performance detail">
          <thead>
            <tr className="border-b">
              <th scope="col" className="text-left px-4 py-3 font-medium text-gray-500">Channel</th>
              <th scope="col" className="text-right px-4 py-3 font-medium text-gray-500">Sent</th>
              <th scope="col" className="text-right px-4 py-3 font-medium text-gray-500">Delivered</th>
              <th scope="col" className="text-right px-4 py-3 font-medium text-gray-500">Replies</th>
              <th scope="col" className="text-right px-4 py-3 font-medium text-gray-500">Failed</th>
              <th scope="col" className="text-right px-4 py-3 font-medium text-gray-500">Delivery rate</th>
              <th scope="col" className="text-right px-4 py-3 font-medium text-gray-500">Reply rate</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {channels.map((ch) => (
              <tr key={ch.channel}>
                <td className="px-4 py-3 font-medium capitalize">{ch.channel === 'whatsapp' ? 'WhatsApp' : ch.channel.toUpperCase()}</td>
                <td className="px-4 py-3 text-right">{ch.sent.toLocaleString('en-US')}</td>
                <td className="px-4 py-3 text-right">{ch.delivered.toLocaleString('en-US')}</td>
                <td className="px-4 py-3 text-right">{ch.replied.toLocaleString('en-US')}</td>
                <td className="px-4 py-3 text-right text-red-500">{ch.failed.toLocaleString('en-US')}</td>
                <td className="px-4 py-3 text-right text-green-600">{ch.delivery_rate.toFixed(1)}%</td>
                <td className="px-4 py-3 text-right text-blue-600">{ch.reply_rate.toFixed(1)}%</td>
              </tr>
            ))}
            {channels.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
