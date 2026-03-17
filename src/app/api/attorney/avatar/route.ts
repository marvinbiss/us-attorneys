/**
 * Attorney Avatar API
 *
 * POST  — Upload a new avatar (Supabase Storage, bucket: avatars)
 * DELETE — Delete existing avatar
 *
 * Requires: migration 326_add_provider_avatar.sql (avatar_url column on providers)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAttorney } from '@/lib/auth/attorney-guard'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB

type AllowedMimeType = (typeof ALLOWED_TYPES)[number]

function isAllowedMimeType(type: string): type is AllowedMimeType {
  return (ALLOWED_TYPES as readonly string[]).includes(type)
}

function extensionFromMime(mime: AllowedMimeType): string {
  const map: Record<AllowedMimeType, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }
  return map[mime]
}

/** Extract the storage path from a Supabase Storage public URL */
function storagePathFromUrl(url: string, bucket: string): string | null {
  try {
    const parsed = new URL(url)
    // Format: /storage/v1/object/public/{bucket}/{path}
    const prefix = `/storage/v1/object/public/${bucket}/`
    if (parsed.pathname.startsWith(prefix)) {
      return parsed.pathname.slice(prefix.length)
    }
    return null
  } catch {
    return null
  }
}

/**
 * Validate the magic bytes of the buffer to confirm the actual file format.
 * Protects against MIME type spoofing (client can send any file.type).
 */
function validateMagicBytes(bytes: Uint8Array): boolean {
  // JPEG: FF D8 FF
  const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF
  // PNG: 89 50 4E 47
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4E &&
    bytes[3] === 0x47
  // WebP: bytes 8–11 = W E B P (requires at least 12 bytes)
  const isWebp =
    bytes.length >= 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50

  return isJpeg || isPng || isWebp
}

// =============================================================================
// POST — Upload a new avatar
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { error: guardError, user, supabase } = await requireAttorney()
  if (guardError) return guardError

  // Retrieve the provider linked to this user
  const { data: provider, error: attorneyError } = await supabase
    .from('attorneys')
    .select('id, avatar_url')
    .eq('user_id', user!.id)
    .single()

  if (attorneyError || !provider) {
    return NextResponse.json(
      { error: 'Attorney profile not found.' },
      { status: 404 }
    )
  }

  // Parse the FormData and extract the file
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body. Expected: multipart/form-data.' },
      { status: 400 }
    )
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'Missing or invalid "file" field.' },
      { status: 400 }
    )
  }

  // Validate the declared MIME type and size
  if (!isAllowedMimeType(file.type)) {
    return NextResponse.json(
      {
        error: `Unauthorized file type: ${file.type}. Accepted types: JPEG, PNG, WebP.`,
      },
      { status: 422 }
    )
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'File too large. Maximum size: 2 MB.' },
      { status: 422 }
    )
  }

  // Bug 1 fix — Validate magic bytes to counter MIME type spoofing.
  // The file.type is provided by the client and can be spoofed. We read the
  // first bytes of the buffer to confirm the actual file format.
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  if (!validateMagicBytes(bytes)) {
    return NextResponse.json(
      { error: 'Invalid file format' },
      { status: 400 }
    )
  }

  // Create a Blob from the validated buffer (not the original File) for Storage upload.
  // This ensures we upload exactly the bytes read server-side.
  const fileBlob = new Blob([buffer], { type: file.type })

  // Delete the old avatar if it exists
  const currentAvatarUrl = provider.avatar_url as string | null
  if (currentAvatarUrl) {
    const oldPath = storagePathFromUrl(currentAvatarUrl, 'avatars')
    if (oldPath) {
      // Non-blocking error: continue even if deletion fails
      await supabase.storage.from('avatars').remove([oldPath])
    }
  }

  // Upload the new file to Storage (fileBlob, not file)
  const ext = extensionFromMime(file.type)
  const storagePath = `${provider.id}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(storagePath, fileBlob, { upsert: true, contentType: file.type })

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    )
  }

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(storagePath)

  const publicUrl = publicUrlData.publicUrl

  // Update the avatar_url column in attorneys
  const { error: updateError } = await supabase
    .from('attorneys')
    .update({ avatar_url: publicUrl })
    .eq('user_id', user!.id)

  if (updateError) {
    return NextResponse.json(
      { error: `Profile update failed: ${updateError.message}` },
      { status: 500 }
    )
  }

  // Return the public URL
  return NextResponse.json({ url: publicUrl }, { status: 200 })
}

// =============================================================================
// DELETE — Delete the avatar
// =============================================================================

export async function DELETE(): Promise<NextResponse> {
  const { error: guardError, user, supabase } = await requireAttorney()
  if (guardError) return guardError

  // Retrieve the attorney and their current avatar_url
  const { data: provider, error: attorneyError } = await supabase
    .from('attorneys')
    .select('id, avatar_url')
    .eq('user_id', user!.id)
    .single()

  if (attorneyError || !provider) {
    return NextResponse.json(
      { error: 'Attorney profile not found.' },
      { status: 404 }
    )
  }

  const currentAvatarUrl = provider.avatar_url as string | null

  if (!currentAvatarUrl) {
    return NextResponse.json(
      { error: 'No avatar to delete.' },
      { status: 404 }
    )
  }

  // Bug 2 fix: if storagePathFromUrl returns null, we cannot locate the
  // file in Storage. We refuse to nullify avatar_url to avoid an orphaned
  // file (file in Storage but URL removed from DB without deleting it).
  const storagePath = storagePathFromUrl(currentAvatarUrl, 'avatars')

  if (!storagePath) {
    return NextResponse.json(
      { error: 'Unable to locate the avatar file' },
      { status: 400 }
    )
  }

  const { error: removeError } = await supabase.storage
    .from('avatars')
    .remove([storagePath])

  if (removeError) {
    return NextResponse.json(
      { error: `File deletion failed: ${removeError.message}` },
      { status: 500 }
    )
  }

  // Set avatar_url to NULL in providers (only after successful deletion)
  const { error: updateError } = await supabase
    .from('attorneys')
    .update({ avatar_url: null })
    .eq('user_id', user!.id)

  if (updateError) {
    return NextResponse.json(
      { error: `Profile update failed: ${updateError.message}` },
      { status: 500 }
    )
  }

  // Return success
  return NextResponse.json({ success: true }, { status: 200 })
}
