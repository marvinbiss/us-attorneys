/**
 * Message Reactions API
 * Reactions were removed (message_reactions table dropped in migration 100)
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json({ success: false, error: { message: 'Feature not available' } }, { status: 501 })
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: { message: 'Feature not available' } }, { status: 501 })
}
