import { NextResponse } from 'next/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { handleTranzilaWebhookEvent } from '@/lib/tranzila/webhook-handlers'
import {
  isTranzilaWebhookSecretConfigured,
  verifyTranzilaWebhookSecret,
} from '@/lib/tranzila/verify-webhook'

export async function POST(request: Request) {
  const supabase = getAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    const text = await request.text()
    body = Object.fromEntries(new URLSearchParams(text))
  }

  const verified = verifyTranzilaWebhookSecret(request, body)
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 401 })
  }

  if (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PUBLIC_FF_MONETIZATION !== 'false' &&
    !isTranzilaWebhookSecretConfigured()
  ) {
    console.warn(
      '[tranzila] TRANZILA_WEBHOOK_SECRET unset — notification endpoint is unauthenticated',
    )
  }

  await handleTranzilaWebhookEvent(supabase, body)
  return NextResponse.json({ success: true })
}
