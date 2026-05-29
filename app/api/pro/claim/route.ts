import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { resolveDataBackend } from '@/lib/data/resolve-backend'

export async function POST(request: Request) {
  if (resolveDataBackend() !== 'supabase') {
    return NextResponse.json({ error: 'Supabase required' }, { status: 503 })
  }

  const { professionalId } = await request.json()
  if (!professionalId) {
    return NextResponse.json({ error: 'professionalId required' }, { status: 400 })
  }

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
    .select('id, title')
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json(
      { error: 'לא ניתן לקשר פרופיל — אולי כבר תפוס' },
      { status: 400 }
    )
  }

  await supabase.auth.updateUser({
    data: { role: 'professional', professional_id: professionalId },
  })

  return NextResponse.json({ ok: true, professional: data })
}
