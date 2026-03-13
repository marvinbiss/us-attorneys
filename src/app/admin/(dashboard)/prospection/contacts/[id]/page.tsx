'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ProspectionNav } from '@/components/admin/prospection/ProspectionNav'
import { ContactTypeBadge } from '@/components/admin/prospection/StatsCards'
import { ArrowLeft, Save, AlertCircle, X, Shield, Mail, Phone, MapPin, Building, Tag, User } from 'lucide-react'
import type { ProspectionContact, ProspectionList, ProspectionMessage } from '@/types/prospection'

export default function ContactDetailPage() {
  const rawParams = useParams()
  const id = rawParams.id as string

  const [contact, setContact] = useState<ProspectionContact | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Lists membership
  const [lists, setLists] = useState<ProspectionList[]>([])

  // Message history
  const [messages, setMessages] = useState<ProspectionMessage[]>([])

  // Edit mode
  const [editing, setEditing] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editFields, setEditFields] = useState({
    contact_name: '',
    company_name: '',
    email: '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    department: '',
    region: '',
    tags: '',
    consent_status: 'unknown' as 'opted_in' | 'opted_out' | 'unknown',
  })

  const fetchContact = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(`/api/admin/prospection/contacts/${id}`)
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error?.message || `Erreur ${res.status}`)
        return
      }
      const data = await res.json()
      if (data.success) {
        setContact(data.data)
        setEditFields({
          contact_name: data.data.contact_name || '',
          company_name: data.data.company_name || '',
          email: data.data.email || '',
          phone: data.data.phone || '',
          address: data.data.address || '',
          postal_code: data.data.postal_code || '',
          city: data.data.city || '',
          department: data.data.department || '',
          region: data.data.region || '',
          tags: (data.data.tags || []).join(', '),
          consent_status: data.data.consent_status || 'unknown',
        })
      } else {
        setError(data.error?.message || 'Contact non trouvé')
      }
    } catch {
      setError('Impossible de charger le contact')
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchRelatedData = useCallback(async () => {
    // Fetch lists this contact belongs to
    try {
      const res = await fetch('/api/admin/prospection/lists')
      if (res.ok) {
        const data = await res.json()
        if (data.success) setLists(data.data)
      }
    } catch {
      // Non-critical
    }

    // Fetch conversations for this contact
    try {
      const res = await fetch(`/api/admin/prospection/conversations?contact_id=${id}`)
      if (res.ok) {
        const convData = await res.json()
        if (convData.success && convData.data) {
          setMessages(convData.data)
        }
      }
    } catch {
      // Non-critical
    }
  }, [])

  useEffect(() => {
    fetchContact()
  }, [fetchContact])

  useEffect(() => {
    if (contact) fetchRelatedData()
  }, [contact, fetchRelatedData])

  const handleSaveEdit = async () => {
    setSavingEdit(true)
    setActionError(null)
    setSuccessMsg(null)
    try {
      const payload: Record<string, unknown> = {}
      if (editFields.contact_name.trim()) payload.contact_name = editFields.contact_name.trim()
      if (editFields.company_name.trim()) payload.company_name = editFields.company_name.trim()
      if (editFields.email.trim()) payload.email = editFields.email.trim()
      if (editFields.phone.trim()) payload.phone = editFields.phone.trim()
      if (editFields.address.trim()) payload.address = editFields.address.trim()
      if (editFields.postal_code.trim()) payload.postal_code = editFields.postal_code.trim()
      if (editFields.city.trim()) payload.city = editFields.city.trim()
      if (editFields.department.trim()) payload.department = editFields.department.trim()
      if (editFields.region.trim()) payload.region = editFields.region.trim()
      payload.tags = editFields.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      payload.consent_status = editFields.consent_status

      const res = await fetch(`/api/admin/prospection/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setActionError(data?.error?.message || 'Erreur lors de la modification')
        return
      }
      const data = await res.json()
      if (data.success) {
        setContact(data.data)
        setEditing(false)
        setSuccessMsg('Contact mis à jour avec succès')
        setTimeout(() => setSuccessMsg(null), 3000)
      } else {
        setActionError(data.error?.message || 'Erreur')
      }
    } catch {
      setActionError('Impossible de sauvegarder les modifications')
    } finally {
      setSavingEdit(false)
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

  if (error || !contact) {
    return (
      <div>
        <div className="mb-6">
          <Link href="/admin/prospection/contacts" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4" /> Retour aux contacts
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Prospection</h1>
        </div>
        <ProspectionNav />
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error || 'Contact non trouvé'}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/prospection/contacts" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="w-4 h-4" /> Retour aux contacts
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            {contact.contact_name || contact.company_name || 'Contact'}
          </h1>
          <ContactTypeBadge type={contact.contact_type} />
          {!contact.is_active && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              Inactif
            </span>
          )}
        </div>
        {contact.company_name && contact.contact_name && (
          <p className="text-gray-500 mt-1">{contact.company_name}</p>
        )}
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
        {/* Main info card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Informations</h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
                >
                  Modifier
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nom</label>
                    <input type="text" value={editFields.contact_name} onChange={(e) => setEditFields(f => ({ ...f, contact_name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Entreprise</label>
                    <input type="text" value={editFields.company_name} onChange={(e) => setEditFields(f => ({ ...f, company_name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                    <input type="email" value={editFields.email} onChange={(e) => setEditFields(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">T&eacute;l&eacute;phone</label>
                    <input type="text" value={editFields.phone} onChange={(e) => setEditFields(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Adresse</label>
                  <input type="text" value={editFields.address} onChange={(e) => setEditFields(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Code postal</label>
                    <input type="text" value={editFields.postal_code} onChange={(e) => setEditFields(f => ({ ...f, postal_code: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Ville</label>
                    <input type="text" value={editFields.city} onChange={(e) => setEditFields(f => ({ ...f, city: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">D&eacute;partement</label>
                    <input type="text" value={editFields.department} onChange={(e) => setEditFields(f => ({ ...f, department: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">R&eacute;gion</label>
                  <input type="text" value={editFields.region} onChange={(e) => setEditFields(f => ({ ...f, region: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tags (s&eacute;par&eacute;s par des virgules)</label>
                  <input type="text" value={editFields.tags} onChange={(e) => setEditFields(f => ({ ...f, tags: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="tag1, tag2, tag3" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Consentement</label>
                  <select
                    value={editFields.consent_status}
                    onChange={(e) => setEditFields(f => ({ ...f, consent_status: e.target.value as 'opted_in' | 'opted_out' | 'unknown' }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="unknown">Inconnu</option>
                    <option value="opted_in">Inscrit (opt-in)</option>
                    <option value="opted_out">D&eacute;sinscrit (opt-out)</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                    className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> {savingEdit ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 w-24">Nom</span>
                  <span className="text-gray-900">{contact.contact_name || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 w-24">Entreprise</span>
                  <span className="text-gray-900">{contact.company_name || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 w-24">Email</span>
                  <span className="text-gray-900">{contact.email || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 w-24">T&eacute;l&eacute;phone</span>
                  <span className="text-gray-900">{contact.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 w-24">Adresse</span>
                  <span className="text-gray-900">
                    {[contact.address, contact.postal_code, contact.city].filter(Boolean).join(', ') || '-'}
                  </span>
                </div>
                {(contact.department || contact.region) && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500 w-24">Zone</span>
                    <span className="text-gray-900">
                      {[contact.department, contact.region].filter(Boolean).join(' - ')}
                    </span>
                  </div>
                )}
                {contact.tags.length > 0 && (
                  <div className="flex items-center gap-3 text-sm">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500 w-24">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-4 h-4 text-gray-400 text-xs font-bold text-center">ID</span>
                  <span className="text-gray-500 w-24">Source</span>
                  <span className="text-gray-400 text-xs">{contact.source}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-4 h-4" />
                  <span className="text-gray-500 w-24">Cr&eacute;&eacute; le</span>
                  <span className="text-gray-400 text-xs">{new Date(contact.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Message history */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique des messages</h2>
            {messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Aucun message envoy&eacute; &agrave; ce contact.</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="border rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-700 capitalize">{msg.channel}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        msg.status === 'delivered' || msg.status === 'read' || msg.status === 'replied' ? 'bg-green-100 text-green-700'
                          : msg.status === 'failed' || msg.status === 'bounced' ? 'bg-red-100 text-red-700'
                          : msg.status === 'sent' ? 'bg-blue-100 text-blue-700'
                          : msg.status === 'queued' || msg.status === 'sending' ? 'bg-yellow-100 text-yellow-700'
                          : msg.status === 'opted_out' || msg.status === 'cancelled' ? 'bg-gray-100 text-gray-600'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {msg.status === 'delivered' ? 'Livré'
                          : msg.status === 'failed' ? 'Échoué'
                          : msg.status === 'sent' ? 'Envoyé'
                          : msg.status === 'queued' ? 'En file d\u2019attente'
                          : msg.status === 'sending' ? 'En cours d\u2019envoi'
                          : msg.status === 'read' ? 'Lu'
                          : msg.status === 'replied' ? 'Répondu'
                          : msg.status === 'bounced' ? 'Rejeté'
                          : msg.status === 'opted_out' ? 'Désinscrit'
                          : msg.status === 'cancelled' ? 'Annulé'
                          : msg.status}
                      </span>
                    </div>
                    <p className="text-gray-600 line-clamp-2">{msg.rendered_body || '-'}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {msg.sent_at ? new Date(msg.sent_at).toLocaleString('fr-FR') : 'Non envoyé'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* RGPD */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-gray-400" /> RGPD / Consentement
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Statut</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  contact.consent_status === 'opted_in' ? 'bg-green-100 text-green-700'
                    : contact.consent_status === 'opted_out' ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {contact.consent_status === 'opted_in' ? 'Inscrit'
                    : contact.consent_status === 'opted_out' ? 'Désinscrit'
                    : 'Inconnu'}
                </span>
              </div>
              {contact.opted_out_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">D&eacute;sinscrit le</span>
                  <span className="text-xs text-gray-400">{new Date(contact.opted_out_at).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Lists membership */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-medium mb-3">Listes</h3>
            {lists.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune liste charg&eacute;e</p>
            ) : (
              <div className="space-y-1">
                {lists.map((list) => (
                  <Link
                    key={list.id}
                    href={`/admin/prospection/lists/${list.id}`}
                    className="block text-sm text-blue-600 hover:underline py-1"
                  >
                    {list.name}
                    <span className="text-xs text-gray-400 ml-2">({list.contact_count})</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
