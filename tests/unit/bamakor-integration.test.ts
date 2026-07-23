import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeCategoryKey } from '../../lib/integrations/bamakor/categories'
import { toApiStatus, canTransitionApi } from '../../lib/integrations/bamakor/status-map'
import {
  signWebhookBody,
  verifyWebhookSignature,
  emitJobStatusWebhook,
} from '../../lib/integrations/bamakor/webhook'
import {
  memoryReset,
  memorySeedCategories,
  memoryCreateProvider,
  memoryCreateJob,
  memoryGetJob,
} from '../../lib/integrations/bamakor/memory-store'
import {
  createJob,
  acceptJobOffer,
  getJob,
  cancelJob,
} from '../../lib/integrations/bamakor/jobs-service'
import { assignmentModeToMatchMode } from '../../lib/integrations/bamakor/assignment'

describe('normalizeCategoryKey', () => {
  it('resolves aliases', () => {
    assert.equal(normalizeCategoryKey('elevators'), 'elevators')
    assert.equal(normalizeCategoryKey('electrical'), 'electricity')
    assert.equal(normalizeCategoryKey('hvac'), 'ac')
    assert.equal(normalizeCategoryKey('מעליות'), 'elevators')
  })
})

describe('assignmentModeToMatchMode', () => {
  it('maps partner modes to multi', () => {
    assert.equal(assignmentModeToMatchMode('broadcast_first_accept'), 'multi')
    assert.equal(assignmentModeToMatchMode('manual_select'), 'multi')
  })
})

describe('status map', () => {
  it('maps fixly → api', () => {
    assert.equal(toApiStatus('pending', { matchedProviders: 0 }), 'open')
    assert.equal(toApiStatus('pending', { matchedProviders: 3, hasOpenOffers: true }), 'offered')
    assert.equal(toApiStatus('on_the_way'), 'en_route')
    assert.equal(toApiStatus('no_providers'), 'no_providers')
  })

  it('allows accepted → en_route', () => {
    assert.equal(canTransitionApi('accepted', 'en_route'), true)
    assert.equal(canTransitionApi('open', 'completed'), false)
  })
})

describe('webhook signing', () => {
  it('round-trips HMAC', () => {
    const body = '{"ok":true}'
    const sig = signWebhookBody(body, 'sec')
    assert.equal(verifyWebhookSignature(body, sig, 'sec'), true)
    assert.equal(verifyWebhookSignature(body, 'sha256=' + sig, 'sec'), true)
    assert.equal(verifyWebhookSignature(body, 'deadbeef', 'sec'), false)
  })

  it('dry-runs when no callback', async () => {
    const result = await emitJobStatusWebhook({
      callbackUrl: null,
      payload: {
        event: 'job.status_changed',
        job_id: 'j1',
        status: 'open',
        external_ref: null,
        occurred_at: new Date().toISOString(),
      },
    })
    assert.equal(result.dryRun, true)
    assert.equal(result.attempts, 0)
  })

  it('retries 3 times with backoff on 500', async () => {
    const prevDry = process.env.FIXLY_WEBHOOK_DRY_RUN
    delete process.env.FIXLY_WEBHOOK_DRY_RUN
    try {
      let calls = 0
      const sleeps: number[] = []
      const result = await emitJobStatusWebhook({
        callbackUrl: 'https://example.test/webhook',
        payload: {
          event: 'job.status_changed',
          job_id: 'j-retry',
          status: 'accepted',
          external_ref: null,
          occurred_at: new Date().toISOString(),
        },
        maxAttempts: 3,
        backoffMs: [0, 10, 20],
        sleepImpl: async (ms) => {
          sleeps.push(ms)
        },
        fetchImpl: async () => {
          calls += 1
          return new Response('nope', { status: 500 })
        },
      })
      assert.equal(calls, 3)
      assert.equal(result.delivered, false)
      assert.equal(result.attempts, 3)
      assert.deepEqual(sleeps, [0, 10, 20])
    } finally {
      if (prevDry === undefined) delete process.env.FIXLY_WEBHOOK_DRY_RUN
      else process.env.FIXLY_WEBHOOK_DRY_RUN = prevDry
    }
  })

  it('succeeds on second attempt', async () => {
    const prevDry = process.env.FIXLY_WEBHOOK_DRY_RUN
    delete process.env.FIXLY_WEBHOOK_DRY_RUN
    try {
      let calls = 0
      const result = await emitJobStatusWebhook({
        callbackUrl: 'https://example.test/webhook',
        payload: {
          event: 'job.status_changed',
          job_id: 'j-ok',
          status: 'offered',
          external_ref: null,
          occurred_at: new Date().toISOString(),
        },
        maxAttempts: 3,
        backoffMs: [0, 0, 0],
        sleepImpl: async () => {},
        fetchImpl: async () => {
          calls += 1
          if (calls === 1) return new Response('busy', { status: 503 })
          return new Response('ok', { status: 200 })
        },
      })
      assert.equal(calls, 2)
      assert.equal(result.delivered, true)
      assert.equal(result.attempts, 2)
    } finally {
      if (prevDry === undefined) delete process.env.FIXLY_WEBHOOK_DRY_RUN
      else process.env.FIXLY_WEBHOOK_DRY_RUN = prevDry
    }
  })
})

