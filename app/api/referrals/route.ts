import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { trackError } from '@/lib/monitoring/track-error'

function randomCode(): string {
  return `fixly-${Math.random().toString(36).slice(2, 8)}`
}

export async function GET() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return NextResponse.json({ code: null })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

  const { data: existing } = await supabase
    .from('referral_codes')
    .select('code, uses_count')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({
      code: existing.code,
      uses: existing.uses_count,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/?ref=${existing.code}`,
    })
  }

  const code = randomCode()
  const { data: created, error } = await supabase
    .from('referral_codes')
    .insert({ user_id: user.id, code })
    .select('code, uses_count')
    .single()

  if (error) {
    trackError(error, { route: 'GET /api/referrals' })
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }

  return NextResponse.json({
    code: created.code,
    uses: created.uses_count,
    shareUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/?ref=${created.code}`,
  })
}
