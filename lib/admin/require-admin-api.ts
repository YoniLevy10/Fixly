import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { isAdminUser, getAdminEmails } from '@/lib/admin/is-admin'
import {
  hasValidAdminGateCookie,
  isAdminPagePasswordConfigured,
} from '@/lib/admin/page-gate'

type AdminClient = NonNullable<ReturnType<typeof getAdminSupabaseClient>>

export type AdminAccess =
  | {
      ok: true
      user: User | null
      admin: AdminClient
      via: 'email' | 'password'
    }
  | { ok: false; response: NextResponse }

/**
 * Admin APIs accept either:
 * 1) Supabase user on ADMIN_EMAILS / app_metadata.role=admin
 * 2) Valid ADMIN_PAGE_PASSWORD gate cookie
 */
export async function requireAdminAccess(): Promise<AdminAccess> {
  const admin = getAdminSupabaseClient()

  if (await hasValidAdminGateCookie()) {
    if (!admin) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Admin client unavailable' },
          { status: 503 }
        ),
      }
    }
    return { ok: true, user: null, admin, via: 'password' }
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: isAdminPagePasswordConfigured()
            ? 'נדרשת סיסמת מנהל או התחברות'
            : 'Auth unavailable',
          code: 'not_authenticated',
          passwordConfigured: isAdminPagePasswordConfigured(),
        },
        { status: 401 }
      ),
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
          error: isAdminPagePasswordConfigured()
            ? 'הזינו סיסמת מנהל או התחברו עם חשבון אדמין'
            : 'לא מחובר — התחבר עם Google ואז חזור ל־Admin',
          code: 'not_authenticated',
          passwordConfigured: isAdminPagePasswordConfigured(),
        },
        { status: 401 }
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
            ? `אין הרשאת מנהל ל־${email ?? 'המשתמש הזה'}. הוסף את המייל ל־ADMIN_EMAILS או הזן סיסמת מנהל.`
            : 'ADMIN_EMAILS לא מוגדר — הגדירו סיסמת מנהל (ADMIN_PAGE_PASSWORD) או רשימת מיילים.',
          code: 'not_admin',
          email,
          passwordConfigured: isAdminPagePasswordConfigured(),
        },
        { status: 403 }
      ),
    }
  }

  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Admin client unavailable' },
        { status: 503 }
      ),
    }
  }

  return { ok: true, user, admin, via: 'email' }
}

/** Prospect admin routes — password gate also allowed. */
export async function requireAdminApi(): Promise<
  | { ok: true; user: User; admin: AdminClient }
  | { ok: false; response: NextResponse }
> {
  const access = await requireAdminAccess()
  if (!access.ok) return access
  if (!access.user) {
    return {
      ok: true,
      user: {
        id: 'password-gate',
        email: 'admin@fixly.local',
        app_metadata: { role: 'admin' },
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User,
      admin: access.admin,
    }
  }
  return { ok: true, user: access.user, admin: access.admin }
}