describe('memory marketplace flow', () => {
  beforeEach(() => {
    process.env.FIXLY_JOBS_STORE = 'memory'
    memoryReset()
    memorySeedCategories()
  })

  it('matches 2 elevators pros in Hadera and accepts', async () => {
    const a = memoryCreateProvider({
      display_name: 'מעלית פלוס',
      category: 'elevators',
      city: 'חדרה',
    })
    memoryCreateProvider({
      display_name: 'אלי מעליות',
      category: 'elevators',
      city: 'חדרה',
    })

    const { job } = await createJob({
      source: 'bamakor',
      category: 'elevators',
      title: 'רעש בדלתות',
      description: 'noise',
      location: { city: 'חדרה', building_name: 'חלץ 12' },
      external_ref: {
        system: 'bamakor',
        ticket_id: 't-1',
        ticket_number: 42,
      },
      assignment_mode: 'broadcast_first_accept',
      callback_url: null,
    })

    assert.equal(job.matched_providers, 2)
    assert.equal(job.offers.length, 2)
    assert.ok(['open', 'offered'].includes(job.status))

    const { job: accepted, webhook } = await acceptJobOffer(job.job_id, a.id)
    assert.equal(accepted.status, 'accepted')
    assert.equal(accepted.assigned_provider_id, a.id)
    assert.equal(webhook.payload.status, 'accepted')
    assert.equal(webhook.dryRun, true)

    const again = await getJob(job.job_id)
    assert.equal(again?.status, 'accepted')
  })

  it('returns no_providers when city has no pros', async () => {
    memoryCreateProvider({
      display_name: 'Only Tel Aviv',
      category: 'elevators',
      city: 'תל אביב',
    })
    const job = memoryCreateJob({
      category: 'elevators',
      title: 'x',
      description: 'y',
      location: { city: 'חדרה' },
    })
    assert.equal(job.status, 'no_providers')
    assert.equal(job.matched_providers, 0)
  })

  it('is idempotent on external ticket', async () => {
    memoryCreateProvider({
      display_name: 'P',
      category: 'elevators',
      city: 'חדרה',
    })
    const first = memoryCreateJob({
      category: 'elevators',
      title: 'a',
      description: 'b',
      location: { city: 'חדרה' },
      external_ref: { system: 'bamakor', ticket_id: 'same' },
    })
    const second = memoryCreateJob({
      category: 'elevators',
      title: 'a2',
      description: 'b2',
      location: { city: 'חדרה' },
      external_ref: { system: 'bamakor', ticket_id: 'same' },
    })
    assert.equal(first.job_id, second.job_id)
    assert.ok(memoryGetJob(first.job_id))
  })

  it('cancels an offered job and emits cancelled', async () => {
    memoryCreateProvider({
      display_name: 'P',
      category: 'elevators',
      city: 'חדרה',
    })
    const { job } = await createJob({
      source: 'bamakor',
      category: 'elevators',
      title: 'cancel me',
      description: 'x',
      location: { city: 'חדרה' },
      callback_url: null,
    })
    const { job: cancelled, webhook } = await cancelJob(job.job_id, { reason: 'manager cancel' })
    assert.equal(cancelled.status, 'cancelled')
    assert.equal(webhook.payload.status, 'cancelled')
  })
})
