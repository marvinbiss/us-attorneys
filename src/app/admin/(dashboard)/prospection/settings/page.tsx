'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { ProspectionNav } from '@/components/admin/prospection/ProspectionNav'
import { Bot, Save, AlertCircle } from 'lucide-react'
import type { ProspectionAISettings } from '@/types/prospection'

export default function SettingsPage() {
  const [settings, setSettings] = useState<ProspectionAISettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const initialSettingsRef = useRef<string>('')

  const fetchSettings = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null)
      const res = await fetch('/api/admin/prospection/ai/settings', { signal })
      if (!res.ok) throw new Error(`Server error (${res.status})`)
      const data = await res.json()
      if (data.success) {
        setSettings(data.data)
        initialSettingsRef.current = JSON.stringify(data.data)
        setHasUnsavedChanges(false)
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
    fetchSettings(controller.signal)
    return () => controller.abort()
  }, [fetchSettings])

  const validateSettings = (): string | null => {
    if (!settings) return null
    if (settings.claude_temperature < 0 || settings.claude_temperature > 2) {
      return 'Claude temperature must be between 0 and 2'
    }
    if (settings.openai_temperature < 0 || settings.openai_temperature > 2) {
      return 'OpenAI temperature must be between 0 and 2'
    }
    if (settings.claude_max_tokens < 1 || settings.claude_max_tokens > 8000) {
      return 'Claude max tokens must be between 1 and 8000'
    }
    if (settings.openai_max_tokens < 1 || settings.openai_max_tokens > 8000) {
      return 'OpenAI max tokens must be between 1 and 8000'
    }
    return null
  }

  const handleSave = async () => {
    if (!settings) return
    const validationError = validateSettings()
    if (validationError) {
      setError(validationError)
      return
    }
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch('/api/admin/prospection/ai/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error(`Server error (${res.status})`)
      const data = await res.json()
      if (data.success) {
        setSettings(data.data)
        initialSettingsRef.current = JSON.stringify(data.data)
        setHasUnsavedChanges(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(data.error?.message || 'Error saving settings')
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error saving settings')
      }
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: string, value: unknown) => {
    setSettings(prev => {
      if (!prev) return prev
      const updated = { ...prev, [field]: value }
      setHasUnsavedChanges(JSON.stringify(updated) !== initialSettingsRef.current)
      return updated
    })
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Prospection</h1>
        <ProspectionNav />
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-100 rounded-lg" />
          <div className="h-48 bg-gray-100 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospection</h1>
          <p className="text-gray-500 mt-1">AI and channel configuration</p>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="text-sm text-amber-600 font-medium">Unsaved changes</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      <ProspectionNav />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {settings && (
        <div className="space-y-6">
          {/* Default provider */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Bot className="w-5 h-5" /> AI Configuration
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Default provider</label>
                <select
                  value={settings.default_provider}
                  onChange={(e) => updateField('default_provider', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="claude">Claude (Anthropic)</option>
                  <option value="openai">GPT-4o (OpenAI)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max auto-replies per conversation</label>
                <input
                  type="number"
                  value={settings.max_auto_replies}
                  onChange={(e) => updateField('max_auto_replies', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  min={1}
                  max={20}
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={settings.auto_reply_enabled}
                onChange={(e) => updateField('auto_reply_enabled', e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium">Enable AI auto-replies (global)</span>
            </label>

            <div>
              <label className="block text-sm font-medium mb-1">Escalation keywords (human handoff)</label>
              <input
                type="text"
                value={settings.escalation_keywords.join(', ')}
                onChange={(e) => updateField('escalation_keywords', e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="urgent, complaint, lawyer, gdpr..."
              />
              <p className="text-xs text-gray-400 mt-1">Comma-separated. If a message contains any of these keywords, the conversation will be assigned to a human.</p>
            </div>
          </div>

          {/* Prompts by audience */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">System prompts by audience</h2>

            {(['attorney', 'client', 'municipality'] as const).map((type) => {
              const field = `${type}_system_prompt` as keyof ProspectionAISettings
              return (
                <div key={type} className="mb-4">
                  <label className="block text-sm font-medium mb-1 capitalize">Prompt {type}s</label>
                  <textarea
                    value={settings[field] as string}
                    onChange={(e) => updateField(field, e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              )
            })}
          </div>

          {/* Claude config */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Claude (Anthropic)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Model</label>
                <input type="text" value={settings.claude_model} onChange={(e) => updateField('claude_model', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max tokens (1-8000)</label>
                <input
                  type="number"
                  value={settings.claude_max_tokens}
                  onChange={(e) => updateField('claude_max_tokens', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${settings.claude_max_tokens < 1 || settings.claude_max_tokens > 8000 ? 'border-red-300 bg-red-50' : ''}`}
                  min={1}
                  max={8000}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Temperature (0-2)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.claude_temperature}
                  onChange={(e) => updateField('claude_temperature', parseFloat(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${settings.claude_temperature < 0 || settings.claude_temperature > 2 ? 'border-red-300 bg-red-50' : ''}`}
                  min={0}
                  max={2}
                />
              </div>
              <div className="flex items-end">
                <span className={`text-sm ${settings.claude_api_key_set ? 'text-green-600' : 'text-red-500'}`}>
                  {settings.claude_api_key_set ? 'API Key configured' : 'API Key missing (ANTHROPIC_API_KEY)'}
                </span>
              </div>
            </div>
          </div>

          {/* OpenAI config */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">GPT-4o (OpenAI)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Model</label>
                <input type="text" value={settings.openai_model} onChange={(e) => updateField('openai_model', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max tokens (1-8000)</label>
                <input
                  type="number"
                  value={settings.openai_max_tokens}
                  onChange={(e) => updateField('openai_max_tokens', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${settings.openai_max_tokens < 1 || settings.openai_max_tokens > 8000 ? 'border-red-300 bg-red-50' : ''}`}
                  min={1}
                  max={8000}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Temperature (0-2)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.openai_temperature}
                  onChange={(e) => updateField('openai_temperature', parseFloat(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${settings.openai_temperature < 0 || settings.openai_temperature > 2 ? 'border-red-300 bg-red-50' : ''}`}
                  min={0}
                  max={2}
                />
              </div>
              <div className="flex items-end">
                <span className={`text-sm ${settings.openai_api_key_set ? 'text-green-600' : 'text-red-500'}`}>
                  {settings.openai_api_key_set ? 'API Key configured' : 'API Key missing (OPENAI_API_KEY)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
