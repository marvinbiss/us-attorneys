import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function requireAttorney() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }), user: null, supabase }
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'attorney') {
    return { error: NextResponse.json({ error: 'Access reserved for attorneys' }, { status: 403 }), user: null, supabase }
  }
  return { error: null, user, supabase }
}
