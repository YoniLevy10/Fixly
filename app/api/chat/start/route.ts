import { NextResponse } from 'next/server'
import { z } from 'zod'
import { parseJsonBody } from '@/lib/api/parse-body'
import { createRequest } from '@/lib/data/request-store'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { getProfessionalById } from '@/mock/professionals'
import { trackError } from '@/lib/monitoring/track-error'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const startSchema = z.object({
  professionalId: z.string().trim().min(1).max(64),
})

/**
 * Start (or resume) a chat thread with a professional by ensuring a
 * lightweight request exists, then return its id for /messages.
 */
export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, startSchema)
  if (!parsed.success) return parsed.response

  const { professionalId } = parsed.data

  try {
    if (isDemoDataMode()) {
      const pro = getProfessionalById(professionalId)
      if (!pro) {
        return NextResponse.json({ error: 'Professional not found' }, { status: 404 })
      }
      const created = createRequest({
        description: `שיחה עם ${pro.name}`,
        title: `שיחה · ${pro.category}`,
        professionalId: pro.id,
        professionalName: pro.name,
        customerId: 'demo-customer',
        customerName: 'לקוח דמו',
        category: pro.category,
        location: pro.location ?? 'ירושלים',
      })
      return NextResponse.json({
        requestId: created.id,
        professional: {
          id: pro.id,
          name: pro.name,
          title: pro.title ?? pro.category,
          avatarUrl: pro.avatarUrl ?? null,
        },
        demo: true,
      })
    }

    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Unavailable' }, { status: 503 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 })
    }

    const { data: existing } = await supabase
      .from('requests')
      .select('id, professional_id')
      .eq('customer_id', user.id)
      .eq('professional_id', professionalId)
      .in('status', ['pending', 'accepted', 'on_the_way', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const loadPro = async () => {
      const { data: pro } = await supabase
        .from('professionals')
        .select('id, title, users(full_name)')
        .eq('id', professionalId)
        .maybeSingle()
      const userRel = pro?.users as
        | { full_name?: string }
        | { full_name?: string }[]
        | null
      const name = Array.isArray(userRel)
        ? userRel[0]?.full_name
        : userRel?.full_name
      return {
        id: professionalId,
        name: name || 'איש מקצוע',
        title: (pro?.title as string | null) ?? null,
        avatarUrl: null as string | null,
      }
    }

    if (existing?.id) {
      return NextResponse.json({
        requestId: existing.id,
        professional: await loadPro(),
        demo: false,
      })
    }

    const { data: inserted, error } = await supabase
      .from('requests')
      .insert({
        customer_id: user.id,
        professional_id: professionalId,
        title: 'שיחה',
        description: 'פתיחת שיחה עם איש מקצוע',
        status: 'pending',
        location: '',
      })
      .select('id')
      .single()

    if (error || !inserted) {
      trackError(error, { route: 'POST /api/chat/start' })
      return NextResponse.json(
        { error: error?.message ?? 'Failed to start chat' },
        { status: 400 },
      )
    }

    return NextResponse.json({
      requestId: inserted.id,
      professional: await loadPro(),
      demo: false,
    })
  } catch (error) {
    trackError(error, { route: 'POST /api/chat/start' })
    return NextResponse.json({ error: 'Failed to start chat' }, { status: 500 })
  }
}
