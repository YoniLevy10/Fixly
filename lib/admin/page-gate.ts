import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

export const ADMIN_GATE_COOKIE = 'fixly_admin_gate'
const GATE_TTL_MS = 1000 * 60 * 60 * 12 // 12 hours

function gateSecret(): string | null {
  const password = process.env.ADMIN_PAGE_PASSWORD?.trim()
  if (!password) return null
  const extra = process.env.ADMIN_SESSION_SECRET?.trim() ?? ''
  return `${password}::${extra || 'fixly-admin-gate'}`
}

export function isAdminPagePasswordConfigured(): boolean {
  return Boolean(process.env.ADMIN_PAGE_PASSWORD?.trim())
}

export function verifyAdminPagePassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PAGE_PASSWORD?.trim()
  if (!expected || !candidate) return false
  const a = Buffer.from(candidate)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function createAdminGateToken(now = Date.now()): string | null {
  const secret = gateSecret()
  if (!secret) return null
  const exp = String(now + GATE_TTL_MS)
  const sig = createHmac('sha256', secret).update(exp).digest('base64url')
  return `${exp}.${sig}`
}

export function isValidAdminGateToken(
  token: string | undefined | null,
  now = Date.now()
): boolean {
  const secret = gateSecret()
  if (!secret || !token) return false
  const [exp, sig] = token.split('.')
  if (!exp || !sig) return false
  const expMs = Number(exp)
  if (!Number.isFinite(expMs) || expMs < now) return false
  const expected = createHmac('sha256', secret).update(exp).digest('base64url')
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function hasValidAdminGateCookie(): Promise<boolean> {
  if (!isAdminPagePasswordConfigured()) return false
  const jar = await cookies()
  return isValidAdminGateToken(jar.get(ADMIN_GATE_COOKIE)?.value)
}

export function adminGateCookieOptions(token: string) {
  return {
    name: ADMIN_GATE_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(GATE_TTL_MS / 1000),
  }
}
