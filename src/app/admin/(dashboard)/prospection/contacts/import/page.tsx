'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProspectionNav } from '@/components/admin/prospection/ProspectionNav'
import { Upload, ArrowRight, ArrowLeft, Check, AlertCircle } from 'lucide-react'
import type { ContactType, ColumnMapping, ImportResult } from '@/types/prospection'

type Step = 'upload' | 'mapping' | 'result'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export default function ImportPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [contactType, setContactType] = useState<ContactType>('artisan')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Upload result
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([])
  const [totalRows, setTotalRows] = useState(0)

  // Import result
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.size > MAX_FILE_SIZE) {
      setError(`File is too large (${(selectedFile.size / 1024 / 1024).toFixed(1)} MB). Maximum size: 50 MB.`)
      setFile(null)
      return
    }
    setError(null)
    setFile(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('contact_type', contactType)

    try {
      const res = await fetch('/api/admin/prospection/contacts/import', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(`Server error (${res.status})`)
      const data = await res.json()

      if (data.success) {
        setHeaders(data.data.headers)
        setMapping(data.data.suggested_mapping)
        setPreviewRows(data.data.preview_rows)
        setTotalRows(data.data.total_rows)
        setStep('mapping')
      } else {
        setError(data.error?.message || 'Error')
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error analyzing file')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('contact_type', contactType)
    formData.append('mapping', JSON.stringify(mapping))

    try {
      const res = await fetch('/api/admin/prospection/contacts/import', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(`Server error (${res.status})`)
      const data = await res.json()

      if (data.success) {
        setResult(data.data)
        setStep('result')
      } else {
        setError(data.error?.message || 'Error')
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error during import')
      }
    } finally {
      setLoading(false)
    }
  }

  const fieldOptions: { value: string; label: string }[] = [
    { value: '', label: '-- Ignore --' },
    { value: 'contact_name', label: 'Contact name' },
    { value: 'company_name', label: 'Company' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'address', label: 'Address' },
    { value: 'postal_code', label: 'Zip code' },
    { value: 'city', label: 'City' },
    { value: 'department', label: 'State' },
    { value: 'region', label: 'Region' },
    { value: 'location_code', label: 'Location code' },
    { value: 'population', label: 'Population' },
  ]

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/prospection/contacts" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to contacts
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Import contacts</h1>
        <p className="text-gray-500 mt-1">Import contacts from a CSV file</p>
      </div>

      <ProspectionNav />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="bg-white rounded-lg border p-6 max-w-xl">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Contact type</label>
            <select
              value={contactType}
              onChange={(e) => setContactType(e.target.value as ContactType)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="artisan">Attorneys</option>
              <option value="client">Clients</option>
              <option value="mairie">Municipalities</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">CSV file</label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <input
                type="file"
                accept=".csv,.txt"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700"
              />
              <p className="text-xs text-gray-400 mt-2">CSV with ; or , separator (UTF-8 encoding) -- max 50 MB</p>
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze file'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step: Mapping */}
      {step === 'mapping' && (
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-500 mb-4">{totalRows} rows detected. Map the columns:</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {headers.map((h) => (
              <div key={h} className="flex items-center gap-2">
                <span className="text-sm font-medium w-1/2 truncate">{h}</span>
                <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                <select
                  value={mapping[h] || ''}
                  onChange={(e) => setMapping(prev => ({ ...prev, [h]: (e.target.value || null) as ColumnMapping[string] }))}
                  aria-label={`Mapping for column ${h}`}
                  className="flex-1 px-2 py-1.5 border rounded text-sm"
                >
                  {fieldOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Preview */}
          {previewRows.length > 0 && (
            <div className="mb-6 overflow-x-auto">
              <p className="text-sm font-medium mb-2">Preview (first 5 rows)</p>
              <table className="text-xs border min-w-[500px]" aria-label="Preview of imported data">
                <thead>
                  <tr className="bg-gray-50">
                    {headers.map(h => <th scope="col" key={h} className="px-2 py-1 border text-left">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i}>
                      {headers.map(h => <td key={h} className="px-2 py-1 border">{row[h] || ''}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Importing...' : `Import ${totalRows} contacts`} <Check className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step: Result */}
      {step === 'result' && result && (
        <div className="bg-white rounded-lg border p-6 max-w-xl">
          <div className="text-center mb-6">
            <Check className="w-12 h-12 mx-auto text-green-600 mb-2" />
            <h2 className="text-lg font-semibold">Import complete</h2>
          </div>

          <div className="space-y-2 text-sm mb-6">
            <div className="flex justify-between"><span>Rows analyzed</span><span className="font-medium">{result.total_rows}</span></div>
            <div className="flex justify-between"><span>Valid</span><span className="font-medium text-green-600">{result.valid}</span></div>
            <div className="flex justify-between"><span>Imported</span><span className="font-medium text-green-600">{result.imported}</span></div>
            <div className="flex justify-between"><span>Duplicates</span><span className="font-medium text-yellow-600">{result.duplicates}</span></div>
            <div className="flex justify-between"><span>Errors</span><span className="font-medium text-red-600">{result.errors}</span></div>
          </div>

          {result.error_details.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-red-600 flex items-center gap-1 mb-2">
                <AlertCircle className="w-4 h-4" /> Errors
              </p>
              <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                {result.error_details.slice(0, 10).map((err, i) => (
                  <div key={i} className="text-red-500">Row {err.row}: {err.message}</div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => router.push('/admin/prospection/contacts')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            View contacts
          </button>
        </div>
      )}
    </div>
  )
}
