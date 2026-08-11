import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Auth required' }, { status: 401 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Auth required' }, { status: 401 })
  }

  const { data: pro } = await supabase
    .from('professionals')
    .select('subscription_tier, lead_credits, subscription_until, stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!pro) {
    return NextResponse.json({ error: 'Not a professional' }, { status: 403 })
  }

  return NextResponse.json({
    subscription_tier: pro.subscription_tier,
    lead_credits: pro.lead_credits,
    subscription_until: pro.subscription_until,
    stripe_customer_id: pro.stripe_customer_id,
  })
}
