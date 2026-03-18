'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import Image from 'next/image'

interface AvatarSectionProps {
  provider: Record<string, unknown>
  onSaved: (updated: Record<string, unknown>) => void
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB — must match API limit

export function AvatarSection({ provider, onSaved }: AvatarSectionProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const avatarUrl = (provider.avatar_url as string) || null
  const name = (provider.name as string) || 'A'
  const initials = getInitials(name)
  const displayUrl = previewUrl || avatarUrl

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so same file can be selected again
    e.target.value = ''

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size: 2 MB.')
      return
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Unsupported file type. Use JPEG, PNG, or WebP.')
      return
    }

    // Show preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/attorney/avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload error')
      }

      // Update parent state with new avatar URL
      onSaved({ ...provider, avatar_url: data.url })
      setPreviewUrl(null)
      setSuccess('Photo updated')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload error')
      setPreviewUrl(null)
    } finally {
      setUploading(false)
      // Cleanup object URL
      URL.revokeObjectURL(objectUrl)
    }
  }

  const handleDelete = async () => {
    if (!avatarUrl) return

    setDeleting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/attorney/avatar', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Deletion error')
      }

      onSaved({ ...provider, avatar_url: null })
      setPreviewUrl(null)
      setSuccess('Photo deleted')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Deletion error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6" aria-busy={uploading || deleting}>
      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Camera className="w-5 h-5 text-blue-600" />
        Profile photo
      </h2>

      <div className="flex items-center gap-6">
        <div className="relative">
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt={`Profile photo of ${name}`}
              width={96}
              height={96}
              sizes="96px"
              className="w-24 h-24 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center" role="img" aria-label="No profile photo">
              <span className="text-3xl font-bold text-blue-600">{initials}</span>
            </div>
          )}
          {(uploading || deleting) && (
            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center" aria-busy="true">
              <Loader2 className="w-6 h-6 animate-spin text-white" aria-label="Processing" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-3">
            Add a professional profile photo to build trust.
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Accepted formats: JPEG, PNG, WebP. Maximum size: 2 MB.
          </p>

          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Choose a profile photo"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || deleting}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  Change photo
                </>
              )}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={uploading || deleting}
                className="text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error/Success */}
      {error && (
        <div role="alert" className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div role="status" aria-live="polite" className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}
    </div>
  )
}
