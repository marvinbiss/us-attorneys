'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProspectionNav } from '@/components/admin/prospection/ProspectionNav'
import { Save, Eye, Tag, ArrowLeft, AlertCircle } from 'lucide-react'
import type { ProspectionChannel, AudienceType } from '@/types/prospection'

const VARIABLES = [
  { key: 'contact_name', label: 'Name' },
  { key: 'company_name', label: 'Company' },
  { key: 'city', label: 'City' },
  { key: 'department', label: 'State' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'date', label: 'Today\'s date' },
  { key: 'unsubscribe_link', label: 'Unsubscribe link' },
]

export default function CreateTemplatePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [channel, setChannel] = useState<ProspectionChannel>('email')
  const [audienceType, setAudienceType] = useState<AudienceType | ''>('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')

  const smsOverLimit = channel === 'sms' && body.length > 160

  const insertVariable = (key: string) => {
    setBody(prev => prev + `{{${key}}}`)
  }

  const handlePreview = async () => {
    setError(null)
    try {
      const res = await fetch('/api/admin/prospection/templates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, subject }),
      })
      if (!res.ok) throw new Error(`Server error (${res.status})`)
      const data = await res.json()
      if (data.success && data.data) setPreview(data.data.rendered_body)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error generating preview')
      }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/prospection/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          channel,
          audience_type: audienceType || undefined,
          subject: subject || undefined,
          body,
          ai_system_prompt: aiPrompt || undefined,
        }),
      })
      if (!res.ok) throw new Error(`Server error (${res.status})`)
      const data = await res.json()
      if (data.success) {
        router.push('/admin/prospection/templates')
      } else {
        setError(data.error?.message || 'Error')
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error saving template')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/prospection/templates" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to templates
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New template</h1>
      </div>

      <ProspectionNav />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <div className="lg:col-span-2 bg-white rounded-lg border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Template name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="E.g., Attorney invitation" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Channel</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value as ProspectionChannel)} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Audience (optional)</label>
              <select value={audienceType} onChange={(e) => setAudienceType(e.target.value as AudienceType | '')} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">All</option>
                <option value="attorney">Attorneys</option>
                <option value="client">Clients</option>
                <option value="municipality">Municipalities</option>
              </select>
            </div>
          </div>

          {channel === 'email' && (
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ex: Rejoignez US Attorneys, {{contact_name}} !" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Message body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className={`w-full px-3 py-2 border rounded-lg text-sm font-mono ${smsOverLimit ? 'border-red-300 bg-red-50' : ''}`}
              placeholder={channel === 'sms' ? 'Max 160 characters for 1 SMS' : 'Message content...'}
            />
            {channel === 'sms' && (
              <p className={`text-xs mt-1 ${smsOverLimit ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                {body.length}/160 characters ({Math.ceil(body.length / 160 || 1)} SMS)
                {smsOverLimit && ' — 160 character limit exceeded'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">AI prompt for replies (optional)</label>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Specific instructions for the AI when replying to contacts from this campaign..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button onClick={handlePreview} className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name || !body || smsOverLimit}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Sidebar: Variables + Preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4" /> Available variables
            </h3>
            <div className="space-y-1">
              {VARIABLES.map((v) => (
                <button
                  key={v.key}
                  onClick={() => insertVariable(v.key)}
                  className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-blue-50 text-blue-600"
                >
                  <code className="text-xs">{`{{${v.key}}}`}</code>
                  <span className="text-gray-500 ml-2">{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {preview && (
            <div className="bg-white rounded-lg border p-4">
              <h3 className="text-sm font-medium mb-3">Preview</h3>
              <div className="text-sm bg-gray-50 rounded p-3 whitespace-pre-wrap">{preview}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
