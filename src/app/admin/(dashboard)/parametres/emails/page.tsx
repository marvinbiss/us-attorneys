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
    name: 'Bienvenue',
    subject: 'Bienvenue sur ServicesArtisans',
    description: 'Email envoyé après inscription',
    variables: ['{{user_name}}', '{{verify_link}}'],
    content: `Bonjour {{user_name}},

Bienvenue sur ServicesArtisans ! Nous sommes ravis de vous compter parmi nous.

Pour commencer, veuillez vérifier votre email en cliquant sur le lien ci-dessous :
{{verify_link}}

Si vous avez des questions, n'hésitez pas à nous contacter.

L'équipe ServicesArtisans`,
  },
  {
    id: 'password_reset',
    name: 'Réinitialisation mot de passe',
    subject: 'Réinitialisation de votre mot de passe',
    description: 'Email pour réinitialiser le mot de passe',
    variables: ['{{user_name}}', '{{reset_link}}', '{{expiry_time}}'],
    content: `Bonjour {{user_name}},

Vous avez demandé la réinitialisation de votre mot de passe.

Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :
{{reset_link}}

Ce lien expire dans {{expiry_time}}.

Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.

L'équipe ServicesArtisans`,
  },
  {
    id: 'booking_confirmation',
    name: 'Confirmation de réservation',
    subject: 'Confirmation de votre réservation',
    description: 'Email envoyé après une réservation',
    variables: ['{{user_name}}', '{{artisan_name}}', '{{service}}', '{{date}}', '{{time}}'],
    content: `Bonjour {{user_name}},

Votre réservation a été confirmée !

Détails :
- Artisan : {{artisan_name}}
- Service : {{service}}
- Date : {{date}}
- Heure : {{time}}

L'artisan vous contactera pour confirmer les derniers détails.

L'équipe ServicesArtisans`,
  },
  {
    id: 'quote_request',
    name: 'Nouvelle demande de devis',
    subject: 'Nouvelle demande de devis',
    description: 'Email envoyé à l\'artisan pour une demande de devis',
    variables: ['{{artisan_name}}', '{{client_name}}', '{{service}}', '{{description}}', '{{dashboard_link}}'],
    content: `Bonjour {{artisan_name}},

Vous avez reçu une nouvelle demande de devis !

Client : {{client_name}}
Service : {{service}}
Description : {{description}}

Connectez-vous à votre tableau de bord pour répondre :
{{dashboard_link}}

L'équipe ServicesArtisans`,
  },
  {
    id: 'review_notification',
    name: 'Nouvel avis',
    subject: 'Vous avez reçu un nouvel avis',
    description: 'Email envoyé à l\'artisan pour un nouvel avis',
    variables: ['{{artisan_name}}', '{{rating}}', '{{review_text}}', '{{client_name}}'],
    content: `Bonjour {{artisan_name}},

Vous avez reçu un nouvel avis de {{client_name}} !

Note : {{rating}}/5
Commentaire : {{review_text}}

Continuez votre excellent travail !

L'équipe ServicesArtisans`,
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
    preview = preview.replace(/\{\{user_name\}\}/g, 'Jean Dupont')
    preview = preview.replace(/\{\{artisan_name\}\}/g, 'Pierre Martin')
    preview = preview.replace(/\{\{client_name\}\}/g, 'Marie Durand')
    preview = preview.replace(/\{\{verify_link\}\}/g, 'https://us-attorneys.com/verify/abc123')
    preview = preview.replace(/\{\{reset_link\}\}/g, 'https://us-attorneys.com/reset/xyz789')
    preview = preview.replace(/\{\{dashboard_link\}\}/g, 'https://us-attorneys.com/attorney-dashboard')
    preview = preview.replace(/\{\{expiry_time\}\}/g, '24 heures')
    preview = preview.replace(/\{\{service\}\}/g, 'Plomberie')
    preview = preview.replace(/\{\{description\}\}/g, 'Réparation fuite sous évier')
    preview = preview.replace(/\{\{date\}\}/g, '15 janvier 2026')
    preview = preview.replace(/\{\{time\}\}/g, '14h00')
    preview = preview.replace(/\{\{rating\}\}/g, '5')
    preview = preview.replace(/\{\{review_text\}\}/g, 'Excellent travail, très professionnel !')
    return preview
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push('/admin/parametres')}
              className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1 text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour aux paramètres
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Modèles d&apos;email</h1>
            <p className="text-gray-500 mt-1">Personnalisez les emails envoyés par la plateforme</p>
          </div>
          {saved && (
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <Check className="w-4 h-4" />
              Enregistré
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
                    title="Prévisualiser"
                    aria-label={`Prévisualiser le modèle ${template.name}`}
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
                    title="Modifier"
                    aria-label={`Modifier le modèle ${template.name}`}
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
                      Sujet
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
                      Contenu
                    </label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Variables disponibles :</p>
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
                      Annuler
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
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
                        <span className="text-gray-500">Sujet : </span>
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
                    Aperçu avec des valeurs de test
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-blue-900 mb-2">À propos des templates</h3>
          <p className="text-sm text-blue-700">
            Les modifications apportées aux templates seront appliquées à tous les futurs emails.
            Les variables entre doubles accolades (ex: {"{{user_name}}"}) seront automatiquement
            remplacées par les valeurs réelles lors de l&apos;envoi.
          </p>
        </div>
      </div>
    </div>
  )
}
