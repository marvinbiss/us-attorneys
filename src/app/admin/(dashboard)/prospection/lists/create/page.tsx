'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProspectionNav } from '@/components/admin/prospection/ProspectionNav'
import { Save, ArrowLeft, AlertCircle } from 'lucide-react'
import type { ListType, ContactType, ListFilterCriteria } from '@/types/prospection'

const DEPARTMENTS = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '2A', '2B',
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
  '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
  '41', '42', '43', '44', '45', '46', '47', '48', '49', '50',
  '51', '52', '53', '54', '55', '56', '57', '58', '59', '60',
  '61', '62', '63', '64', '65', '66', '67', '68', '69', '70',
  '71', '72', '73', '74', '75', '76', '77', '78', '79', '80',
  '81', '82', '83', '84', '85', '86', '87', '88', '89', '90',
  '91', '92', '93', '94', '95', '971', '972', '973', '974', '976',
]

const REGIONS = [
  'Auvergne-Rhône-Alpes',
  'Bourgogne-Franche-Comté',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Hauts-de-France',
  'Île-de-France',
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  "Provence-Alpes-Côte d'Azur",
  'Guadeloupe',
  'Martinique',
  'Guyane',
  'La Réunion',
  'Mayotte',
]

export default function CreateListPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [listType, setListType] = useState<ListType>('static')
  const [filterContactType, setFilterContactType] = useState<ContactType | ''>('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [filterRegion, setFilterRegion] = useState('')

  const [nameError, setNameError] = useState<string | null>(null)

  const validate = (): boolean => {
    setNameError(null)
    if (!name.trim()) {
      setNameError('Le nom est requis')
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validate()) return

    setSaving(true)
    setError(null)
    try {
      const filterCriteria: ListFilterCriteria = {}
      if (listType === 'dynamic') {
        if (filterContactType) filterCriteria.contact_type = filterContactType
        if (filterDepartment) filterCriteria.department = filterDepartment
        if (filterRegion) filterCriteria.region = filterRegion
      }

      const res = await fetch('/api/admin/prospection/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          list_type: listType,
          filter_criteria: listType === 'dynamic' && Object.keys(filterCriteria).length > 0
            ? filterCriteria
            : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error?.message || `Erreur ${res.status}`)
        return
      }

      const data = await res.json()
      if (data.success) {
        router.push('/admin/prospection/lists')
      } else {
        setError(data.error?.message || 'Erreur lors de la sauvegarde')
      }
    } catch {
      setError('Impossible de sauvegarder la liste')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/prospection/lists" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="w-4 h-4" /> Retour aux listes
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle liste</h1>
      </div>

      <ProspectionNav />

      {error && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border p-6 space-y-4 max-w-2xl">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Nom de la liste <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameError(null) }}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${nameError ? 'border-red-300' : ''}`}
            placeholder="Ex: Artisans plombiers Ile-de-France"
          />
          {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="Description optionnelle de cette liste..."
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Type de liste</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="list_type"
                value="static"
                checked={listType === 'static'}
                onChange={() => setListType('static')}
                className="text-blue-600"
              />
              <span className="text-sm">Statique</span>
              <span className="text-xs text-gray-400">- ajout manuel des contacts</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="list_type"
                value="dynamic"
                checked={listType === 'dynamic'}
                onChange={() => setListType('dynamic')}
                className="text-blue-600"
              />
              <span className="text-sm">Dynamique</span>
              <span className="text-xs text-gray-400">- bas&eacute;e sur des filtres</span>
            </label>
          </div>
        </div>

        {/* Dynamic filters */}
        {listType === 'dynamic' && (
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Crit&egrave;res de filtrage</h3>

            <div>
              <label className="block text-sm font-medium mb-1">Type de contact</label>
              <select
                value={filterContactType}
                onChange={(e) => setFilterContactType(e.target.value as ContactType | '')}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Tous</option>
                <option value="artisan">Artisans</option>
                <option value="client">Clients</option>
                <option value="mairie">Mairies</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">D&eacute;partement</label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Tous</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">R&eacute;gion</label>
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Toutes</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Link
            href="/admin/prospection/lists"
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            Annuler
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  )
}
