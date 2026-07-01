import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { trackError } from '@/lib/monitoring/track-error'
import { parseJsonBody } from '@/lib/api/parse-body'
import { z } from 'zod'

const messageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createServerSupabaseClient()
  if (!supabase) return NextResponse.json([], { status: 503 })

  const { data, error } = await supabase
    .from('messages')
    .select('id, body, sender_role, created_at')
    .eq('request_id', id)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    trackError(error, { route: 'GET messages' })
    return NextResponse.json([])
  }

  return NextResponse.json(
    (data ?? []).map((m) => ({
      id: m.id,
      body: m.body,
      senderRole: m.sender_role,
      createdAt: m.created_at,
    })),
  )
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  const parsed = await parseJsonBody(request, messageSchema)
  if (!parsed.success) return parsed.response

  const supabase = await createServerSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

  const { data: pro } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: req } = await supabase
    .from('requests')
    .select('customer_id, professional_id')
    .eq('id', id)
    .maybeSingle()

  if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let role: 'customer' | 'professional' = 'customer'
  if (req.customer_id === user.id) {
    role = 'customer'
  } else if (pro && req.professional_id === pro.id) {
    role = 'professional'
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      request_id: id,
      sender_id: user.id,
      sender_role: role,
      body: parsed.data.body,
    })
    .select('id, body, sender_role, created_at')
    .single()

  if (error) {
    trackError(error, { route: 'POST messages' })
    return NextResponse.json({ error: 'Send failed' }, { status: 500 })
  }

  return NextResponse.json(
    {
      id: data.id,
      body: data.body,
      senderRole: data.sender_role,
      createdAt: data.created_at,
    },
    { status: 201 },
  )
}
