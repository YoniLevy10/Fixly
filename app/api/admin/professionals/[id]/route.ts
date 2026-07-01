import { NextResponse } from 'next/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/admin/is-admin'
import { trackError } from '@/lib/monitoring/track-error'
import { z } from 'zod'
import { parseJsonBody } from '@/lib/api/parse-body'

type RouteContext = { params: Promise<{ id: string }> }

const patchSchema = z.object({
  isVerified: z.boolean(),
})

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createServerSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Auth' }, { status: 401 })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const parsed = await parseJsonBody(request, patchSchema)
  if (!parsed.success) return parsed.response

  const admin = getAdminSupabaseClient()
  if (!admin) return NextResponse.json({ error: 'Admin client' }, { status: 503 })

  try {
    const { error } = await admin
      .from('professionals')
      .update({
        is_verified: parsed.data.isVerified,
        verified_at: parsed.data.isVerified ? new Date().toISOString() : null,
      })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ ok: true, isVerified: parsed.data.isVerified })
  } catch (error) {
    trackError(error, { route: 'PATCH admin pro' })
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
