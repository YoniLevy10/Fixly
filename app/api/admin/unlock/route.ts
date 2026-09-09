import { NextResponse } from 'next/server'
import {
  ADMIN_GATE_COOKIE,
  adminGateCookieOptions,
  createAdminGateToken,
  hasValidAdminGateCookie,
  isAdminPagePasswordConfigured,
  verifyAdminPagePassword,
} from '@/lib/admin/page-gate'

export async function GET() {
  return NextResponse.json({
    unlocked: await hasValidAdminGateCookie(),
    passwordConfigured: isAdminPagePasswordConfigured(),
  })
}

export async function POST(request: Request) {
  if (!isAdminPagePasswordConfigured()) {
    return NextResponse.json(
      {
        error:
          'סיסמת מנהל עדיין לא הוגדרה. הוסיפו ADMIN_PAGE_PASSWORD ב־Vercel ואז Redeploy.',
        code: 'password_not_configured',
      },
      { status: 503 }
    )
  }

  let body: { password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 })
  }

  if (!verifyAdminPagePassword(body.password ?? '')) {
    return NextResponse.json({ error: 'סיסמה שגויה' }, { status: 401 })
  }

  const token = createAdminGateToken()
  if (!token) {
    return NextResponse.json({ error: 'שגיאת הגדרות' }, { status: 503 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(adminGateCookieOptions(token))
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: ADMIN_GATE_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return response
}
