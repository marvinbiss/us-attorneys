'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProspectionNav } from '@/components/admin/prospection/ProspectionNav'
import { ChannelIcon } from '@/components/admin/prospection/StatsCards'
import { ArrowLeft, ArrowRight, Send, AlertCircle } from 'lucide-react'
import type {
  ProspectionChannel,
  AudienceType,
  ProspectionTemplate,
  ProspectionList,
  AIProvider,
} from '@/types/prospection'

type Step = 1 | 2 | 3 | 4 | 5

export default function CreateCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [channel, setChannel] = useState<ProspectionChannel>('email')
  const [audienceType, setAudienceType] = useState<AudienceType>('artisan')
  const [templateId, setTemplateId] = useState('')
  const [listId, setListId] = useState('')
  const [aiAutoReply, setAiAutoReply] = useState(false)
  const [aiProvider, setAiProvider] = useState<AIProvider>('claude')
  const [scheduledAt, setScheduledAt] = useState('')

  // Loaded data
  const [templates, setTemplates] = useState<ProspectionTemplate[]>([])
  const [lists, setLists] = useState<ProspectionList[]>([])

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      const [templatesRes, listsRes] = await Promise.all([
        fetch('/api/admin/prospection/templates', { signal }),
        fetch('/api/admin/prospection/lists', { signal }),
      ])
      if (!templatesRes.ok) throw new Error(`Server error templates (${templatesRes.status})`)
      if (!listsRes.ok) throw new Error(`Server error lists (${listsRes.status})`)
      const [templatesData, listsData] = await Promise.all([templatesRes.json(), listsRes.json()])
      if (templatesData.success) setTemplates(templatesData.data)
      if (listsData.success) setLists(listsData.data)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Loading error')
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchData(controller.signal)
    return () => controller.abort()
  }, [fetchData])

  const filteredTemplates = templates.filter(t =>
    t.channel === channel && (!t.audience_type || t.audience_type === audienceType)
  )

  const selectedList = lists.find(l => l.id === listId)
  const selectedTemplate = templates.find(t => t.id === templateId)

  const handleCreate = async () => {
    // Validation
    if (!name.trim()) {
      setError('Campaign name is required')
      return
    }
    if (!templateId) {
      setError('Please select a template')
      return
    }
    if (!listId) {
      setError('Please select a contact list')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/prospection/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          channel,
          audience_type: audienceType,
          template_id: templateId || undefined,
          list_id: listId || undefined,
          ai_auto_reply: aiAutoReply,
          ai_provider: aiProvider,
          scheduled_at: scheduledAt || undefined,
        }),
      })
      if (!res.ok) throw new Error(`Server error (${res.status})`)
      const data = await res.json()
      if (data.success) {
        router.push(`/admin/prospection/campaigns/${data.data.id}`)
      } else {
        setError(data.error?.message || 'Error')
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error creating campaign')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/prospection/campaigns" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to campaigns
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New campaign</h1>
        <p className="text-gray-500 mt-1">Configure and launch your prospection campaign</p>
      </div>

      <ProspectionNav />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              s === step ? 'bg-blue-600 text-white' : s < step ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
            }`}>
              {s}
            </div>
            {s < 5 && <div className={`w-12 h-0.5 ${s < step ? 'bg-green-300' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border p-6">
        {/* Step 1: Channel + Audience */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Campaign name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g. Prospection attorneys NYC"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Channel</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['email', 'sms', 'whatsapp'] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 ${channel === ch ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <ChannelIcon channel={ch} className="w-5 h-5" />
                    <span className="font-medium">{ch === 'whatsapp' ? 'WhatsApp' : ch.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Audience</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['artisan', 'client', 'mairie'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setAudienceType(type)}
                    className={`p-4 rounded-lg border-2 capitalize font-medium ${audienceType === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    {type === 'mairie' ? 'Municipalities' : type === 'artisan' ? 'Attorneys' : 'Clients'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Template */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Choose a template</h3>
            {filteredTemplates.length === 0 ? (
              <p className="text-gray-400 py-4">No template available for this channel. Create one first.</p>
            ) : (
              <div className="space-y-2">
                {filteredTemplates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => setTemplateId(tmpl.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 ${templateId === tmpl.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className="font-medium">{tmpl.name}</div>
                    {tmpl.subject && <div className="text-sm text-gray-500 mt-1">Subject: {tmpl.subject}</div>}
                    <div className="text-xs text-gray-400 mt-1 line-clamp-2">{tmpl.body}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: List */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Choose a contact list</h3>
            {lists.length === 0 ? (
              <p className="text-gray-400 py-4">No contact list. Create one first.</p>
            ) : (
              <div className="space-y-2">
                {lists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => setListId(list.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 ${listId === list.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{list.name}</span>
                      <span className="text-sm text-gray-500">{list.contact_count} contacts</span>
                    </div>
                    {list.description && <div className="text-sm text-gray-400 mt-1">{list.description}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: AI Config */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Automatic AI replies</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={aiAutoReply}
                onChange={(e) => setAiAutoReply(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <div>
                <span className="font-medium">Enable AI replies</span>
                <p className="text-sm text-gray-500">AI will automatically reply to contacts who respond</p>
              </div>
            </label>
            {aiAutoReply && (
              <div>
                <label className="block text-sm font-medium mb-2">AI Provider</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAiProvider('claude')}
                    className={`p-4 rounded-lg border-2 ${aiProvider === 'claude' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  >
                    <div className="font-medium">Claude (Anthropic)</div>
                    <div className="text-xs text-gray-500 mt-1">Excellent quality</div>
                  </button>
                  <button
                    onClick={() => setAiProvider('openai')}
                    className={`p-4 rounded-lg border-2 ${aiProvider === 'openai' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  >
                    <div className="font-medium">GPT-4o (OpenAI)</div>
                    <div className="text-xs text-gray-500 mt-1">Fast and versatile</div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Summary */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Campaign summary</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Channel</span><span className="font-medium capitalize">{channel}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Audience</span><span className="font-medium capitalize">{audienceType}s</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Template</span><span className="font-medium">{selectedTemplate?.name || 'None'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">List</span><span className="font-medium">{selectedList?.name || 'None'} ({selectedList?.contact_count || 0} contacts)</span></div>
              <div className="flex justify-between"><span className="text-gray-500">AI auto-reply</span><span className="font-medium">{aiAutoReply ? `Yes (${aiProvider})` : 'No'}</span></div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Schedule (optional)</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Leave empty to save as draft</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-4 border-t">
          {step > 1 ? (
            <button onClick={() => setStep((step - 1) as Step)} className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
          ) : <div />}

          {step < 5 ? (
            <button
              onClick={() => setStep((step + 1) as Step)}
              disabled={step === 1 && !name}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={saving || !name}
              className="flex items-center gap-2 px-6 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> {saving ? 'Creating...' : 'Create campaign'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
