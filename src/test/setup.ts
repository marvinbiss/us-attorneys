import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Set required env vars for Supabase client initialization in tests
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'
process.env.NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://us-attorneys.com'

// Global mock for logger — prevents "logger.child is not a function" cascade
// Individual tests can override with their own vi.mock('@/lib/logger') if needed
const createMockLogger = () => {
  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn((): typeof mockLogger => createMockLogger()),
  }
  return mockLogger
}

vi.mock('@/lib/logger', () => {
  const logger = createMockLogger()
  return {
    logger,
    apiLogger: logger,
    dbLogger: logger,
    authLogger: logger,
    seoLogger: logger,
    ingestLogger: logger,
    paymentLogger: logger,
  }
})

// Global mock for push notifications — prevents import errors in tests
vi.mock('@/lib/push/vapid', () => ({
  getVapidKeys: vi.fn(() => ({ publicKey: 'test', privateKey: 'test' })),
}))

vi.mock('@/lib/push/send', () => ({
  sendPushToUser: vi.fn(),
  sendPushNotification: vi.fn(),
}))
