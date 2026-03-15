'use client'

import { useEffect, useState, useCallback, use } from 'react'
import Link from 'next/link'
import { ProspectionNav } from '@/components/admin/prospection/ProspectionNav'
import { CampaignStatusBadge, ChannelIcon } from '@/components/admin/prospection/StatsCards'
import {
  ArrowLeft,
  Send,
  Pause,
  Play,
  AlertCircle,
  X,
  Users,
  CheckCircle,
  MessageSquare,
  XCircle,
  DollarSign,
  BarChart3,
} from 'lucide-react'
import { ConfirmationModal } from '@/components/admin/ConfirmationModal'
import type { ProspectionCampaign, CampaignStats } from '@/types/prospection'

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [campaign, setCampaign] = useState<ProspectionCampaign | null>(null)
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ action: 'send' | 'pause'; open: boolean }>({ action: 'send', open: false })

  const fetchCampaign = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(`/api/admin/prospection/campaigns/${id}`)
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error?.message || `Error ${res.status}`)
        return
      }
      const data = await res.json()
      if (data.success) {
        setCampaign(data.data)
      } else {
        setError(data.error?.message || 'Campaign not found')
      }
    } catch {
      setError('Unable to load campaign')
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/prospection/campaigns/${id}/stats`)
      if (!res.ok) return
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch {
      // Non-critical
    }
  }, [id])

  useEffect(() => {
    fetchCampaign()
  }, [fetchCampaign])

  useEffect(() => {
    if (campaign) fetchStats()
  }, [campaign, fetchStats])

  const confirmAction = (action: 'send' | 'pause') => {
    setConfirmModal({ action, open: true })
  }

  const handleAction = async (action: 'send' | 'pause' | 'resume') => {
    setActionLoading(action)
    setActionError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch(`/api/admin/prospection/campaigns/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setActionError(data?.error?.message || `Error performing action: ${action}`)
        return
      }
      const data = await res.json()
      if (data.success) {
        const actionLabels: Record<string, string> = {
          send: 'Campaign launched',
          pause: 'Campaign paused',
          resume: 'Campaign resumed',
        }
        setSuccessMsg(actionLabels[action] || 'Action completed')
        setTimeout(() => setSuccessMsg(null), 3000)
        fetchCampaign()
        fetchStats()
      } else {
        setActionError(data.error?.message || 'Error')
      }
    } catch {
      setActionError('Unable to perform action')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Prospection</h1>
        <ProspectionNav />
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-gray-100 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div>
        <div className="mb-6">
          <Link href="/admin/prospection/campaigns" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to campaigns
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Prospection</h1>
        </div>
        <ProspectionNav />
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error || 'Campaign not found'}
        </div>
      </div>
    )
  }

  const sentPercent = campaign.total_recipients > 0
    ? Math.round((campaign.sent_count / campaign.total_recipients) * 100)
    : 0

  const statCards = [
    { label: 'Recipients', value: campaign.total_recipients, icon: Users, color: 'text-blue-600 bg-blue-100' },
    { label: 'Sent', value: campaign.sent_count, icon: Send, color: 'text-green-600 bg-green-100' },
    { label: 'Delivered', value: campaign.delivered_count, icon: CheckCircle, color: 'text-blue-600 bg-blue-100' },
    { label: 'Replies', value: campaign.replied_count, icon: MessageSquare, color: 'text-blue-600 bg-blue-100' },
    { label: 'Failed', value: campaign.failed_count, icon: XCircle, color: 'text-red-600 bg-red-100' },
    { label: 'Cost', value: `$${campaign.actual_cost.toFixed(2)}`, icon: DollarSign, color: 'text-amber-600 bg-amber-100' },
  ]

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/prospection/campaigns" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to campaigns
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
          <CampaignStatusBadge status={campaign.status} />
          <ChannelIcon channel={campaign.channel} className="w-5 h-5 text-gray-400" />
        </div>
        {campaign.description && (
          <p className="text-gray-500 mt-1 text-sm">{campaign.description}</p>
        )}
      </div>

      <ProspectionNav />

      {/* Action messages */}
      {actionError && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {actionError}
          <button onClick={() => setActionError(null)} aria-label="Close error message" className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {successMsg && (
        <div role="status" aria-live="polite" className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMsg}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mb-6">
        {campaign.status === 'draft' && (
          <>
            <Link
              href={`/admin/prospection/campaigns/${campaign.id}`}
              className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
              onClick={(e) => { e.preventDefault(); setError('Edit the fields directly on this page') }}
            >
              Edit
            </Link>
            <button
              onClick={() => confirmAction('send')}
              disabled={actionLoading === 'send'}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> {actionLoading === 'send' ? 'Launching...' : 'Launch campaign'}
            </button>
          </>
        )}
        {campaign.status === 'sending' && (
          <button
            onClick={() => confirmAction('pause')}
            disabled={actionLoading === 'pause'}
            className="flex items-center gap-1 px-4 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            <Pause className="w-4 h-4" /> {actionLoading === 'pause' ? 'Pausing...' : 'Pause'}
          </button>
        )}
        {campaign.status === 'paused' && (
          <button
            onClick={() => handleAction('resume')}
            disabled={actionLoading === 'resume'}
            className="flex items-center gap-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Play className="w-4 h-4" /> {actionLoading === 'resume' ? 'Resuming...' : 'Resume'}
          </button>
        )}
        {campaign.status === 'completed' && (
          <span className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500">
            <BarChart3 className="w-4 h-4" /> Campaign completed
          </span>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{card.label}</span>
                <div className={`p-1.5 rounded-lg ${card.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {typeof card.value === 'number' ? card.value.toLocaleString('en-US') : card.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      {campaign.total_recipients > 0 && (
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Sending progress</span>
            <span className="text-sm text-gray-500">
              {campaign.sent_count.toLocaleString('en-US')} / {campaign.total_recipients.toLocaleString('en-US')} ({sentPercent}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${sentPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template info */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Template</h3>
          {campaign.template ? (
            <div>
              <Link
                href={`/admin/prospection/templates/${campaign.template.id}`}
                className="text-blue-600 hover:underline font-medium text-sm"
              >
                {campaign.template.name}
              </Link>
              <p className="text-xs text-gray-400 mt-1 capitalize">{campaign.template.channel}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No template associated</p>
          )}
        </div>

        {/* List info */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">List</h3>
          {campaign.list ? (
            <div>
              <Link
                href={`/admin/prospection/lists/${campaign.list.id}`}
                className="text-blue-600 hover:underline font-medium text-sm"
              >
                {campaign.list.name}
              </Link>
              <p className="text-xs text-gray-400 mt-1">{campaign.list.contact_count.toLocaleString('en-US')} contacts</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No list associated</p>
          )}
        </div>
      </div>

      {/* Detailed stats (if available) */}
      {stats && (
        <div className="bg-white rounded-lg border p-4 mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Detailed statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Delivery rate</p>
              <p className="font-bold text-gray-900">{stats.delivery_rate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-500">Open rate</p>
              <p className="font-bold text-gray-900">{stats.open_rate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-500">Reply rate</p>
              <p className="font-bold text-gray-900">{stats.reply_rate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-500">Bounce rate</p>
              <p className="font-bold text-gray-900">{stats.bounce_rate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Campaign metadata */}
      <div className="bg-white rounded-lg border p-4 mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Information</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Channel</p>
            <p className="text-gray-900 capitalize flex items-center gap-1">
              <ChannelIcon channel={campaign.channel} className="w-4 h-4 text-gray-400" />
              {campaign.channel === 'whatsapp' ? 'WhatsApp' : campaign.channel.toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Audience</p>
            <p className="text-gray-900 capitalize">{campaign.audience_type}</p>
          </div>
          <div>
            <p className="text-gray-500">Created on</p>
            <p className="text-gray-900">{new Date(campaign.created_at).toLocaleDateString('en-US')}</p>
          </div>
          {campaign.started_at && (
            <div>
              <p className="text-gray-500">Launched on</p>
              <p className="text-gray-900">{new Date(campaign.started_at).toLocaleString('en-US')}</p>
            </div>
          )}
          {campaign.completed_at && (
            <div>
              <p className="text-gray-500">Completed on</p>
              <p className="text-gray-900">{new Date(campaign.completed_at).toLocaleString('en-US')}</p>
            </div>
          )}
          {campaign.scheduled_at && (
            <div>
              <p className="text-gray-500">Scheduled on</p>
              <p className="text-gray-900">{new Date(campaign.scheduled_at).toLocaleString('en-US')}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500">AI auto-reply</p>
            <p className="text-gray-900">{campaign.ai_auto_reply ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-gray-500">Estimated cost</p>
            <p className="text-gray-900">${campaign.estimated_cost.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
        onConfirm={() => { setConfirmModal((prev) => ({ ...prev, open: false })); handleAction(confirmModal.action) }}
        title={confirmModal.action === 'send' ? 'Launch campaign' : 'Pause campaign'}
        message={confirmModal.action === 'send'
          ? 'Are you sure you want to launch this campaign? Messages will be sent to recipients.'
          : 'Are you sure you want to pause this campaign?'}
        confirmText={confirmModal.action === 'send' ? 'Launch' : 'Pause'}
        variant={confirmModal.action === 'send' ? 'warning' : 'info'}
      />
    </div>
  )
}
