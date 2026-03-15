import { createApiHandler, jsonResponse } from '@/lib/api/handler'
import { createClient } from '@/lib/supabase/server'
import { providerUpdateSchema } from '@/schemas/provider'
import { NotFoundError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

export const PATCH = createApiHandler(
  async ({ body, user }) => {
    const supabase = await createClient()

    // Get provider for this user
    const { data: provider, error: fetchError } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user!.id)
      .single()

    if (fetchError || !provider) {
      throw new NotFoundError('Attorney profile')
    }

    // Update provider
    const { data: updated, error: updateError } = await supabase
      .from('attorneys')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', provider.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return jsonResponse(updated)
  },
  {
    bodySchema: providerUpdateSchema,
    requireAuth: true,
  }
)
