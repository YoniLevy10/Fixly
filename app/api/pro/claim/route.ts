import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { resolveDataBackend } from '@/lib/data/resolve-backend'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { parseJsonBody } from '@/lib/api/parse-body'
import { proClaimSchema } from '@/lib/api/schemas'
import { trackError } from '@/lib/monitoring/track-error'
import { linkProspectToProfessional } from '@/lib/prospects/service'

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, 'pro-claim', 10, 60_000)
  if (limited) return limited

  if (resolveDataBackend() !== 'supabase') {
    return NextResponse.json({ error: 'Supabase required' }, { status: 503 })
  }

  try {
    const parsed = await parseJsonBody(request, proClaimSchema)
    if (!parsed.success) return parsed.response
    const { professionalId } = parsed.data

    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Auth unavailable' }, { status: 500 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('professionals')
      .update({ user_id: user.id })
      .eq('id', professionalId)
      .is('user_id', null)
      .select('id, title, phone, whatsapp_number')
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json(
        { error: 'לא ניתן לקשר פרופיל — אולי כבר תפוס' },
        { status: 400 },
      )
    }

    await supabase.auth.updateUser({
      data: { role: 'professional', professional_id: professionalId },
    })

    const admin = getAdminSupabaseClient()
    if (admin) {
      try {
        await linkProspectToProfessional(admin, {
          professionalId: data.id,
          phone: (data.whatsapp_number as string | null) ?? (data.phone as string | null),
          actorUserId: user.id,
        })
      } catch (linkError) {
        console.warn(
          '[prospects] claim link failed',
          linkError instanceof Error ? linkError.message : linkError,
        )
      }
    }

    return NextResponse.json({ ok: true, professional: data })
  } catch (error) {
    trackError(error, { route: 'POST /api/pro/claim' })
    return NextResponse.json({ error: 'שגיאה בקישור פרופיל' }, { status: 500 })
  }
}
