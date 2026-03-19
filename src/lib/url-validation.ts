import { SITE_URL } from '@/lib/seo/config'

/**
 * Private/internal IP ranges that must be blocked to prevent SSRF attacks.
 * Covers IPv4 private ranges, loopback, link-local, and IPv6 equivalents.
 */
const PRIVATE_IP_PATTERNS = [
  /^127\./,                          // IPv4 loopback
  /^10\./,                           // Class A private
  /^172\.(1[6-9]|2\d|3[01])\./,     // Class B private
  /^192\.168\./,                     // Class C private
  /^169\.254\./,                     // Link-local
  /^0\./,                            // Current network
  /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./, // Carrier-grade NAT (RFC 6598)
  /^198\.1[89]\./,                   // Benchmarking (RFC 2544)
  /^240\./,                          // Reserved
  /^255\.255\.255\.255$/,            // Broadcast
]

const PRIVATE_HOSTNAMES = [
  'metadata.google.internal',        // GCP metadata
  'metadata',                         // Generic cloud metadata
  '169.254.169.254',                  // AWS/GCP/Azure metadata endpoint
  'fd00::',                            // IPv6 private
]

/**
 * Check if a hostname resolves to a private/internal IP address.
 */
function isPrivateHostname(hostname: string): boolean {
  // Block known metadata/internal hostnames
  const lowerHostname = hostname.toLowerCase()
  if (PRIVATE_HOSTNAMES.some(h => lowerHostname === h || lowerHostname.endsWith('.' + h))) {
    return true
  }

  // Block direct IP addresses in private ranges
  if (PRIVATE_IP_PATTERNS.some(pattern => pattern.test(hostname))) {
    return true
  }

  // Block IPv6 loopback
  if (hostname === '::1' || hostname === '[::1]') {
    return true
  }

  return false
}

/**
 * Get the allowed hostname from SITE_URL configuration.
 * Returns the hostname that internal fetches are allowed to target.
 */
function getAllowedHostname(): string {
  try {
    return new URL(SITE_URL).hostname
  } catch {
    return 'lawtendr.com'
  }
}

/**
 * Validate a URL for safe server-side fetching (SSRF prevention).
 *
 * Only allows:
 * - URLs matching the site's own domain (from NEXT_PUBLIC_SITE_URL)
 * - localhost for development (http only)
 * - HTTPS protocol (or HTTP for localhost)
 *
 * Blocks:
 * - Private/internal IP ranges
 * - Non-HTTP(S) protocols
 * - Cloud metadata endpoints
 * - Any hostname not matching the site domain
 *
 * @param url - The URL string to validate
 * @returns {{ valid: true, url: URL } | { valid: false, reason: string }}
 */
export function validateFetchUrl(url: string): { valid: true; url: URL } | { valid: false; reason: string } {
  // Parse the URL
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { valid: false, reason: `Invalid URL format: ${url}` }
  }

  // Validate protocol - only allow http and https
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { valid: false, reason: `Blocked protocol: ${parsed.protocol}` }
  }

  const hostname = parsed.hostname.toLowerCase()

  // Block private/internal IPs
  if (isPrivateHostname(hostname)) {
    return { valid: false, reason: `Blocked private/internal hostname: ${hostname}` }
  }

  // Allow localhost only with http:// (for development)
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
  if (isLocalhost) {
    if (parsed.protocol !== 'http:') {
      return { valid: false, reason: 'Localhost only allowed with http://' }
    }
    // Localhost is allowed for dev
    return { valid: true, url: parsed }
  }

  // Enforce HTTPS for non-localhost
  if (parsed.protocol !== 'https:') {
    return { valid: false, reason: `Non-localhost URLs must use HTTPS, got: ${parsed.protocol}` }
  }

  // Validate hostname against allowed domain
  const allowedHostname = getAllowedHostname()

  // Allow exact match or subdomain match (e.g., www.lawtendr.com)
  if (hostname !== allowedHostname && !hostname.endsWith('.' + allowedHostname)) {
    return { valid: false, reason: `Hostname not allowed: ${hostname} (expected: ${allowedHostname})` }
  }

  return { valid: true, url: parsed }
}

/**
 * Validate an array of URLs and return only the safe ones.
 * Logs warnings for any rejected URLs.
 *
 * @param urls - Array of URL strings to validate
 * @param context - Logging context (e.g., 'sitemap-health')
 * @returns Array of validated URL strings
 */
export function filterSafeUrls(urls: string[], context: string): string[] {
  const safe: string[] = []

  for (const url of urls) {
    const result = validateFetchUrl(url)
    if (result.valid) {
      safe.push(result.url.toString())
    } else {
      console.warn(`[${context}] SSRF blocked: ${result.reason}`)
    }
  }

  return safe
}
