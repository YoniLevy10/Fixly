import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'

/** Parse FIXLY_API_KEYS (comma-separated) or single FIXLY_API_KEY */
export function getConfiguredApiKeys(): string[] {
  const multi = process.env.FIXLY_API_KEYS?.trim()
  const single = process.env.FIXLY_API_KEY?.trim()
  const raw = multi || single || ''
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
}

export function extractApiKey(request: Request): string | null {
  const headerKey = request.headers.get('x-fixly-key')?.trim()
  if (headerKey) return headerKey

  const auth = request.headers.get('authorization')?.trim()
  if (auth?.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim() || null
  }
  return null
}

function safeKeyCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  try {
    return timingSafeEqual(aBuf, bBuf)
  } catch {
    return false
  }
}

export function assertApiKey(request: Request):
  | { ok: true; key: string; bamakorClientId: string | null }
  | { ok: false; response: NextResponse } {
  const keys = getConfiguredApiKeys()
  const provided = extractApiKey(request)

  if (keys.length === 0) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'FIXLY_API_KEYS not configured' },
        { status: 503 },
      ),
    }
  }

  if (!provided || !keys.some((k) => safeKeyCompare(k, provided))) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return {
    ok: true,
    key: provided,
    bamakorClientId: request.headers.get('x-bamakor-client-id'),
  }
}
