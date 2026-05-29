import { NextResponse } from 'next/server'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const HAS_UPSTASH = !!(UPSTASH_URL && UPSTASH_TOKEN)

if (!HAS_UPSTASH && process.env.NODE_ENV === 'production') {
  console.warn(
    '[rate-limit] Using in-memory store. Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN ' +
      'so limits survive serverless cold starts.',
  )
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export function checkMemoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  let bucket = buckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 1, resetAt: now + windowMs }
    buckets.set(key, bucket)
    return { limited: false, remaining: Math.max(limit - 1, 0), resetAt: bucket.resetAt }
  }

  bucket.count += 1
  return {
    limited: bucket.count > limit,
    remaining: Math.max(limit - bucket.count, 0),
    resetAt: bucket.resetAt,
  }
}

export async function checkUpstashRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ limited: boolean; remaining: number; resetAt: number }> {
  if (!HAS_UPSTASH) {
    return checkMemoryRateLimit(key, limit, windowSeconds * 1000)
  }

  const fullKey = `fixly:rl:${key}`
  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', fullKey],
      ['EXPIRE', fullKey, String(windowSeconds), 'NX'],
      ['PTTL', fullKey],
    ]),
  }).catch(() => null)

  if (!res?.ok) {
    return checkMemoryRateLimit(key, limit, windowSeconds * 1000)
  }

  const body = (await res.json()) as Array<{ result: number | string }>
  const count = Number(body?.[0]?.result ?? 1)
  const pttl = Number(body?.[2]?.result ?? windowSeconds * 1000)

  return {
    limited: count > limit,
    remaining: Math.max(limit - count, 0),
    resetAt: Date.now() + Math.max(0, pttl),
  }
}

/** Preferred rate limit — Upstash when configured, else in-memory. */
export async function checkRateLimit(key: string, limit = 30, windowMs = 60_000) {
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000))
  return checkUpstashRateLimit(key, limit, windowSeconds)
}

export function rateLimitResponse(resetAt: number, message = 'יותר מדי בקשות — נסה שוב בעוד רגע') {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))),
      },
    },
  )
}

/**
 * Returns a 429 response when limited, otherwise null (caller may proceed).
 */
export async function enforceRateLimit(
  request: Request,
  routeKey: string,
  limit = 30,
  windowMs = 60_000,
): Promise<NextResponse | null> {
  const ip = getClientIp(request)
  const result = await checkRateLimit(`${routeKey}:${ip}`, limit, windowMs)
  if (result.limited) {
    return rateLimitResponse(result.resetAt)
  }
  return null
}

/** @deprecated Use `enforceRateLimit` (async, Upstash-aware). */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterSec?: number } {
  const result = checkMemoryRateLimit(key, limit, windowMs)
  if (result.limited) {
    const retryAfterSec = Math.ceil((result.resetAt - Date.now()) / 1000)
    return { ok: false, retryAfterSec }
  }
  return { ok: true }
}
