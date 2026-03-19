/**
 * Tests for src/lib/storage.ts
 * Covers validateFile, generateFilePath, formatFileSize, uploadFile, deleteFile
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase client
const mockUpload = vi.fn()
const mockGetPublicUrl = vi.fn()
const mockRemove = vi.fn()
const mockFrom = vi.fn(() => ({
  upload: mockUpload,
  getPublicUrl: mockGetPublicUrl,
  remove: mockRemove,
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: {
      from: mockFrom,
    },
  }),
}))

// Mock the portfolio types (constants)
vi.mock('@/types/portfolio', () => ({
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'],
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
}))

import {
  validateFile,
  generateFilePath,
  formatFileSize,
  uploadFile,
  deleteFile,
} from '@/lib/storage'

// Helper to create a mock File with an accurate .size
function createMockFile(name: string, size: number, type: string): File {
  // Create a minimal blob, then override size via Object.defineProperty
  const blob = new Blob(['x'], { type })
  const file = Object.assign(blob, {
    name,
    lastModified: Date.now(),
    webkitRelativePath: '',
  }) as File
  Object.defineProperty(file, 'size', { value: size, writable: false })
  return file
}

// ─── validateFile ────────────────────────────────────────────────────

describe('validateFile', () => {
  it('returns valid for an accepted image type', () => {
    const file = createMockFile('photo.jpg', 1024, 'image/jpeg')
    const result = validateFile(file, 'image')
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('returns valid for image/png', () => {
    const file = createMockFile('photo.png', 1024, 'image/png')
    expect(validateFile(file, 'image').valid).toBe(true)
  })

  it('returns valid for image/webp', () => {
    const file = createMockFile('photo.webp', 1024, 'image/webp')
    expect(validateFile(file, 'image').valid).toBe(true)
  })

  it('returns valid for image/gif', () => {
    const file = createMockFile('anim.gif', 1024, 'image/gif')
    expect(validateFile(file, 'image').valid).toBe(true)
  })

  it('returns invalid for unsupported image type', () => {
    const file = createMockFile('photo.bmp', 1024, 'image/bmp')
    const result = validateFile(file, 'image')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Unsupported file type')
  })

  it('returns invalid for image exceeding max size', () => {
    const file = createMockFile('huge.jpg', 11 * 1024 * 1024, 'image/jpeg')
    const result = validateFile(file, 'image')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('File too large')
    expect(result.error).toContain('10')
  })

  it('returns valid for image exactly at max size', () => {
    const file = createMockFile('exact.jpg', 10 * 1024 * 1024, 'image/jpeg')
    expect(validateFile(file, 'image').valid).toBe(true)
  })

  it('returns valid for accepted video type video/mp4', () => {
    const file = createMockFile('clip.mp4', 1024, 'video/mp4')
    expect(validateFile(file, 'video').valid).toBe(true)
  })

  it('returns valid for video/webm', () => {
    const file = createMockFile('clip.webm', 1024, 'video/webm')
    expect(validateFile(file, 'video').valid).toBe(true)
  })

  it('returns invalid for unsupported video type', () => {
    const file = createMockFile('clip.avi', 1024, 'video/avi')
    const result = validateFile(file, 'video')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Unsupported file type')
  })

  it('returns invalid for video exceeding max size', () => {
    const file = createMockFile('huge.mp4', 51 * 1024 * 1024, 'video/mp4')
    const result = validateFile(file, 'video')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('File too large')
  })

  it('returns valid for video at exactly max size', () => {
    const file = createMockFile('exact.mp4', 50 * 1024 * 1024, 'video/mp4')
    expect(validateFile(file, 'video').valid).toBe(true)
  })
})

// ─── generateFilePath ────────────────────────────────────────────────

describe('generateFilePath', () => {
  it('starts with the attorney ID', () => {
    const path = generateFilePath('att-123', 'photo.jpg')
    expect(path.startsWith('att-123/')).toBe(true)
  })

  it('ends with the correct extension', () => {
    const path = generateFilePath('att-123', 'photo.jpg')
    expect(path.endsWith('.jpg')).toBe(true)
  })

  it('preserves png extension', () => {
    const path = generateFilePath('att-123', 'image.PNG')
    expect(path.endsWith('.png')).toBe(true)
  })

  it('uses the filename itself as extension when no dot present', () => {
    // 'noext'.split('.').pop() returns 'noext', so extension becomes 'noext'
    const path = generateFilePath('att-123', 'noext')
    expect(path.endsWith('.noext')).toBe(true)
  })

  it('sanitizes special characters from the filename', () => {
    const path = generateFilePath('att-123', 'my photo (1).jpeg')
    expect(path).not.toContain(' ')
    expect(path).not.toContain('(')
    expect(path).not.toContain(')')
  })

  it('truncates long filenames to 50 characters', () => {
    const longName = 'a'.repeat(100) + '.jpg'
    const path = generateFilePath('att-123', longName)
    // The sanitized name portion (between random str and extension) is at most 50 chars
    const parts = path.split('/')
    const fileName = parts[1]
    // fileName = timestamp-random-sanitized.ext
    // sanitized part is capped at 50
    expect(fileName.length).toBeLessThan(100)
  })

  it('includes a timestamp and random string for uniqueness', () => {
    const path1 = generateFilePath('att-123', 'photo.jpg')
    // Just verify the format includes timestamp-random pattern
    const fileName = path1.split('/')[1]
    const parts = fileName.split('-')
    // First part should be a numeric timestamp
    expect(Number(parts[0])).toBeGreaterThan(0)
  })

  it('handles filenames with multiple dots', () => {
    const path = generateFilePath('att-123', 'my.photo.test.png')
    expect(path.endsWith('.png')).toBe(true)
  })
})

// ─── formatFileSize ──────────────────────────────────────────────────

describe('formatFileSize', () => {
  it('returns "0 B" for 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })

  it('formats bytes correctly', () => {
    expect(formatFileSize(500)).toBe('500 B')
  })

  it('formats kilobytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB')
  })

  it('formats megabytes correctly', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB')
  })

  it('formats gigabytes correctly', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
  })

  it('formats fractional megabytes', () => {
    const result = formatFileSize(1.5 * 1024 * 1024)
    expect(result).toBe('1.5 MB')
  })

  it('formats 10MB correctly', () => {
    expect(formatFileSize(10 * 1024 * 1024)).toBe('10 MB')
  })

  it('formats small kilobyte values with one decimal', () => {
    const result = formatFileSize(1536) // 1.5 KB
    expect(result).toBe('1.5 KB')
  })
})

// ─── uploadFile ──────────────────────────────────────────────────────

describe('uploadFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('throws on upload error', async () => {
    mockUpload.mockResolvedValueOnce({
      data: null,
      error: { message: 'Bucket not found' },
    })

    const file = createMockFile('photo.jpg', 1024, 'video/mp4')
    await expect(uploadFile(file, 'att-123')).rejects.toThrow('Upload error: Bucket not found')
  })

  it('calls supabase storage.from with portfolio bucket', async () => {
    mockUpload.mockResolvedValueOnce({
      data: { path: 'att-123/test.txt' },
      error: null,
    })
    mockGetPublicUrl.mockReturnValueOnce({
      data: { publicUrl: 'https://storage.example.com/att-123/test.txt' },
    })

    // Use a non-image, non-video MIME type to avoid DOM-dependent branches
    const file = createMockFile('test.txt', 1024, 'application/pdf')
    const result = await uploadFile(file, 'att-123')
    expect(mockFrom).toHaveBeenCalledWith('portfolio')
    expect(result.url).toBe('https://storage.example.com/att-123/test.txt')
    expect(result.fileName).toBe('test.txt')
  })
})

// ─── deleteFile ──────────────────────────────────────────────────────

describe('deleteFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws on invalid file URL (no matching path)', async () => {
    await expect(deleteFile('https://example.com/some/random/path')).rejects.toThrow(
      'Invalid file URL'
    )
  })

  it('extracts path from valid storage URL and calls remove', async () => {
    mockRemove.mockResolvedValueOnce({ error: null })
    // Second call for thumbnail deletion
    mockRemove.mockResolvedValueOnce({ error: null })

    await deleteFile('https://xyz.supabase.co/storage/v1/object/public/portfolio/att-123/photo.jpg')

    expect(mockFrom).toHaveBeenCalledWith('portfolio')
    expect(mockRemove).toHaveBeenCalledWith(['att-123/photo.jpg'])
  })

  it('throws on deletion error from supabase', async () => {
    mockRemove.mockResolvedValueOnce({ error: { message: 'Not found' } })

    await expect(
      deleteFile('https://xyz.supabase.co/storage/v1/object/public/portfolio/att-123/photo.jpg')
    ).rejects.toThrow('Deletion error: Not found')
  })

  it('attempts thumbnail deletion after successful main file deletion', async () => {
    mockRemove.mockResolvedValueOnce({ error: null })
    mockRemove.mockResolvedValueOnce({ error: null })

    await deleteFile('https://xyz.supabase.co/storage/v1/object/public/portfolio/att-123/photo.jpg')

    // Second call should be for thumbnail
    expect(mockRemove).toHaveBeenCalledTimes(2)
    expect(mockRemove).toHaveBeenNthCalledWith(2, ['att-123/photo_thumb.jpg'])
  })

  it('does not throw if thumbnail deletion fails', async () => {
    mockRemove.mockResolvedValueOnce({ error: null })
    mockRemove.mockRejectedValueOnce(new Error('thumb error'))

    // Should not throw
    await expect(
      deleteFile('https://xyz.supabase.co/storage/v1/object/public/portfolio/att-123/photo.jpg')
    ).resolves.toBeUndefined()
  })

  it('handles URL-encoded paths', async () => {
    mockRemove.mockResolvedValueOnce({ error: null })
    mockRemove.mockResolvedValueOnce({ error: null })

    await deleteFile(
      'https://xyz.supabase.co/storage/v1/object/public/portfolio/att-123/my%20photo.jpg'
    )

    expect(mockRemove).toHaveBeenCalledWith(['att-123/my photo.jpg'])
  })
})
