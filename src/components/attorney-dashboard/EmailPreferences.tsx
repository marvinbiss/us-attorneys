'use client'

import { useState, useEffect, useCallback } from 'react'
import { Mail, Bell, BarChart3, XCircle, CheckCircle, Loader2, History } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'

interface EmailPrefs {
  marketing_emails: boolean
  product_updates: boolean
  weekly_stats: boolean
  unsubscribed_at: string | null
}

interface EmailSendRecord {
  id: string
  campaign: string
  step: string
  template: string
  sent_at: string
  opened_at: string | null
  clicked_at: string | null
}

interface EmailPreferencesProps {
  attorneyId: string
}

const CAMPAIGN_LABELS: Record<string, string> = {
  trial_onboarding: 'Trial Onboarding',
  post_conversion: 'Post-Conversion',
  win_back: 'Win-Back',
}

const STEP_LABELS: Record<string, string> = {
  day_0: 'Day 0 — Welcome',
  day_1: 'Day 1 — Complete Profile',
  day_3: 'Day 3 — Profile Views',
  day_7: 'Day 7 — Social Proof',
  day_10: 'Day 10 — Upgrade Reminder',
  day_13: 'Day 13 — Last Day',
  month_1: 'Month 1 — First Month Review',
  month_2: 'Month 2 — Pro Tips',
  month_3: 'Month 3 — Quarterly Review',
}

export default function EmailPreferences({ attorneyId }: EmailPreferencesProps) {
  const [prefs, setPrefs] = useState<EmailPrefs>({
    marketing_emails: true,
    product_updates: true,
    weekly_stats: true,
    unsubscribed_at: null,
  })
  const [history, setHistory] = useState<EmailSendRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = getSupabaseClient()

  // Fetch preferences and email history
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch preferences
      const { data: prefsData } = await supabase
        .from('email_preferences')
        .select('marketing_emails, product_updates, weekly_stats, unsubscribed_at')
        .eq('attorney_id', attorneyId)
        .maybeSingle()

      if (prefsData) {
        setPrefs(prefsData)
      }

      // Fetch email history (last 10)
      const { data: historyData } = await supabase
        .from('email_sends')
        .select('id, campaign, step, template, sent_at, opened_at, clicked_at')
        .eq('attorney_id', attorneyId)
        .order('sent_at', { ascending: false })
        .limit(10)

      if (historyData) {
        setHistory(historyData)
      }
    } catch {
      // Silently fail — tables may not exist yet
    } finally {
      setLoading(false)
    }
  }, [attorneyId, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Update a single preference
  async function updatePref(key: keyof EmailPrefs, value: boolean) {
    setSaving(true)
    setMessage(null)

    const updatedPrefs = { ...prefs, [key]: value, unsubscribed_at: null }

    // If toggling back on, clear unsubscribed_at
    if (value && prefs.unsubscribed_at) {
      updatedPrefs.unsubscribed_at = null
    }

    try {
      const { error } = await supabase
        .from('email_preferences')
        .upsert(
          {
            attorney_id: attorneyId,
            marketing_emails: updatedPrefs.marketing_emails,
            product_updates: updatedPrefs.product_updates,
            weekly_stats: updatedPrefs.weekly_stats,
            unsubscribed_at: updatedPrefs.unsubscribed_at,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'attorney_id' },
        )

      if (error) throw error

      setPrefs(updatedPrefs)
      setMessage({ type: 'success', text: 'Preferences updated.' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to update preferences. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  // Unsubscribe from all
  async function unsubscribeAll() {
    if (!confirm('Are you sure you want to unsubscribe from all marketing emails? You will still receive essential transactional emails.')) {
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('email_preferences')
        .upsert(
          {
            attorney_id: attorneyId,
            marketing_emails: false,
            product_updates: false,
            weekly_stats: false,
            unsubscribed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'attorney_id' },
        )

      if (error) throw error

      setPrefs({
        marketing_emails: false,
        product_updates: false,
        weekly_stats: false,
        unsubscribed_at: new Date().toISOString(),
      })
      setMessage({ type: 'success', text: 'You have been unsubscribed from all marketing emails.' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to unsubscribe. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading email preferences...</span>
        </div>
      </div>
    )
  }

  const isFullyUnsubscribed = !!prefs.unsubscribed_at

  return (
    <div className="space-y-6">
      {/* Preferences Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Email Preferences</h3>
        <p className="text-sm text-gray-500 mb-6">
          Control which emails you receive from US Attorneys. Transactional emails (booking confirmations, security alerts) cannot be disabled.
        </p>

        {/* Status message */}
        {message && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Global unsubscribe banner */}
        {isFullyUnsubscribed && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800 font-medium">
              You are currently unsubscribed from all marketing emails.
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Toggle any preference below to re-subscribe.
            </p>
          </div>
        )}

        {/* Toggle switches */}
        <div className="space-y-4">
          <ToggleRow
            icon={<Mail className="w-5 h-5 text-blue-500" />}
            label="Marketing Emails"
            description="Campaign updates, new features, and promotional offers"
            checked={prefs.marketing_emails}
            disabled={saving}
            onChange={(v) => updatePref('marketing_emails', v)}
          />
          <ToggleRow
            icon={<Bell className="w-5 h-5 text-purple-500" />}
            label="Product Updates"
            description="New platform features, improvements, and tips"
            checked={prefs.product_updates}
            disabled={saving}
            onChange={(v) => updatePref('product_updates', v)}
          />
          <ToggleRow
            icon={<BarChart3 className="w-5 h-5 text-green-500" />}
            label="Weekly Stats"
            description="Weekly summary of profile views, leads, and performance"
            checked={prefs.weekly_stats}
            disabled={saving}
            onChange={(v) => updatePref('weekly_stats', v)}
          />
        </div>

        {/* Unsubscribe all */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={unsubscribeAll}
            disabled={saving || isFullyUnsubscribed}
            className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded"
          >
            Unsubscribe from all marketing emails
          </button>
        </div>
      </div>

      {/* Email History Card */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Email History</h3>
          </div>
          <div className="space-y-3">
            {history.map((email) => (
              <div
                key={email.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {STEP_LABELS[email.step] || email.step}
                  </p>
                  <p className="text-xs text-gray-500">
                    {CAMPAIGN_LABELS[email.campaign] || email.campaign}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-xs text-gray-500">
                    {new Date(email.sent_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 justify-end">
                    {email.opened_at && (
                      <span className="text-xs text-green-600 font-medium">Opened</span>
                    )}
                    {email.clicked_at && (
                      <span className="text-xs text-blue-600 font-medium">Clicked</span>
                    )}
                    {!email.opened_at && !email.clicked_at && (
                      <span className="text-xs text-gray-400">Sent</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Toggle Row Sub-component ─────────────────────────────────────────────────

interface ToggleRowProps {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  disabled: boolean
  onChange: (value: boolean) => void
}

function ToggleRow({ icon, label, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${label}: ${checked ? 'enabled' : 'disabled'}`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
