import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session?.user) {
      const user = data.session.user

      // Check if profile exists — create one if this is a first OAuth sign-in
      const adminClient = createAdminClient()
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        // Extract name from OAuth metadata
        const meta = user.user_metadata
        const fullName =
          meta?.full_name ||
          meta?.name ||
          `${meta?.first_name || ''} ${meta?.last_name || ''}`.trim() ||
          user.email?.split('@')[0] ||
          ''

        await adminClient.from('profiles').insert({
          id: user.id,
          email: (user.email || '').toLowerCase(),
          full_name: fullName,
          role: 'client',
          created_at: new Date().toISOString(),
        })
      }

      // Redirect to appropriate dashboard if no specific next URL
      if (next === '/') {
        const defaultRedirect = (existingProfile?.role === 'artisan' || existingProfile?.role === 'attorney') ? '/attorney-dashboard' : '/client-dashboard' // DB value: 'artisan' maps to attorney role
        return NextResponse.redirect(`${origin}${defaultRedirect}`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
