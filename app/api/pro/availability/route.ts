import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { parseJsonBody } from '@/lib/api/parse-body'
import { trackError } from '@/lib/monitoring/track-error'

const ruleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}/),
  endTime: z.string().regex(/^\d{2}:\d{2}/),
})

const putSchema = z.object({
  rules: z.array(ruleSchema).max(7),
  summary: z.string().max(200).optional(),
})

async function getProId(userId: string): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null
  const { data } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.id ?? null
}

export async function GET() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return NextResponse.json({ rules: [] })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

  const proId = await getProId(user.id)
  if (!proId) return NextResponse.json({ rules: [] })

  const { data: rules } = await supabase
    .from('pro_availability_rules')
    .select('day_of_week, start_time, end_time')
    .eq('professional_id', proId)

  const { data: pro } = await supabase
    .from('professionals')
    .select('availability_summary')
    .eq('id', proId)
    .maybeSingle()

  return NextResponse.json({
    rules: (rules ?? []).map((r) => ({
      dayOfWeek: r.day_of_week,
      startTime: String(r.start_time).slice(0, 5),
      endTime: String(r.end_time).slice(0, 5),
    })),
    summary: pro?.availability_summary ?? '',
  })
}

export async function PUT(request: Request) {
  const parsed = await parseJsonBody(request, putSchema)
  if (!parsed.success) return parsed.response

  const supabase = await createServerSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

  const proId = await getProId(user.id)
  if (!proId) return NextResponse.json({ error: 'Not a pro' }, { status: 403 })

  try {
    await supabase.from('pro_availability_rules').delete().eq('professional_id', proId)

    if (parsed.data.rules.length) {
      await supabase.from('pro_availability_rules').insert(
        parsed.data.rules.map((r) => ({
          professional_id: proId,
          day_of_week: r.dayOfWeek,
          start_time: r.startTime,
          end_time: r.endTime,
        })),
      )
    }

    await supabase
      .from('professionals')
      .update({ availability_summary: parsed.data.summary ?? null })
      .eq('id', proId)

    return NextResponse.json({ ok: true })
  } catch (error) {
    trackError(error, { route: 'PUT availability' })
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return PUT(request)
}
