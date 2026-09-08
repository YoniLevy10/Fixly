import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/admin/is-admin'
import { trackError } from '@/lib/monitoring/track-error'
import { parseJsonBody } from '@/lib/api/parse-body'
import { z } from 'zod'
import {
  listLaunchRegions,
  upsertLaunchRegion,
} from '@/lib/regions/consumer-access'

const patchSchema = z.object({
  city: z.string().trim().min(1).max(100),
  status: z.enum(['closed', 'waitlist', 'open']),
  minPros: z.number().int().min(1).max(500).optional(),
  minCompletedJobs30d: z.number().int().min(0).max(5000).optional(),
  notes: z.string().trim().max(500).optional().nullable(),
})

export async function GET() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Auth' }, { status: 401 })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const regions = await listLaunchRegions()
  return NextResponse.json({ regions })
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Auth' }, { status: 401 })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const parsed = await parseJsonBody(request, patchSchema)
  if (!parsed.success) return parsed.response

  try {
    const result = await upsertLaunchRegion(parsed.data)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({ ok: true, ...parsed.data })
  } catch (error) {
    trackError(error, { route: 'PATCH admin launch-regions' })
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
