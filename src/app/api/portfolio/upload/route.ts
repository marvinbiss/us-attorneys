/**
 * Portfolio Upload API
 * POST: Upload file to Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { z } from 'zod'

const portfolioUploadTypeSchema = z.enum(['image', 'video', 'before', 'after']).nullable()

const PORTFOLIO_BUCKET = 'portfolio'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

function generateFilePath(attorneyId: string, fileName: string): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg'
  const sanitizedName = fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 50)

  return `${attorneyId}/${timestamp}-${randomStr}-${sanitizedName}.${extension}`
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting — upload category (5/min, storage-intensive)
    const rl = await rateLimit(request, RATE_LIMITS.upload)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many uploads. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
      )
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify user is an attorney
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'attorney') {
      return NextResponse.json(
        { error: 'Access reserved for attorneys' },
        { status: 403 }
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const rawType = formData.get('type') as string | null

    // Validate type field
    const typeValidation = portfolioUploadTypeSchema.safeParse(rawType)
    if (!typeValidation.success) {
      return NextResponse.json(
        { error: 'Invalid type. Accepted values: image, video, before, after' },
        { status: 400 }
      )
    }
    const fileType = typeValidation.data

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const isVideo = file.type.startsWith('video/')
    const allowedTypes = isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type. Accepted types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024)
      return NextResponse.json(
        { error: `File too large. Maximum size: ${maxSizeMB}MB` },
        { status: 400 }
      )
    }

    // Generate file path
    const filePath = generateFilePath(user.id, file.name)

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(PORTFOLIO_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '31536000', // 1 year
        upsert: false,
      })

    if (uploadError) {
      logger.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: `Upload error: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(PORTFOLIO_BUCKET)
      .getPublicUrl(uploadData.path)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      path: uploadData.path,
      type: fileType || (isVideo ? 'video' : 'image'),
    })
  } catch (error: unknown) {
    logger.error('Portfolio upload error:', error)
    return NextResponse.json(
      { error: 'Server error during upload' },
      { status: 500 }
    )
  }
}
