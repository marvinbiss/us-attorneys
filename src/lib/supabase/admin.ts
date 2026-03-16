import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client with service_role key
 * SERVER-SIDE ONLY (admin / bypass RLS)
 *
 * The global.fetch wrapper passes `next: { revalidate: 3600 }` so that
 * Next.js caches Supabase responses and enables ISR for pages that use
 * this client.  Without this, internal HEAD/GET requests from PostgREST
 * are treated as uncacheable and force every page into dynamic SSR
 * (perpetual x-vercel-cache: MISS).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase admin env vars missing')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          next: { revalidate: 3600 },
        } as RequestInit)
      },
    },
  })
}
