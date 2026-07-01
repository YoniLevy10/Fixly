import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createJobPaymentCheckout } from '@/lib/stripe/job-checkout'
import { publicEnv } from '@/lib/env/public-env'
import { trackError } from '@/lib/monitoring/track-error'
import { z } from 'zod'
import { parseJsonBody } from '@/lib/api/parse-body'

const schema = z.object({
  requestId: z.string().uuid(),
})

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, schema)
  if (!parsed.success) return parsed.response

  const supabase = await createServerSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

  const { data: req } = await supabase
    .from('requests')
    .select('id, customer_id, professional_id, status, quoted_amount, payment_status')
    .eq('id', parsed.data.requestId)
    .maybeSingle()

  if (!req || req.customer_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (req.status !== 'completed') {
    return NextResponse.json({ error: 'Job not completed' }, { status: 400 })
  }

  if (req.payment_status === 'paid') {
    return NextResponse.json({ error: 'Already paid' }, { status: 409 })
  }

  const amount = Number(req.quoted_amount)
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'No quoted amount' }, { status: 400 })
  }

  const base = publicEnv.appUrl || 'http://localhost:3000'
  const result = await createJobPaymentCheckout({
    requestId: req.id,
    professionalId: req.professional_id as string,
    amountIls: amount,
    successUrl: `${base}/tracking/${req.id}?paid=1`,
    cancelUrl: `${base}/tracking/${req.id}?paid=0`,
  })

  if (!result.configured) {
    return NextResponse.json({ configured: false, message: result.message })
  }

  try {
    await supabase
      .from('requests')
      .update({ payment_status: 'pending' })
      .eq('id', req.id)
  } catch (error) {
    trackError(error, { route: 'job-checkout update' })
  }

  return NextResponse.json({ configured: true, url: result.url })
}
