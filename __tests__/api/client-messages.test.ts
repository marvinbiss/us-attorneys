/**
 * Tests -- Client Messages API (/api/client/messages)
 * GET: auth check, conversation messages, conversation list, 404 for unknown conv, DB errors
 * POST: auth check, validation, send to existing conv, create new conv, missing provider_id, 403 forbidden conv
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================
// Mocks
// ============================================

const mockJsonFn = vi.fn((body: unknown, init?: { status?: number }) => ({
  body,
  status: init?.status ?? 200,
}))

vi.mock('next/server', () => ({
  NextResponse: { json: (body: unknown, init?: { status?: number }) => mockJsonFn(body, init) },
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Supabase builder tracking
let fromCallIndex = 0
type BuilderResult = { data: unknown; error: unknown; count?: number | null }
let builderResults: BuilderResult[] = []

function makeBuilder(result: BuilderResult) {
  const b: Record<string, unknown> = {}
  b.select = vi.fn().mockReturnValue(b)
  b.eq = vi.fn().mockReturnValue(b)
  b.is = vi.fn().mockReturnValue(b)
  b.order = vi.fn().mockReturnValue(b)
  b.limit = vi.fn().mockReturnValue(b)
  b.single = vi.fn().mockReturnValue(b)
  b.insert = vi.fn().mockReturnValue(b)
  b.update = vi.fn().mockReturnValue(b)
  ;(b as Record<string, unknown>).then = (resolve: (v: unknown) => unknown) =>
    resolve({ data: result.data, error: result.error, count: result.count ?? null })
  return b
}

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => {
    const idx = fromCallIndex
    fromCallIndex++
    if (idx < builderResults.length) {
      return makeBuilder(builderResults[idx])
    }
    return makeBuilder({ data: null, error: null })
  }),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

// ============================================
// Helpers
// ============================================

const USER_UUID = '550e8400-e29b-41d4-a716-446655440099'
const CONV_UUID = '550e8400-e29b-41d4-a716-446655440010'
const PROVIDER_UUID = '550e8400-e29b-41d4-a716-446655440020'

type MockResult = { body: Record<string, unknown>; status: number }

function makeGetRequest(params: Record<string, string> = {}) {
  const sp = new URLSearchParams(params)
  return new Request(`http://localhost/api/client/messages?${sp.toString()}`)
}

function makePostRequest(body: unknown) {
  return new Request('http://localhost/api/client/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function setAuthUser(user: { id: string } | null) {
  if (user) {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })
  } else {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'not authenticated' },
    })
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  fromCallIndex = 0
  builderResults = []
  setAuthUser(null)
})

// ============================================
// GET tests
// ============================================

describe('GET /api/client/messages', () => {
  it('returns 401 when not authenticated', async () => {
    setAuthUser(null)

    const { GET } = await import('@/app/api/client/messages/route')
    const result = (await GET(makeGetRequest())) as unknown as MockResult

    expect(result.status).toBe(401)
    expect(result.body.error).toBe('Non authentifi\u00e9')
  })

  it('returns messages for a specific conversation (200)', async () => {
    setAuthUser({ id: USER_UUID })

    const mockMessages = [
      { id: 'm1', conversation_id: CONV_UUID, sender_id: USER_UUID, sender_type: 'client', content: 'Bonjour', read_at: null, created_at: '2026-02-20T10:00:00Z' },
      { id: 'm2', conversation_id: CONV_UUID, sender_id: PROVIDER_UUID, sender_type: 'artisan', content: 'Salut', read_at: null, created_at: '2026-02-20T10:05:00Z' },
    ]

    builderResults = [
      // Call 0: conversations.select(...).eq('id').eq('client_id').single() -> conversation found
      { data: { id: CONV_UUID, client_id: USER_UUID, provider_id: PROVIDER_UUID }, error: null },
      // Call 1: messages.select(...).eq('conversation_id').order(...) -> messages
      { data: mockMessages, error: null },
      // Call 2: messages.update({read_at}).eq().eq().is() -> mark as read
      { data: null, error: null },
    ]

    const { GET } = await import('@/app/api/client/messages/route')
    const result = (await GET(makeGetRequest({ conversation_id: CONV_UUID }))) as unknown as MockResult

    expect(result.status).toBe(200)
    expect(result.body).toEqual({ messages: mockMessages, currentUserId: USER_UUID })
  })

  it('returns 404 when conversation is not found', async () => {
    setAuthUser({ id: USER_UUID })

    builderResults = [
      // conversations.select(...).single() -> not found
      { data: null, error: null },
    ]

    const { GET } = await import('@/app/api/client/messages/route')
    const result = (await GET(makeGetRequest({ conversation_id: CONV_UUID }))) as unknown as MockResult

    expect(result.status).toBe(404)
    expect(result.body.error).toBe('Conversation non trouv\u00e9e')
  })

  it('returns conversations list when no conversation_id provided', async () => {
    setAuthUser({ id: USER_UUID })

    const mockConvs = [
      {
        id: CONV_UUID,
        client_id: USER_UUID,
        provider_id: PROVIDER_UUID,
        status: 'active',
        created_at: '2026-02-20T10:00:00Z',
        booking_id: null,
        provider: { id: PROVIDER_UUID, name: 'Plombier Martin' },
        booking: null,
      },
    ]

    const lastMsg = { id: 'm1', content: 'Dernier message', created_at: '2026-02-20T11:00:00Z', sender_type: 'client', read_at: null }

    builderResults = [
      // Call 0: conversations.select(...).eq('client_id').eq('status').order(...) -> conversations
      { data: mockConvs, error: null },
      // Call 1: messages.select(...).eq('conversation_id').order().limit(1) -> last message for conv[0]
      { data: [lastMsg], error: null },
      // Call 2: messages.select('id', {count,head}).eq().eq().is() -> unread count for conv[0]
      { data: null, error: null, count: 2 },
    ]

    const { GET } = await import('@/app/api/client/messages/route')
    const result = (await GET(makeGetRequest())) as unknown as MockResult

    expect(result.status).toBe(200)
    const body = result.body as { conversations: Array<Record<string, unknown>> }
    expect(body.conversations).toHaveLength(1)
    expect(body.conversations[0].partner).toEqual({ id: PROVIDER_UUID, name: 'Plombier Martin' })
    expect(body.conversations[0].lastMessage).toEqual(lastMsg)
    expect(body.conversations[0].unreadCount).toBe(2)
  })

  it('returns 400 for invalid conversation_id format', async () => {
    setAuthUser({ id: USER_UUID })

    const { GET } = await import('@/app/api/client/messages/route')
    const result = (await GET(makeGetRequest({ conversation_id: 'not-a-uuid' }))) as unknown as MockResult

    expect(result.status).toBe(400)
    expect(result.body.error).toBe('Invalid parameters')
  })

  it('returns 500 when messages query fails', async () => {
    setAuthUser({ id: USER_UUID })

    builderResults = [
      // Call 0: conversations.select(...).single() -> found
      { data: { id: CONV_UUID, client_id: USER_UUID, provider_id: PROVIDER_UUID }, error: null },
      // Call 1: messages.select(...) -> DB error
      { data: null, error: { message: 'DB error', code: '08000' } },
    ]

    const { GET } = await import('@/app/api/client/messages/route')
    const result = (await GET(makeGetRequest({ conversation_id: CONV_UUID }))) as unknown as MockResult

    expect(result.status).toBe(500)
    expect(result.body.error).toBe('Erreur lors de la r\u00e9cup\u00e9ration des messages')
  })

  it('returns 500 when conversations query fails', async () => {
    setAuthUser({ id: USER_UUID })

    builderResults = [
      // Call 0: conversations.select(...) -> DB error
      { data: null, error: { message: 'DB error', code: '08000' } },
    ]

    const { GET } = await import('@/app/api/client/messages/route')
    const result = (await GET(makeGetRequest())) as unknown as MockResult

    expect(result.status).toBe(500)
    expect(result.body.error).toBe('Erreur lors de la r\u00e9cup\u00e9ration des conversations')
  })
})

// ============================================
// POST tests
// ============================================

describe('POST /api/client/messages', () => {
  it('returns 401 when not authenticated', async () => {
    setAuthUser(null)

    const { POST } = await import('@/app/api/client/messages/route')
    const result = (await POST(makePostRequest({ content: 'Hello' }))) as unknown as MockResult

    expect(result.status).toBe(401)
    expect(result.body.error).toBe('Non authentifi\u00e9')
  })

  it('returns 400 for invalid data (empty content)', async () => {
    setAuthUser({ id: USER_UUID })

    const { POST } = await import('@/app/api/client/messages/route')
    const result = (await POST(makePostRequest({ content: '' }))) as unknown as MockResult

    expect(result.status).toBe(400)
    expect(result.body.error).toBe('Validation error')
  })

  it('returns 400 for missing content', async () => {
    setAuthUser({ id: USER_UUID })

    const { POST } = await import('@/app/api/client/messages/route')
    const result = (await POST(makePostRequest({ conversation_id: CONV_UUID }))) as unknown as MockResult

    expect(result.status).toBe(400)
    expect(result.body.error).toBe('Validation error')
  })

  it('creates a new message in existing conversation (200)', async () => {
    setAuthUser({ id: USER_UUID })

    const mockMessage = {
      id: 'm-new',
      conversation_id: CONV_UUID,
      sender_id: USER_UUID,
      sender_type: 'client',
      content: 'Bonjour, je voudrais un devis.',
      created_at: '2026-02-20T12:00:00Z',
    }

    builderResults = [
      // Call 0: conversations.select('id').eq('id').eq('client_id').single() -> found
      { data: { id: CONV_UUID }, error: null },
      // Call 1: messages.insert(...).select().single() -> created message
      { data: mockMessage, error: null },
    ]

    const { POST } = await import('@/app/api/client/messages/route')
    const result = (await POST(makePostRequest({
      conversation_id: CONV_UUID,
      content: 'Bonjour, je voudrais un devis.',
    }))) as unknown as MockResult

    expect(result.status).toBe(200)
    expect(result.body.success).toBe(true)
    expect(result.body.message).toEqual(mockMessage)
  })

  it('returns 403 when conversation does not belong to user', async () => {
    setAuthUser({ id: USER_UUID })

    builderResults = [
      // Call 0: conversations.select('id').eq('id').eq('client_id').single() -> not found
      { data: null, error: null },
    ]

    const { POST } = await import('@/app/api/client/messages/route')
    const result = (await POST(makePostRequest({
      conversation_id: CONV_UUID,
      content: 'Hello',
    }))) as unknown as MockResult

    expect(result.status).toBe(403)
    expect(result.body.error).toContain('non trouv')
  })

  it('returns 400 when no conversation_id and no provider_id', async () => {
    setAuthUser({ id: USER_UUID })

    const { POST } = await import('@/app/api/client/messages/route')
    const result = (await POST(makePostRequest({
      content: 'Hello',
    }))) as unknown as MockResult

    expect(result.status).toBe(400)
    expect(result.body.error).toBe('conversation_id ou provider_id requis')
  })

  it('finds existing conversation by provider_id and sends message', async () => {
    setAuthUser({ id: USER_UUID })

    const mockMessage = {
      id: 'm-new',
      conversation_id: CONV_UUID,
      sender_id: USER_UUID,
      sender_type: 'client',
      content: 'Hello',
      created_at: '2026-02-20T12:00:00Z',
    }

    builderResults = [
      // Call 0: conversations.select('id').eq('client_id').eq('provider_id').single() -> existing conv
      { data: { id: CONV_UUID }, error: null },
      // Call 1: messages.insert(...).select().single() -> created message
      { data: mockMessage, error: null },
    ]

    const { POST } = await import('@/app/api/client/messages/route')
    const result = (await POST(makePostRequest({
      provider_id: PROVIDER_UUID,
      content: 'Hello',
    }))) as unknown as MockResult

    expect(result.status).toBe(200)
    expect(result.body.success).toBe(true)
    expect(result.body.message).toEqual(mockMessage)
  })

  it('creates a new conversation when none exists for provider_id', async () => {
    setAuthUser({ id: USER_UUID })

    const newConvId = '550e8400-e29b-41d4-a716-446655440030'
    const mockMessage = {
      id: 'm-new',
      conversation_id: newConvId,
      sender_id: USER_UUID,
      sender_type: 'client',
      content: 'Bonjour',
      created_at: '2026-02-20T12:00:00Z',
    }

    builderResults = [
      // Call 0: conversations.select('id').eq().eq().single() -> no existing conv
      { data: null, error: null },
      // Call 1: conversations.insert({client_id, provider_id}).select('id').single() -> new conv
      { data: { id: newConvId }, error: null },
      // Call 2: messages.insert(...).select().single() -> created message
      { data: mockMessage, error: null },
    ]

    const { POST } = await import('@/app/api/client/messages/route')
    const result = (await POST(makePostRequest({
      provider_id: PROVIDER_UUID,
      content: 'Bonjour',
    }))) as unknown as MockResult

    expect(result.status).toBe(200)
    expect(result.body.success).toBe(true)
    expect(result.body.message).toEqual(mockMessage)
  })

  it('returns 500 when conversation creation fails', async () => {
    setAuthUser({ id: USER_UUID })

    builderResults = [
      // Call 0: conversations.select('id').eq().eq().single() -> no existing conv
      { data: null, error: null },
      // Call 1: conversations.insert(...).select('id').single() -> error
      { data: null, error: { message: 'insert failed', code: '23505' } },
    ]

    const { POST } = await import('@/app/api/client/messages/route')
    const result = (await POST(makePostRequest({
      provider_id: PROVIDER_UUID,
      content: 'Hello',
    }))) as unknown as MockResult

    expect(result.status).toBe(500)
    expect(result.body.error).toContain('cr\u00e9ation')
  })

  it('returns 500 when message insert fails', async () => {
    setAuthUser({ id: USER_UUID })

    builderResults = [
      // Call 0: conversations.select('id').eq('id').eq('client_id').single() -> found
      { data: { id: CONV_UUID }, error: null },
      // Call 1: messages.insert(...).select().single() -> error
      { data: null, error: { message: 'insert failed', code: '08000' } },
    ]

    const { POST } = await import('@/app/api/client/messages/route')
    const result = (await POST(makePostRequest({
      conversation_id: CONV_UUID,
      content: 'Hello',
    }))) as unknown as MockResult

    expect(result.status).toBe(500)
    expect(result.body.error).toContain('envoi')
  })
})
