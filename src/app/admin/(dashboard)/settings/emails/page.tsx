'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  Mail,
  Edit2,
  Eye,
  Save,
  Check,
} from 'lucide-react'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  description: string
  variables: string[]
  content: string
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome',
    subject: 'Welcome to US Attorneys',
    description: 'Email sent after registration',
    variables: ['{{user_name}}', '{{verify_link}}'],
    content: `Hello {{user_name}},

Welcome to US Attorneys! We are delighted to have you on board.

To get started, please verify your email by clicking the link below:
{{verify_link}}

If you have any questions, do not hesitate to contact us.

The US Attorneys Team`,
  },
  {
    id: 'password_reset',
    name: 'Password Reset',
    subject: 'Reset your password',
    description: 'Email to reset password',
    variables: ['{{user_name}}', '{{reset_link}}', '{{expiry_time}}'],
    content: `Hello {{user_name}},

You have requested a password reset.

Click the link below to choose a new password:
{{reset_link}}

This link expires in {{expiry_time}}.

If you did not request this, please ignore this email.

The US Attorneys Team`,
  },
  {
    id: 'booking_confirmation',
    name: 'Booking Confirmation',
    subject: 'Your booking confirmation',
    description: 'Email sent after a booking',
    variables: ['{{user_name}}', '{{attorney_name}}', '{{service}}', '{{date}}', '{{time}}'],
    content: `Hello {{user_name}},

Your booking has been confirmed!

Details:
- Attorney: {{attorney_name}}
- Service: {{service}}
- Date: {{date}}
- Time: {{time}}

The attorney will contact you to confirm the final details.

The US Attorneys Team`,
  },
  {
    id: 'quote_request',
    name: 'New Consultation Request',
    subject: 'New consultation request',
    description: 'Email sent to the attorney for a consultation request',
    variables: ['{{attorney_name}}', '{{client_name}}', '{{service}}', '{{description}}', '{{dashboard_link}}'],
    content: `Hello {{attorney_name}},

You have received a new consultation request!

Client: {{client_name}}
Service: {{service}}
Description: {{description}}

Log in to your dashboard to respond:
{{dashboard_link}}

The US Attorneys Team`,
  },
  {
    id: 'review_notification',
    name: 'New Review',
    subject: 'You have received a new review',
    description: 'Email sent to the attorney for a new review',
    variables: ['{{attorney_name}}', '{{rating}}', '{{review_text}}', '{{client_name}}'],
    content: `Hello {{attorney_name}},

You have received a new review from {{client_name}}!

Rating: {{rating}}/5
Comment: {{review_text}}

Keep up the great work!

The US Attorneys Team`,
  },
]

const STORAGE_KEY = 'admin_email_templates'

function loadTemplates(): EmailTemplate[] {
  if (typeof window === 'undefined') return EMAIL_TEMPLATES
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return EMAIL_TEMPLATES
    const saved = JSON.parse(stored) as Record<string, { subject: string; content: string }>
    return EMAIL_TEMPLATES.map(t => {
      const override = saved[t.id]
      return override ? { ...t, subject: override.subject, content: override.content } : t
    })
  } catch {
    return EMAIL_TEMPLATES
  }
}

function saveTemplates(templates: EmailTemplate[]) {
  const overrides: Record<string, { subject: string; content: string }> = {}
  for (const t of templates) {
    const original = EMAIL_TEMPLATES.find(o => o.id === t.id)
    if (original && (t.subject !== original.subject || t.content !== original.content)) {
      overrides[t.id] = { subject: t.subject, content: t.content }
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
}

export default function EmailTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState(EMAIL_TEMPLATES)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load persisted templates on mount
  useEffect(() => {
    setTemplates(loadTemplates())
  }, [])

  const handleEdit = (template: EmailTemplate) => {
    setEditingId(template.id)
    setEditContent(template.content)
    setEditSubject(template.subject)
    setPreviewId(null)
  }

  const handleSave = () => {
    if (!editingId) return

    setSaving(true)
    const updated = templates.map(t =>
      t.id === editingId
        ? { ...t, content: editContent, subject: editSubject }
        : t
    )
    setTemplates(updated)
    saveTemplates(updated)

    setEditingId(null)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditContent('')
    setEditSubject('')
  }

  const handlePreview = (template: EmailTemplate) => {
    setPreviewId(previewId === template.id ? null : template.id)
    setEditingId(null)
  }

  const getPreviewContent = (template: EmailTemplate) => {
    let preview = template.content
    // Replace variables with example values
    preview = preview.replace(/\{\{user_name\}\}/g, 'John Smith')
    preview = preview.replace(/\{\{attorney_name\}\}/g, 'James Johnson')
    preview = preview.replace(/\{\{client_name\}\}/g, 'Sarah Williams')
    preview = preview.replace(/\{\{verify_link\}\}/g, 'https://lawtendr.com/verify/abc123')
    preview = preview.replace(/\{\{reset_link\}\}/g, 'https://lawtendr.com/reset/xyz789')
    preview = preview.replace(/\{\{dashboard_link\}\}/g, 'https://lawtendr.com/attorney-dashboard')
    preview = preview.replace(/\{\{expiry_time\}\}/g, '24 hours')
    preview = preview.replace(/\{\{service\}\}/g, 'Personal Injury')
    preview = preview.replace(/\{\{description\}\}/g, 'Car accident injury consultation')
    preview = preview.replace(/\{\{date\}\}/g, 'January 15, 2026')
    preview = preview.replace(/\{\{time\}\}/g, '2:00 PM')
    preview = preview.replace(/\{\{rating\}\}/g, '5')
    preview = preview.replace(/\{\{review_text\}\}/g, 'Excellent work, very professional!')
    return preview
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push('/admin/settings')}
              className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1 text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to settings
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-gray-500 mt-1">Customize emails sent by the platform</p>
          </div>
          {saved && (
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <Check className="w-4 h-4" />
              Saved
            </span>
          )}
        </div>

        {/* Templates List */}
        <div className="space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-500">{template.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePreview(template)}
                    className={`p-2 rounded-lg transition-colors ${
                      previewId === template.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Preview"
                    aria-label={`Preview template ${template.name}`}
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className={`p-2 rounded-lg transition-colors ${
                      editingId === template.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Edit"
                    aria-label={`Edit template ${template.name}`}
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Edit Mode */}
              {editingId === template.id && (
                <div className="p-6 space-y-4 bg-gray-50">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Body
                    </label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Available variables:</p>
                    <div className="flex flex-wrap gap-2">
                      {template.variables.map((v) => (
                        <code
                          key={v}
                          className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
                        >
                          {v}
                        </code>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}

              {/* Preview Mode */}
              {previewId === template.id && (
                <div className="p-6 bg-gray-50">
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                      <p className="text-sm">
                        <span className="text-gray-500">Subject: </span>
                        <span className="font-medium text-gray-900">{template.subject}</span>
                      </p>
                    </div>
                    <div className="p-4">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                        {getPreviewContent(template)}
                      </pre>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Preview with test values
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700">
            Variables in {"{{braces}}"} are replaced with actual values when sending.
          </p>
        </div>
      </div>
    </div>
  )
}
