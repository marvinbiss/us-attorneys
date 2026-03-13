'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProspectionNav } from '@/components/admin/prospection/ProspectionNav'
import { ArrowLeft, Save, Eye, Tag, Trash2, AlertCircle, X } from 'lucide-react'
import type { ProspectionTemplate, ProspectionChannel, AudienceType } from '@/types/prospection'

const VARIABLES = [
  { key: 'contact_name', label: 'Nom' },
  { key: 'company_name', label: 'Entreprise' },
  { key: 'city', label: 'Ville' },
  { key: 'department', label: 'Département' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Téléphone' },
  { key: 'date', label: 'Date du jour' },
  { key: 'unsubscribe_link', label: 'Lien désinscription' },
]

export default function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [template, setTemplate] = useState<ProspectionTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [channel, setChannel] = useState<ProspectionChannel>('email')
  const [audienceType, setAudienceType] = useState<AudienceType | ''>('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')

  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchTemplate = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(`/api/admin/prospection/templates/${id}`)
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error?.message || `Erreur ${res.status}`)
        return
      }
      const data = await res.json()
      if (data.success) {
        const t: ProspectionTemplate = data.data
        setTemplate(t)
        setName(t.name)
        setChannel(t.channel)
        setAudienceType(t.audience_type || '')
        setSubject(t.subject || '')
        setBody(t.body)
        setAiPrompt(t.ai_system_prompt || '')
      } else {
        setError(data.error?.message || 'Modèle non trouvé')
      }
    } catch {
      setError('Impossible de charger le modèle')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchTemplate()
  }, [fetchTemplate])

  const insertVariable = (key: string) => {
    setBody(prev => prev + `{{${key}}}`)
  }

  const handlePreview = async () => {
    setActionError(null)
    try {
      const res = await fetch('/api/admin/prospection/templates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, subject }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setActionError(data?.error?.message || 'Erreur lors de la prévisualisation')
        return
      }
      const data = await res.json()
      if (data.success) setPreview(data.data.rendered_body)
    } catch {
      setActionError('Impossible de générer l\'aperçu')
    }
  }

  const handleSave = async () => {
    if (!name.trim() || !body.trim()) return

    setSaving(true)
    setActionError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch(`/api/admin/prospection/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          channel,
          audience_type: audienceType || null,
          subject: subject.trim() || null,
          body: body.trim(),
          ai_system_prompt: aiPrompt.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setActionError(data?.error?.message || 'Erreur lors de la sauvegarde')
        return
      }
      const data = await res.json()
      if (data.success) {
        setTemplate(data.data)
        setSuccessMsg('Modèle mis à jour avec succès')
        setTimeout(() => setSuccessMsg(null), 3000)
      } else {
        setActionError(data.error?.message || 'Erreur')
      }
    } catch {
      setActionError('Impossible de sauvegarder le modèle')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/admin/prospection/templates/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setActionError(data?.error?.message || 'Erreur lors de la suppression')
        setDeleting(false)
        return
      }
      const data = await res.json()
      if (data.success) {
        router.push('/admin/prospection/templates')
      } else {
        setActionError(data.error?.message || 'Erreur')
        setDeleting(false)
      }
    } catch {
      setActionError('Impossible de supprimer le modèle')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Prospection</h1>
        <ProspectionNav />
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-100 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !template) {
    return (
      <div>
        <div className="mb-6">
          <Link href="/admin/prospection/templates" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4" /> Retour aux modèles
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Prospection</h1>
        </div>
        <ProspectionNav />
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error || 'Modèle non trouvé'}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/prospection/templates" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="w-4 h-4" /> Retour aux modèles
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Modifier le modèle</h1>
      </div>

      <ProspectionNav />

      {/* Action messages */}
      {actionError && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {actionError}
          <button onClick={() => setActionError(null)} aria-label="Fermer le message d'erreur" className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {successMsg && (
        <div role="status" aria-live="polite" className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 bg-white rounded-lg border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom du modèle</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Ex: Invitation artisan plombier"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Canal</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as ProspectionChannel)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Audience (optionnel)</label>
              <select
                value={audienceType}
                onChange={(e) => setAudienceType(e.target.value as AudienceType | '')}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Toutes</option>
                <option value="artisan">Artisans</option>
                <option value="client">Clients</option>
                <option value="mairie">Mairies</option>
              </select>
            </div>
          </div>

          {channel === 'email' && (
            <div>
              <label className="block text-sm font-medium mb-1">Sujet</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Ex: Rejoignez ServicesArtisans, {{contact_name}} !"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Corps du message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
              placeholder={channel === 'sms' ? 'Max 160 caractères pour 1 SMS' : 'Contenu du message...'}
            />
            {channel === 'sms' && (
              <p className="text-xs text-gray-400 mt-1">{body.length}/160 caract&egrave;res ({Math.ceil(body.length / 160) || 1} SMS)</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Prompt IA pour les r&eacute;ponses (optionnel)</label>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Instructions sp&eacute;cifiques pour l'IA quand elle r&eacute;pond aux contacts de cette campagne..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button onClick={handlePreview} className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
              <Eye className="w-4 h-4" /> Aper&ccedil;u
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim() || !body.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 ml-auto"
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>

          {/* Delete confirmation */}
          {showDeleteConfirm && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 mb-3">
                Voulez-vous vraiment supprimer le modèle &laquo; {template.name} &raquo; ?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Suppression...' : 'Confirmer'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Variables + Preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4" /> Variables disponibles
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
              <h3 className="text-sm font-medium mb-3">Aper&ccedil;u</h3>
              <div className="text-sm bg-gray-50 rounded p-3 whitespace-pre-wrap">{preview}</div>
            </div>
          )}

          {/* Template metadata */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-medium mb-3">Informations</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Cr&eacute;&eacute; le</span>
                <span className="text-gray-700">{new Date(template.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Modifi&eacute; le</span>
                <span className="text-gray-700">{new Date(template.updated_at).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Actif</span>
                <span className={template.is_active ? 'text-green-600' : 'text-red-600'}>
                  {template.is_active ? 'Oui' : 'Non'}
                </span>
              </div>
              {template.variables.length > 0 && (
                <div>
                  <span className="text-gray-500">Variables utilis&eacute;es</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.variables.map((v) => (
                      <span key={v} className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">{v}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
