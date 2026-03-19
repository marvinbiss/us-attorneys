/**
 * Client Documents API
 * GET: List documents for a case (or all client documents)
 * POST: Upload document to Supabase Storage (client-documents bucket)
 * DELETE: Remove a document
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiHandler, apiSuccess, apiError } from '@/lib/api/handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { withTimeout } from '@/lib/api/timeout'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const BUCKET_NAME = 'client-documents'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]

const listQuerySchema = z.object({
  case_id: z.string().uuid().optional(),
})

// ─── GET: List documents ─────────────────────────────────────────────────────

export const GET = createApiHandler(async ({ request, user }) => {
  const adminClient = createAdminClient()

  const url = new URL(request.url)
  const parsed = listQuerySchema.safeParse({
    case_id: url.searchParams.get('case_id') ?? undefined,
  })

  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400)
  }

  const { case_id } = parsed.data

  let query = adminClient
    .from('client_documents')
    .select('id, case_id, case_type, file_name, file_size, mime_type, storage_path, shared_with_attorney, created_at, updated_at')
    .eq('client_id', user!.id)
    .order('created_at', { ascending: false })

  if (case_id) {
    query = query.eq('case_id', case_id)
  }

  const { data: documents, error } = await withTimeout(query)

  if (error) {
    logger.error('Client documents: fetch error', error)
    return apiError('SERVER_ERROR', 'Failed to load documents', 500)
  }

  // Generate signed URLs for each document
  const docsWithUrls = (documents || []).map(doc => ({
    ...doc,
    download_url: `/api/client/documents?download=${doc.id}`,
  }))

  return apiSuccess({ documents: docsWithUrls })
}, { requireAuth: true })

// ─── POST: Upload document ───────────────────────────────────────────────────

export const POST = createApiHandler(async ({ request, user }) => {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const caseId = formData.get('case_id') as string | null
  const caseType = (formData.get('case_type') as string) || 'lead'

  if (!file) {
    return apiError('VALIDATION_ERROR', 'No file provided', 400)
  }

  if (!caseId) {
    return apiError('VALIDATION_ERROR', 'case_id is required', 400)
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiError(
      'VALIDATION_ERROR',
      `Unsupported file type. Accepted: PDF, DOC, DOCX, JPG, PNG`,
      400
    )
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return apiError('VALIDATION_ERROR', 'File too large. Maximum size: 10MB', 400)
  }

  // Verify the case belongs to the user
  const userId = user!.id
  let caseVerified = false

  if (caseType === 'booking') {
    const { data: booking } = await withTimeout(
      adminClient.from('bookings').select('id').eq('id', caseId).eq('client_id', userId).single()
    )
    caseVerified = !!booking
  } else {
    const { data: lead } = await withTimeout(
      supabase.from('devis_requests').select('id').eq('id', caseId).eq('client_id', userId).single()
    )
    caseVerified = !!lead
  }

  if (!caseVerified) {
    return apiError('NOT_FOUND', 'Case not found', 404)
  }

  // Generate storage path
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf'
  const sanitizedName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 50)
  const storagePath = `${userId}/${caseId}/${timestamp}-${randomStr}-${sanitizedName}.${extension}`

  // Upload to Supabase Storage
  const { error: uploadError } = await adminClient.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      cacheControl: '31536000',
      upsert: false,
      contentType: file.type,
    })

  if (uploadError) {
    logger.error('Client documents: upload error', uploadError)
    return apiError('SERVER_ERROR', 'Failed to upload document', 500)
  }

  // Insert record into client_documents table
  const { data: doc, error: insertError } = await withTimeout(
    adminClient
      .from('client_documents')
      .insert({
        client_id: userId,
        case_id: caseId,
        case_type: caseType,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
        shared_with_attorney: false,
      })
      .select('id, case_id, case_type, file_name, file_size, mime_type, storage_path, shared_with_attorney, created_at')
      .single()
  )

  if (insertError) {
    logger.error('Client documents: insert error', insertError)
    // Clean up uploaded file
    await adminClient.storage.from(BUCKET_NAME).remove([storagePath]).catch(() => {})
    return apiError('SERVER_ERROR', 'Failed to save document record', 500)
  }

  return apiSuccess({ document: doc })
}, { requireAuth: true })

// ─── DELETE: Remove a document ───────────────────────────────────────────────

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  }

  const url = new URL(request.url)
  const documentId = url.searchParams.get('id')

  if (!documentId) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Document ID required' } }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Fetch document to verify ownership
  const { data: doc, error: fetchError } = await withTimeout(
    adminClient
      .from('client_documents')
      .select('id, storage_path, client_id')
      .eq('id', documentId)
      .single()
  )

  if (fetchError || !doc) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } }, { status: 404 })
  }

  if (doc.client_id !== user.id) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Not authorized' } }, { status: 403 })
  }

  // Delete from storage
  const { error: storageError } = await adminClient.storage
    .from(BUCKET_NAME)
    .remove([doc.storage_path])

  if (storageError) {
    logger.error('Client documents: storage delete error', storageError)
  }

  // Delete record
  const { error: deleteError } = await withTimeout(
    adminClient
      .from('client_documents')
      .delete()
      .eq('id', documentId)
  )

  if (deleteError) {
    logger.error('Client documents: delete error', deleteError)
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete document' } }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: { deleted: documentId } })
}
