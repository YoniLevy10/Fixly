import { NextResponse } from 'next/server'

/**
 * Grow (Meshulam) payment webhook — stub until monetization is enabled.
 *
 * Bino pattern: notifyUrl includes ?token={GROW_WEBHOOK_SECRET}.
 * Activate with NEXT_PUBLIC_FF_MONETIZATION=true + Grow platform keys.
 */
export async function POST(request: Request) {
  const url = new URL(request.url)
  const token =
    url.searchParams.get('token') ||
    request.headers.get('x-grow-token') ||
    ''
  const secret = process.env.GROW_WEBHOOK_SECRET?.trim()

  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'Grow payments not configured' },
      { status: 503 },
    )
  }

  if (token !== secret) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  if (process.env.NEXT_PUBLIC_FF_MONETIZATION !== 'true') {
    return NextResponse.json({
      ok: true,
      ignored: true,
      reason: 'monetization deferred',
    })
  }

  // Future: parse Grow payload, mark job/subscription paid, approveTransaction.
  const body = await request.json().catch(() => null)
  console.info('[grow-webhook] received', {
    hasBody: Boolean(body),
    statusCode: (body as { statusCode?: number } | null)?.statusCode,
  })

  return NextResponse.json({ ok: true, received: true })
}
