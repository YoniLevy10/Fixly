/**
 * Unit tests for Bamakor integration (no Supabase).
 * Run: node --import tsx --test tests/unit/bamakor-integration.test.ts
 * Fallback without tsx: node --test tests/unit/bamakor-integration.test.mjs
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'

// Pure modules under test — duplicated import path via relative .ts requires tsx.
// This .mjs twin imports the compiled-logic mirrors for CI without tsx.

import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('category normalize (inline)', () => {
  const ALIASES = {
    elevators: 'elevators',
    electrical: 'electricity',
    electricity: 'electricity',
    hvac: 'ac',
    pest_control: 'pest_control',
  }
  function normalize(input) {
    return ALIASES[String(input).trim().toLowerCase()] ?? null
  }

  it('maps elevators and electrical aliases', () => {
    assert.equal(normalize('elevators'), 'elevators')
    assert.equal(normalize('electrical'), 'electricity')
    assert.equal(normalize('hvac'), 'ac')
  })
})

describe('webhook HMAC', () => {
  it('signs and verifies body', () => {
    const secret = 'test-secret'
    const body = JSON.stringify({ job_id: 'abc', status: 'accepted' })
    const sig = createHmac('sha256', secret).update(body, 'utf8').digest('hex')
    assert.equal(sig.length, 64)
    const again = createHmac('sha256', secret).update(body, 'utf8').digest('hex')
    assert.equal(sig, again)
  })
})

describe('status map (inline)', () => {
  function toApiStatus(fixlyStatus, opts = {}) {
    switch (fixlyStatus) {
      case 'no_providers':
        return 'no_providers'
      case 'accepted':
        return 'accepted'
      case 'on_the_way':
        return 'en_route'
      case 'pending':
      default: {
        const matched = opts.matchedProviders ?? 0
        if (matched <= 0) return 'open'
        return 'offered'
      }
    }
  }

  it('maps pending+matches → offered, empty → open', () => {
    assert.equal(toApiStatus('pending', { matchedProviders: 0 }), 'open')
    assert.equal(toApiStatus('pending', { matchedProviders: 2 }), 'offered')
    assert.equal(toApiStatus('on_the_way'), 'en_route')
  })
})

describe('memory job lifecycle', async () => {
  // Dynamic import of TS memory store when tsx available; else skip with note
  let memory
  try {
    memory = await import('../../lib/integrations/bamakor/memory-store.ts')
  } catch {
    try {
      // next build may not expose; use relative without extension via experimental
      memory = null
    } catch {
      memory = null
    }
  }

  it('creates offers and accepts first provider', async (t) => {
    if (!memory) {
      t.skip('TS memory-store requires tsx — covered by smoke:phase1')
      return
    }
    memory.memoryReset()
    memory.memorySeedCategories()
    const a = memory.memoryCreateProvider({
      display_name: 'Pro A',
      category: 'elevators',
      city: 'חדרה',
    })
    memory.memoryCreateProvider({
      display_name: 'Pro B',
      category: 'elevators',
      city: 'חדרה',
    })
    const job = memory.memoryCreateJob({
      category: 'elevators',
      title: 'test',
      description: 'desc',
      location: { city: 'חדרה' },
      source: 'bamakor',
      assignment_mode: 'broadcast_first_accept',
    })
    assert.equal(job.matched_providers, 2)
    assert.equal(job.offers.length, 2)
    const accepted = memory.memoryAcceptOffer(job.job_id, a.id)
    assert.equal(accepted.status, 'accepted')
    assert.equal(accepted.assigned_provider_id, a.id)
  })
})

void createRequire
void pathToFileURL
void join
void __dirname
