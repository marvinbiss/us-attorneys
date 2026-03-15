/**
 * Supabase Storage utilities for portfolio file management
 */

import { createClient } from '@/lib/supabase/client'
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  type UploadedFile,
} from '@/types/portfolio'

const PORTFOLIO_BUCKET = 'portfolio'

interface UploadOptions {
  onProgress?: (progress: number) => void
}

/**
 * Validate file type and size
 */
export function validateFile(file: File, type: 'image' | 'video'): { valid: boolean; error?: string } {
  const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES
  const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type. Accepted types: ${allowedTypes.join(', ')}`,
    }
  }

  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024)
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
    }
  }

  return { valid: true }
}

/**
 * Generate a unique file path for storage
 */
export function generateFilePath(attorneyId: string, fileName: string): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg'
  const sanitizedName = fileName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9-_]/g, '_') // Sanitize
    .substring(0, 50) // Limit length

  return `${attorneyId}/${timestamp}-${randomStr}-${sanitizedName}.${extension}`
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  attorneyId: string,
  _options?: UploadOptions
): Promise<UploadedFile> {
  const supabase = createClient()
  const filePath = generateFilePath(attorneyId, file.name)

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(PORTFOLIO_BUCKET)
    .upload(filePath, file, {
      cacheControl: '31536000', // 1 year
      upsert: false,
    })

  if (error) {
    throw new Error(`Upload error: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(PORTFOLIO_BUCKET)
    .getPublicUrl(data.path)

  const result: UploadedFile = {
    url: urlData.publicUrl,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  }

  // Generate thumbnail for images
  if (file.type.startsWith('image/')) {
    const dimensions = await getImageDimensions(file)
    result.width = dimensions.width
    result.height = dimensions.height

    // Generate and upload thumbnail
    try {
      const thumbnail = await generateThumbnail(file, 400)
      const thumbnailPath = filePath.replace(/\.([^.]+)$/, '_thumb.$1')

      const { error: thumbError } = await supabase.storage
        .from(PORTFOLIO_BUCKET)
        .upload(thumbnailPath, thumbnail, {
          cacheControl: '31536000',
          upsert: false,
        })

      if (!thumbError) {
        const { data: thumbUrlData } = supabase.storage
          .from(PORTFOLIO_BUCKET)
          .getPublicUrl(thumbnailPath)
        result.thumbnailUrl = thumbUrlData.publicUrl
      }
    } catch (error: unknown) {
      console.warn('Failed to generate thumbnail:', error)
    }
  }

  // Get video duration if applicable
  if (file.type.startsWith('video/')) {
    try {
      result.duration = await getVideoDuration(file)
    } catch (error: unknown) {
      console.warn('Failed to get video duration:', error)
    }
  }

  return result
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  const supabase = createClient()

  // Extract path from URL
  const url = new URL(fileUrl)
  const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/portfolio\/(.+)/)

  if (!pathMatch) {
    throw new Error('Invalid file URL')
  }

  const filePath = decodeURIComponent(pathMatch[1])

  const { error } = await supabase.storage
    .from(PORTFOLIO_BUCKET)
    .remove([filePath])

  if (error) {
    throw new Error(`Deletion error: ${error.message}`)
  }

  // Also try to delete thumbnail
  const thumbnailPath = filePath.replace(/\.([^.]+)$/, '_thumb.$1')
  await supabase.storage
    .from(PORTFOLIO_BUCKET)
    .remove([thumbnailPath])
    .catch(() => {}) // Ignore thumbnail deletion errors
}

/**
 * Get image dimensions
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => {
      reject(new Error('Failed to load image'))
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Generate a thumbnail from an image file
 */
export async function generateThumbnail(file: File, maxSize: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // Calculate dimensions maintaining aspect ratio
      let { width, height } = img
      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create thumbnail'))
          }
        },
        'image/jpeg',
        0.85
      )

      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => {
      reject(new Error('Failed to load image'))
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Get video duration in seconds
 */
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      resolve(Math.round(video.duration))
      URL.revokeObjectURL(video.src)
    }
    video.onerror = () => {
      reject(new Error('Failed to load video'))
      URL.revokeObjectURL(video.src)
    }
    video.src = URL.createObjectURL(file)
  })
}

/**
 * Generate video thumbnail from first frame
 */
export async function generateVideoThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadeddata = () => {
      // Seek to first frame
      video.currentTime = 0.1
    }

    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      ctx.drawImage(video, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create video thumbnail'))
          }
        },
        'image/jpeg',
        0.85
      )

      URL.revokeObjectURL(video.src)
    }

    video.onerror = () => {
      reject(new Error('Failed to load video'))
      URL.revokeObjectURL(video.src)
    }

    video.src = URL.createObjectURL(file)
  })
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
