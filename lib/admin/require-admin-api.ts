import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { isAdminUser } from '@/lib/admin/is-admin'

export async function requireAdminApi(): Promise<
  | { ok: true; user: User; admin: NonNullable<ReturnType<typeof getAdminSupabaseClient>> }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Auth unavailable' }, { status: 503 }),
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!isAdminUser(user)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }),
    }
  }

  const admin = getAdminSupabaseClient()
  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Admin client unavailable' }, { status: 503 }),
    }
  }

  return { ok: true, user: user!, admin }
}
