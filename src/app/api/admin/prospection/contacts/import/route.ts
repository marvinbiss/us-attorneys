import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { importContacts, parseCSV, suggestColumnMapping } from '@/lib/prospection/import-service'
import type { ColumnMapping } from '@/types/prospection'
import { z } from 'zod'

const importFormSchema = z.object({
  contact_type: z.enum(['attorney', 'client', 'municipality']),
  mapping: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission('prospection', 'write')
    if (!authResult.success || !authResult.admin) return authResult.error

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data' } },
        { status: 400 }
      )
    }

    const file = formData.get('file') as File | null

    // Validate form fields with Zod
    const parsed = importFormSchema.safeParse({
      contact_type: formData.get('contact_type'),
      mapping: formData.get('mapping') || undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data' } },
        { status: 400 }
      )
    }

    const contactType = parsed.data.contact_type
    const mappingJson = parsed.data.mapping ?? null

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: 'File required' } },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: { message: 'File exceeds the maximum allowed size (10 MB)' } },
        { status: 400 }
      )
    }

    // Validate file type (only CSV/TSV allowed)
    const allowedTypes = ['text/csv', 'text/tab-separated-values', 'application/vnd.ms-excel', 'text/plain']
    const allowedExtensions = ['.csv', '.tsv', '.txt']
    const fileExtension = file.name ? '.' + file.name.split('.').pop()?.toLowerCase() : ''
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized file type. Accepted formats: CSV, TSV, TXT' } },
        { status: 400 }
      )
    }

    const content = await file.text()

    // If no mapping provided, return headers + suggestion
    if (!mappingJson) {
      const { headers, rows } = parseCSV(content)
      const suggestedMapping = suggestColumnMapping(headers)

      return NextResponse.json({
        success: true,
        data: {
          headers,
          suggested_mapping: suggestedMapping,
          preview_rows: rows.slice(0, 5),
          total_rows: rows.length,
        },
      })
    }

    // With mapping, start the import
    let mapping: ColumnMapping
    try {
      mapping = JSON.parse(mappingJson)
    } catch {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid JSON mapping' } },
        { status: 400 }
      )
    }

    const result = await importContacts(content, mapping, contactType, file.name)

    await logAdminAction(authResult.admin.id, 'contact.import', 'prospection_contact', 'bulk', {
      file_name: file.name,
      contact_type: contactType,
      result,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error('Import contacts error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
