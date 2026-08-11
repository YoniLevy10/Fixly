import { NextResponse } from 'next/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { handleTranzilaWebhookEvent } from '@/lib/tranzila/webhook-handlers'

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

  await handleTranzilaWebhookEvent(supabase, body)
  return NextResponse.json({ success: true })
}
