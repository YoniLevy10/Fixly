import { NextResponse } from 'next/server'
import { z } from 'zod'
import { parseJsonBody } from '@/lib/api/parse-body'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import {
  getRequestById,
  markRequestPaid,
  upsertRequest,
} from '@/lib/data/request-store'

const schema = z.object({
  requestId: z.string().min(1),
})

/**
 * POST /api/demo/pay — investor-demo job payment without Stripe/Tranzila.
 * Marks the mock request as paid so JobPaymentButton shows success.
 */
export async function POST(request: Request) {
  if (!isDemoDataMode()) {
    return NextResponse.json({ error: 'Demo only' }, { status: 403 })
  }

  const parsed = await parseJsonBody(request, schema)
  if (!parsed.success) return parsed.response

  const existing = getRequestById(parsed.data.requestId)
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (existing.status !== 'completed') {
    return NextResponse.json({ error: 'Job not completed' }, { status: 400 })
  }
  if (existing.paymentStatus === 'paid') {
    return NextResponse.json({ ok: true, alreadyPaid: true, request: existing })
  }
  if (!existing.quotedAmount || existing.quotedAmount <= 0) {
    return NextResponse.json({ error: 'No quoted amount' }, { status: 400 })
  }

  const updated = markRequestPaid(parsed.data.requestId)
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Keep in-memory store consistent across isolate reads
  upsertRequest(updated)

  return NextResponse.json({ ok: true, request: updated })
}
