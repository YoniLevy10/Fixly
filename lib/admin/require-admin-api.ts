import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { isAdminUser, getAdminEmails } from '@/lib/admin/is-admin'

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

  if (!user || user.is_anonymous) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'לא מחובר — התחבר עם Google ואז חזור ל־Superadmin',
          code: 'not_authenticated',
        },
        { status: 401 },
      ),
    }
  }

  if (!isAdminUser(user)) {
    const email = user.email?.trim().toLowerCase() ?? null
    const configured = getAdminEmails().length > 0
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: configured
            ? `אין הרשאת מנהל ל־${email ?? 'המשתמש הזה'}. הוסף את המייל ל־ADMIN_EMAILS ב־Vercel ו־Redeploy.`
            : 'ADMIN_EMAILS לא מוגדר ב־Vercel.',
          code: 'not_admin',
          email,
        },
        { status: 403 },
      ),
    }
  }

  const admin = getAdminSupabaseClient()
  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Admin client unavailable' }, { status: 503 }),
    }
  }

  return { ok: true, user, admin }
}
