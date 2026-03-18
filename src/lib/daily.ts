/**
 * Daily.co API client for video room management
 */

const DAILY_API_BASE = 'https://api.daily.co/v1'

function getDailyApiKey(): string {
  const key = process.env.DAILY_API_KEY
  if (!key) throw new Error('DAILY_API_KEY is not set')
  return key
}

interface DailyRoom {
  id: string
  name: string
  url: string
  privacy: string
  created_at: string
  config: {
    exp?: number
    max_participants?: number
    enable_recording?: boolean
  }
}

export async function createDailyRoom(bookingId: string, expiresAt: Date): Promise<DailyRoom> {
  const roomName = `usattorneys-${bookingId.slice(0, 8)}`
  const exp = Math.floor(expiresAt.getTime() / 1000)

  const res = await fetch(`${DAILY_API_BASE}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getDailyApiKey()}`,
    },
    body: JSON.stringify({
      name: roomName,
      privacy: 'private',
      properties: {
        exp,
        max_participants: 2,
        enable_recording: false,
        enable_chat: true,
        enable_screenshare: true,
        lang: 'en',
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Daily.co API error ${res.status}: ${err}`)
  }

  return res.json()
}

export async function getDailyRoom(roomName: string): Promise<DailyRoom | null> {
  const res = await fetch(`${DAILY_API_BASE}/rooms/${roomName}`, {
    headers: { 'Authorization': `Bearer ${getDailyApiKey()}` },
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Daily.co API error ${res.status}`)
  return res.json()
}

export async function deleteDailyRoom(roomName: string): Promise<void> {
  const res = await fetch(`${DAILY_API_BASE}/rooms/${roomName}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getDailyApiKey()}` },
  })
  if (!res.ok && res.status !== 404) {
    throw new Error(`Daily.co delete error ${res.status}`)
  }
}
