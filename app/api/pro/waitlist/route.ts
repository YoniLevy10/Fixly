import { NextResponse } from 'next/server'
import { addProWaitlistEntry } from '@/lib/data/pro-waitlist-store'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isSupabaseEnabled } from '@/lib/data/config'

export async function POST(request: Request) {
  const body = await request.json()
  if (!body.fullName || !body.phone) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (isSupabaseEnabled()) {
    const supabase = await createServerSupabaseClient()
    if (supabase) {
      const { error } = await supabase.from('pro_waitlist').insert({
        full_name: body.fullName,
        phone: body.phone,
        email: body.email ?? null,
        category: body.category ?? null,
        city: body.city ?? null,
        referral_code: body.referralCode ?? null,
      })
      if (!error) {
        return NextResponse.json({ ok: true }, { status: 201 })
      }
    }
  }

  addProWaitlistEntry({
    fullName: body.fullName,
    phone: body.phone,
    email: body.email,
    category: body.category,
    city: body.city,
    referralCode: body.referralCode,
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
