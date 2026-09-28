import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { trackError } from '@/lib/monitoring/track-error'
import { parseJsonBody } from '@/lib/api/parse-body'
import { z } from 'zod'

const messageSchema = z
  .object({
    body: z.string().max(2000).optional().default(''),
    imageUrl: z.string().max(2000).optional(),
  })
  .superRefine((val, ctx) => {
    const body = val.body.trim()
    const imageUrl = val.imageUrl?.trim()
    if (!body && !imageUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'נדרשת הודעה או תמונה',
        path: ['body'],
      })
    }
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'כתובת תמונה לא תקינה',
        path: ['imageUrl'],
      })
    }
  })

type RouteContext = { params: Promise<{ id: string }> }

function mapMessage(m: {
  id: string
  body: string
  sender_role: string
  created_at: string
  image_url?: string | null
}) {
  return {
    id: m.id,
    body: m.body,
    senderRole: m.sender_role as 'customer' | 'professional',
    createdAt: m.created_at,
    imageUrl: m.image_url ?? null,
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createServerSupabaseClient()
  if (!supabase) return NextResponse.json([], { status: 503 })

  const { data, error } = await supabase
    .from('messages')
    .select('id, body, sender_role, created_at, image_url')
    .eq('request_id', id)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    // Fallback if migration not applied yet
    const legacy = await supabase
      .from('messages')
      .select('id, body, sender_role, created_at')
      .eq('request_id', id)
      .order('created_at', { ascending: true })
      .limit(100)

    if (legacy.error) {
      trackError(error, { route: 'GET messages' })
      return NextResponse.json([])
    }

    return NextResponse.json((legacy.data ?? []).map((m) => mapMessage({ ...m, image_url: null })))
  }

  return NextResponse.json((data ?? []).map(mapMessage))
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
    .select('customer_id, professional_id, status')
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

  const chatOpen = ['accepted', 'on_the_way', 'in_progress', 'completed'].includes(
    req.status ?? '',
  )
  if (!chatOpen) {
    return NextResponse.json(
      { error: 'הצ׳אט נפתח אחרי שאיש המקצוע מאשר' },
      { status: 409 },
    )
  }

  const body = (parsed.data.body ?? '').trim()
  const imageUrl = parsed.data.imageUrl?.trim() || undefined

  const insertPayload: {
    request_id: string
    sender_id: string
    sender_role: string
    body: string
    image_url?: string
  } = {
    request_id: id,
    sender_id: user.id,
    sender_role: role,
    body: body || (imageUrl ? '📷' : ''),
  }
  if (imageUrl) insertPayload.image_url = imageUrl

  const { data, error } = await supabase
    .from('messages')
    .insert(insertPayload)
    .select('id, body, sender_role, created_at, image_url')
    .single()

  if (error) {
    // Retry without image_url if column missing
    if (imageUrl && /image_url/i.test(error.message)) {
      const retry = await supabase
        .from('messages')
        .insert({
          request_id: id,
          sender_id: user.id,
          sender_role: role,
          body: body || '📷 תמונה',
        })
        .select('id, body, sender_role, created_at')
        .single()

      if (retry.error) {
        trackError(retry.error, { route: 'POST messages fallback' })
        return NextResponse.json({ error: 'Send failed' }, { status: 500 })
      }

      return NextResponse.json(mapMessage({ ...retry.data, image_url: imageUrl }), {
        status: 201,
      })
    }

    trackError(error, { route: 'POST messages' })
    return NextResponse.json({ error: 'Send failed' }, { status: 500 })
  }

  return NextResponse.json(mapMessage(data), { status: 201 })
}
