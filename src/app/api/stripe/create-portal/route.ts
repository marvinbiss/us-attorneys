import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Feature not available' },
    { status: 501 }
  )
}
