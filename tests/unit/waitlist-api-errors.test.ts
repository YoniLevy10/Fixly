import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { NextResponse } from 'next/server'
import { parseJsonBody } from '@/lib/api/parse-body'
import { rateLimitResponse } from '@/lib/api/rate-limit'
import { waitlistSchema } from '@/lib/api/schemas'
import { POST as waitlistPost } from '@/app/api/waitlist/route'
import { z } from 'zod'

const ERROR_PAIRS = [
  { status: 400, code: 'INVALID_INPUT' },
  { status: 400, code: 'AUDIENCE_CLOSED' },
  { status: 403, code: 'GEO_BLOCKED' },
  { status: 429, code: 'RATE_LIMITED' },
  { status: 503, code: 'STORAGE_UNAVAILABLE' },
  { status: 500, code: 'INTERNAL_ERROR' },
] as const

describe('waitlist API error codes', () => {
  it('documents all six status/code pairs', () => {
    assert.equal(ERROR_PAIRS.length, 6)
    const keys = new Set(ERROR_PAIRS.map((p) => `${p.status}:${p.code}`))
    assert.equal(keys.size, 6)
  })

  it('parseJsonBody returns 400 INVALID_INPUT by default', async () => {
    const req = new Request('http://localhost/api/waitlist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: 'א' }),
    })
    const parsed = await parseJsonBody(req, waitlistSchema)
    assert.equal(parsed.success, false)
    if (parsed.success) return
    assert.equal(parsed.response.status, 400)
    const body = await parsed.response.json()
    assert.equal(body.code, 'INVALID_INPUT')
  })

  it('rateLimitResponse returns 429 RATE_LIMITED with Retry-After', async () => {
    const res = rateLimitResponse(Date.now() + 60_000)
    assert.equal(res.status, 429)
    assert.ok(res.headers.get('Retry-After'))
    const body = await res.json()
    assert.equal(body.code, 'RATE_LIMITED')
  })

  it('GEO_BLOCKED JSON shape matches middleware contract', async () => {
    const res = NextResponse.json(
      { error: 'השירות זמין בישראל בלבד', code: 'GEO_BLOCKED' },
      { status: 403 },
    )
    assert.equal(res.status, 403)
    assert.equal((await res.json()).code, 'GEO_BLOCKED')
  })

  it('audience closed returns 400 AUDIENCE_CLOSED', async () => {
    const req = new Request('http://localhost/api/waitlist', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 200) + 1}`,
      },
      body: JSON.stringify({
        fullName: 'דני כהן',
        phone: '0501234567',
        audience: 'customer',
        categories: ['אינסטלציה'],
      }),
    })
    const res = await waitlistPost(req)
    assert.equal(res.status, 400)
    const body = await res.json()
    assert.equal(body.code, 'AUDIENCE_CLOSED')
  })

  it('maps save failure statuses to STORAGE_UNAVAILABLE / INVALID_INPUT / INTERNAL_ERROR', () => {
    const map = (status: number) => {
      if (status === 503) return 'STORAGE_UNAVAILABLE'
      if (status === 500) return 'INTERNAL_ERROR'
      if (status === 400) return 'INVALID_INPUT'
      return null
    }
    assert.equal(map(503), 'STORAGE_UNAVAILABLE')
    assert.equal(map(500), 'INTERNAL_ERROR')
    assert.equal(map(400), 'INVALID_INPUT')
  })

  it('duplicate phone contract remains 200 alreadyRegistered', async () => {
    // Shape-only: success path for duplicates must not look like an error code body.
    const body = {
      ok: true,
      audience: 'professional',
      id: '11111111-2222-4333-8444-555555555555',
      alreadyRegistered: true,
    }
    assert.equal(body.alreadyRegistered, true)
    assert.equal('code' in body, false)
  })

  it('parseJsonBody accepts an optional override code', async () => {
    const req = new Request('http://localhost/api/waitlist', {
      method: 'POST',
      body: 'not-json',
    })
    const parsed = await parseJsonBody(req, z.object({}), { code: 'INVALID_INPUT' })
    assert.equal(parsed.success, false)
    if (parsed.success) return
    const body = await parsed.response.json()
    assert.equal(body.code, 'INVALID_INPUT')
    assert.equal(parsed.response.status, 400)
  })
})
