/**
 * Formatting utilities for US Attorneys
 */

/**
 * Format a phone number for display
 */
export function formatPhone(phone: string): string {
  if (!phone) return ''

  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '')

  // Handle US numbers with country code
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    const national = cleaned.slice(1)
    return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`
  }

  // Handle 10-digit US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }

  return phone
}

/**
 * Mask a phone number for privacy
 */
export function maskPhone(phone: string): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length < 8) return phone
  return phone.slice(0, 4) + '****' + phone.slice(-4)
}

/**
 * Format a price in US dollars
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a date in US format
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

/**
 * Format a date with time
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Format a relative date (e.g., "5 minutes ago")
 */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
  if (diffWeek < 4) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`
  if (diffMonth < 12) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`

  return formatDate(d)
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Capitalize first letter
 */
export function capitalizeFirst(text: string): string {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Format a SIRET number with spaces
 * @deprecated Legacy French business ID formatting. Use bar_number display instead.
 */
export function formatSiret(siret: string): string {
  const cleaned = siret.replace(/\s/g, '')
  if (cleaned.length !== 14) return siret
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9, 14)}`
}
