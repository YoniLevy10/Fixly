import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createProSubscriptionCheckout } from '@/lib/tranzila/checkout'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { professionalId, type, amountIls, successUrl, cancelUrl, requestId } = body as {
    professionalId?: string
    type?: string
    amountIls?: number
    successUrl?: string
    cancelUrl?: string
    requestId?: string
  }

  if (type === 'pro') {
    if (!professionalId || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const result = await createProSubscriptionCheckout({ professionalId, successUrl, cancelUrl })
    if (!result.configured) return NextResponse.json({ error: result.message }, { status: 503 })
    return NextResponse.json({ url: result.url })
  }

  if (type === 'job') {
    const { createJobPaymentCheckout } = await import('@/lib/tranzila/checkout')
    const jobRequestId = requestId || professionalId
    if (!jobRequestId || !professionalId || amountIls == null || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const result = await createJobPaymentCheckout({
      requestId: jobRequestId,
      professionalId,
      amountIls,
      successUrl,
      cancelUrl,
    })
    if (!result.configured) return NextResponse.json({ error: result.message }, { status: 503 })
    return NextResponse.json({ url: result.url })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
