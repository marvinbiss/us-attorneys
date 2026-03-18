'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ProspectionNav } from '@/components/admin/prospection/ProspectionNav'
import { ChannelIcon } from '@/components/admin/prospection/StatsCards'
import { Plus, FileText, AlertCircle } from 'lucide-react'
import type { ProspectionTemplate } from '@/types/prospection'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ProspectionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null)
      const res = await fetch('/api/admin/prospection/templates', { signal })
      if (!res.ok) throw new Error(`Server error (${res.status})`)
      const data = await res.json()
      if (data.success) setTemplates(data.data ?? [])
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError('Loading error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchTemplates(controller.signal)
    return () => controller.abort()
  }, [fetchTemplates])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospection</h1>
          <p className="text-gray-500 mt-1">Message templates</p>
        </div>
        <Link
          href="/admin/prospection/templates/create"
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New template
        </Link>
      </div>

      <ProspectionNav />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-16 bg-gray-100 rounded" />
            </div>
          ))
        ) : templates.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No templates. Create your first message template.</p>
          </div>
        ) : (
          templates.map((tmpl) => (
            <Link
              key={tmpl.id}
              href={`/admin/prospection/templates/${tmpl.id}`}
              className="bg-white rounded-lg border p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{tmpl.name}</h3>
                <ChannelIcon channel={tmpl.channel} className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{tmpl.channel}</span>
                {tmpl.audience_type && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 capitalize">{tmpl.audience_type}</span>
                )}
              </div>
              {tmpl.subject && <p className="text-sm text-gray-500 mb-1">Subject: {tmpl.subject}</p>}
              <p className="text-sm text-gray-400 line-clamp-3">{tmpl.body}</p>
              <div className="mt-3 text-xs text-gray-400">
                {tmpl.variables.length > 0 && `Variables: ${tmpl.variables.join(', ')}`}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
