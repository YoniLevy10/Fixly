/**
 * Marketing-ready / pilot smoke checks.
 *
 * Local (no deploy):
 *   npm run smoke:pilot
 *
 * Against a live URL (after ops deploy):
 *   PILOT_BASE_URL=https://your-domain.com npm run smoke:pilot
 */

import assert from 'node:assert/strict'
import { verifyTranzilaWebhookSecret } from '../lib/tranzila/verify-webhook'
import { isDemoDataMode } from '../lib/data/demo-mode'

function section(title: string) {
  console.log(`\n=== ${title} ===`)
}

async function checkHealth(baseUrl: string) {
  section(`Health @ ${baseUrl}`)
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/health?verbose=1`)
  assert.ok(res.ok, `health HTTP ${res.status}`)
  const json = (await res.json()) as {
    status: string
    mode?: string
    demoMode?: boolean
    checks?: Record<string, { ok: boolean; detail?: string }>
  }
  console.log('status:', json.status)
  console.log('mode:', json.mode)
  console.log('demoMode:', json.demoMode)

  assert.equal(json.demoMode, true, 'demoMode must be true (pre-funding showcase)')
  assert.ok(
    json.status === 'ok' || json.status === 'degraded',
    `unexpected health status: ${json.status}`,
  )
  if (json.mode) {
    assert.equal(json.mode, 'mock', 'mode must be mock while demo is on')
  }

  for (const key of ['env', 'demo_mode', 'supabase'] as const) {
    const check = json.checks?.[key]
    if (check) {
      assert.ok(check.ok, `check ${key} failed: ${check.detail ?? ''}`)
      console.log(`check.${key}: ok`)
    }
  }

  const pro = json.checks?.professionals
  if (pro) {
    console.log('professionals:', pro.detail)
    const count = Number(String(pro.detail ?? '').split(' ')[0])
    if (Number.isFinite(count) && count < 20) {
      console.warn(
        `WARN: only ${count} professionals — marketing gate wants ≥20 in pilot city`,
      )
    }
  }
}

function checkWebhookVerify() {
  section('Tranzila webhook verify')
  const prev = process.env.TRANZILA_WEBHOOK_SECRET
  process.env.TRANZILA_WEBHOOK_SECRET = 'pilot-smoke-secret'

  const okReq = new Request(
    'https://example.com/api/tranzila/webhook?secret=pilot-smoke-secret',
    { method: 'POST' },
  )
  assert.equal(verifyTranzilaWebhookSecret(okReq, {}).ok, true, 'query secret should pass')

  const badReq = new Request('https://example.com/api/tranzila/webhook', {
    method: 'POST',
    headers: { 'x-tranzila-secret': 'wrong' },
  })
  assert.equal(verifyTranzilaWebhookSecret(badReq, {}).ok, false, 'wrong secret should fail')

  const bearerReq = new Request('https://example.com/api/tranzila/webhook', {
    method: 'POST',
    headers: { Authorization: 'Bearer pilot-smoke-secret' },
  })
  assert.equal(verifyTranzilaWebhookSecret(bearerReq, {}).ok, true, 'bearer should pass')

  delete process.env.TRANZILA_WEBHOOK_SECRET
  const openReq = new Request('https://example.com/api/tranzila/webhook', { method: 'POST' })
  assert.equal(
    verifyTranzilaWebhookSecret(openReq, {}).ok,
    true,
    'unset secret soft-allows (warn in route)',
  )

  if (prev !== undefined) process.env.TRANZILA_WEBHOOK_SECRET = prev
  console.log('webhook verify: ok')
}

function checkDemoFlagParsing() {
  section('Demo flag parsing')
  const prev = process.env.NEXT_PUBLIC_FF_DEMO_KILL

  delete process.env.NEXT_PUBLIC_FF_DEMO_KILL
  assert.equal(isDemoDataMode(), true)

  process.env.NEXT_PUBLIC_FF_DEMO_KILL = 'true'
  assert.equal(isDemoDataMode(), false)

  process.env.NEXT_PUBLIC_FF_DEMO_KILL = '1'
  assert.equal(isDemoDataMode(), false)

  process.env.NEXT_PUBLIC_FF_DEMO_KILL = 'false'
  assert.equal(isDemoDataMode(), true)

  if (prev !== undefined) process.env.NEXT_PUBLIC_FF_DEMO_KILL = prev
  else delete process.env.NEXT_PUBLIC_FF_DEMO_KILL
  console.log('demo flag parsing: ok')
  console.log(
    'note: demo defaults ON; kill with NEXT_PUBLIC_FF_DEMO_KILL=true after funding',
  )
}

async function main() {
  console.log('Fixly pilot / marketing-ready smoke')
  checkDemoFlagParsing()
  checkWebhookVerify()

  const base = process.env.PILOT_BASE_URL?.trim()
  if (base) {
    await checkHealth(base)
  } else {
    section('Live health')
    console.log('skipped — set PILOT_BASE_URL=https://your-domain.com to verify deploy')
  }

  console.log('\nPASS: smoke:pilot')
}

main().catch((err) => {
  console.error('FAIL:', err)
  process.exit(1)
})
