'use client'

import { useEffect, useState, useCallback } from 'react'
import { ProspectionNav } from '@/components/admin/prospection/ProspectionNav'
import { StatsCards } from '@/components/admin/prospection/StatsCards'
import { AlertCircle } from 'lucide-react'
import type { OverviewStats, ChannelPerformance } from '@/types/prospection'

export default function ProspectionDashboard() {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [channels, setChannels] = useState<ChannelPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async (signal?: AbortSignal) => {
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
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError('Loading error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchStats(controller.signal)
    return () => controller.abort()
  }, [fetchStats])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Prospection</h1>
        <p className="text-gray-500 mt-1">Tableau de bord de prospection multi-canal</p>
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

      {/* Performance par canal */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance par canal</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {channels.map((ch) => (
            <div key={ch.channel} className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-medium capitalize">{ch.channel === 'whatsapp' ? 'WhatsApp' : ch.channel.toUpperCase()}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Envoyés</span>
                  <span className="font-medium">{ch.sent.toLocaleString('en-US')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Livrés</span>
                  <span className="font-medium">{ch.delivered.toLocaleString('en-US')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Réponses</span>
                  <span className="font-medium">{ch.replied.toLocaleString('en-US')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Taux livraison</span>
                  <span className="font-medium text-green-600">{ch.delivery_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Taux réponse</span>
                  <span className="font-medium text-blue-600">{ch.reply_rate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
          {!loading && channels.length === 0 && (
            <div className="col-span-3 text-center py-8 text-gray-400">
              No data available. Launch your first campaign.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
