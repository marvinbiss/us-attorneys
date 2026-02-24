/**
 * Message File Upload API
 * POST: Upload a file attachment
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const uploadMetadataSchema = z.object({
  conversation_id: z.string().uuid('ID de conversation invalide').nullable(),
  message_id: z.string().uuid('ID de message invalide').nullable(),
})

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'audio/webm',
  'audio/mp3',
  'audio/mpeg',
  'video/mp4',
  'video/webm',
]

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: { message: 'Non autorisé' } }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    // Validate metadata fields
    const metadataValidation = uploadMetadataSchema.safeParse({
      conversation_id: formData.get('conversation_id') || null,
      message_id: formData.get('message_id') || null,
    })

    if (!metadataValidation.success) {
      return NextResponse.json(
        { success: false, error: { message: metadataValidation.error.issues[0]?.message || 'Parametres invalides' } },
        { status: 400 }
      )
    }

    const { conversation_id: conversationId, message_id: messageId } = metadataValidation.data

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: 'Fichier requis' } },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: { message: 'Fichier trop volumineux (max 10MB)' } },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { message: 'Type de fichier non autorisé' } },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const fileName = conversationId
      ? `${conversationId}/${timestamp}-${randomStr}.${fileExt}`
      : `${user.id}/${timestamp}-${randomStr}.${fileExt}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      logger.error('File upload error', uploadError)
      return NextResponse.json(
        { success: false, error: { message: 'Erreur lors de l\'upload' } },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(uploadData.path)

    // Create thumbnail for images
    let thumbnailUrl: string | null = null
    if (file.type.startsWith('image/')) {
      // For now, use the same URL. In production, you'd generate a resized version
      thumbnailUrl = publicUrl
    }

    // If messageId provided, create attachment record
    if (messageId) {
      const { error: attachmentError } = await supabase
        .from('message_attachments')
        .insert({
          message_id: messageId,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          thumbnail_url: thumbnailUrl,
        })

      if (attachmentError) {
        logger.error('Attachment record error', attachmentError)
        // Don't fail the request, file is already uploaded
      }
    }

    return NextResponse.json({
      url: publicUrl,
      thumbnail_url: thumbnailUrl,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
    })
  } catch (error) {
    logger.error('Upload error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}
