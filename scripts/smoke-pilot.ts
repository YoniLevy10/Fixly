/**
 * Marketing-ready / production smoke checks.
 *
 * Local (no deploy):
 *   npm run smoke:pilot
 *
 * Against a live URL (after ops deploy):
 *   PILOT_BASE_URL=https://fixly.tech npm run smoke:pilot
 */

import assert from 'node:assert/strict'
import { isDemoDataMode } from '../lib/data/demo-mode'
import { isNationwideConsumerOpen } from '../lib/regions/nationwide'
import { isGrowPlatformConfigured } from '../lib/grow/config'

function section(title: string) {
  console.log(`\n=== ${title} ===`)
}

function checkDemoFlagParsing() {
  section('Demo flag parsing')
  const prevData = process.env.NEXT_PUBLIC_FF_DEMO_DATA
  const prevKill = process.env.NEXT_PUBLIC_FF_DEMO_KILL

  delete process.env.NEXT_PUBLIC_FF_DEMO_DATA
  delete process.env.NEXT_PUBLIC_FF_DEMO_KILL
  assert.equal(isDemoDataMode(), false, 'demo defaults OFF')

  process.env.NEXT_PUBLIC_FF_DEMO_DATA = 'true'
  assert.equal(isDemoDataMode(), true)

  process.env.NEXT_PUBLIC_FF_DEMO_KILL = 'true'
  assert.equal(isDemoDataMode(), false, 'kill forces OFF')

  process.env.NEXT_PUBLIC_FF_DEMO_KILL = 'false'
  process.env.NEXT_PUBLIC_FF_DEMO_DATA = '1'
  assert.equal(isDemoDataMode(), true)

  if (prevData !== undefined) process.env.NEXT_PUBLIC_FF_DEMO_DATA = prevData
  else delete process.env.NEXT_PUBLIC_FF_DEMO_DATA
  if (prevKill !== undefined) process.env.NEXT_PUBLIC_FF_DEMO_KILL = prevKill
  else delete process.env.NEXT_PUBLIC_FF_DEMO_KILL
  console.log('demo flag parsing: ok')
  console.log('note: demo defaults OFF; opt-in with NEXT_PUBLIC_FF_DEMO_DATA=true')
}

function checkNationwideFlag() {
  section('Nationwide flag')
  const prev = process.env.NEXT_PUBLIC_FF_NATIONWIDE
  delete process.env.NEXT_PUBLIC_FF_NATIONWIDE
  delete process.env.FIXLY_NATIONWIDE
  assert.equal(isNationwideConsumerOpen(), false)
  process.env.NEXT_PUBLIC_FF_NATIONWIDE = 'true'
  assert.equal(isNationwideConsumerOpen(), true)
  if (prev !== undefined) process.env.NEXT_PUBLIC_FF_NATIONWIDE = prev
  else delete process.env.NEXT_PUBLIC_FF_NATIONWIDE
  console.log('nationwide flag: ok')
}

function checkGrowDeferred() {
  section('Grow payments deferred')
  assert.equal(isGrowPlatformConfigured(), false, 'Grow unset by default')
  console.log('grow deferred: ok (configure later)')
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

  assert.equal(json.demoMode, false, 'demoMode must be false in production')
  assert.ok(
    json.status === 'ok' || json.status === 'degraded',
    `unexpected health status: ${json.status}`,
  )
  if (json.mode) {
    assert.equal(json.mode, 'supabase', 'mode must be supabase in production')
  }

  for (const key of ['env', 'demo_mode', 'supabase'] as const) {
    const check = json.checks?.[key]
    if (check) {
      assert.ok(check.ok, `check ${key} failed: ${check.detail ?? ''}`)
      console.log(`check.${key}: ok`)
    }
  }

  const nationwide = json.checks?.nationwide
  if (nationwide) {
    console.log('nationwide:', nationwide.detail)
  }

  const pro = json.checks?.professionals
  if (pro) {
    console.log('professionals:', pro.detail)
    const count = Number(String(pro.detail ?? '').split(' ')[0])
    if (Number.isFinite(count) && count < 5) {
      console.warn(
        `WARN: only ${count} professionals — recruit supply before heavy ads`,
      )
    }
  }
}

async function main() {
  console.log('Fixly production smoke')
  checkDemoFlagParsing()
  checkNationwideFlag()
  checkGrowDeferred()

  const base = process.env.PILOT_BASE_URL?.trim()
  if (base) {
    await checkHealth(base)
  } else {
    section('Live health')
    console.log('skipped — set PILOT_BASE_URL=https://fixly.tech to verify deploy')
  }

  console.log('\nPASS: smoke:pilot')
}

main().catch((err) => {
  console.error('FAIL:', err)
  process.exit(1)
})
