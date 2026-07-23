/**
 * Phase 1 smoke — uses the real Bamakor integration modules (memory store).
 *
 *   npm run smoke:phase1
 *
 * Steps:
 * 1. seed categories
 * 2. create 2 providers in elevators / חדרה
 * 3. create job
 * 4. verify offers
 * 5. accept as provider
 * 6. verify webhook payload
 */

process.env.FIXLY_JOBS_STORE = process.env.FIXLY_JOBS_STORE || 'memory'
process.env.FIXLY_WEBHOOK_DRY_RUN = process.env.FIXLY_WEBHOOK_DRY_RUN || '1'
process.env.BAMAKOR_WEBHOOK_SECRET =
  process.env.BAMAKOR_WEBHOOK_SECRET || 'smoke-secret-for-local-tests'

import {
  memoryReset,
  memorySeedCategories,
  memoryCreateProvider,
} from '../lib/integrations/bamakor/memory-store'
import {
  createJob,
  acceptJobOffer,
  getJob,
} from '../lib/integrations/bamakor/jobs-service'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    console.error('FAIL:', msg)
    process.exit(1)
  }
}

async function main() {
  console.log('=== Fixly Phase 1 smoke ===\n')

  memoryReset()
  const categories = memorySeedCategories()
  console.log('1) seed categories:', categories.map((c) => c.slug).join(', '))

  const p1 = memoryCreateProvider({
    display_name: 'מעלית פלוס חדרה',
    category: 'elevators',
    city: 'חדרה',
    phone: '972501111111',
  })
  const p2 = memoryCreateProvider({
    display_name: 'אלי מעליות',
    category: 'elevators',
    city: 'חדרה',
    phone: '972502222222',
  })
  console.log('2) created providers:', p1.id.slice(0, 8), p2.id.slice(0, 8))

  const { job, webhookDryRun } = await createJob({
    source: 'bamakor',
    category: 'elevators',
    title: 'רעש בדלתות מעלית ימין',
    description: 'noise in right lift doors',
    location: { city: 'חדרה', building_name: 'חלץ 12', address: 'חלץ 12, חדרה' },
    external_ref: {
      system: 'bamakor',
      ticket_id: 'smoke-ticket-1',
      ticket_number: 42,
      client_name: 'חברת ניהול לדוגמה',
    },
    assignment_mode: 'broadcast_first_accept',
    callback_url: 'https://webhook.site/fixly-smoke',
  })
  console.log('3) created job:', job.job_id, 'status=', job.status, 'dry_run=', webhookDryRun)
  assert(job.matched_providers === 2, 'expected 2 matched providers')
  assert(job.offers.length === 2, 'expected 2 offers')
  console.log('4) offers:', job.offers.length)

  const { job: accepted, webhook } = await acceptJobOffer(job.job_id, p1.id)
  console.log('5) accepted as', p1.display_name, '→', accepted.status)
  assert(accepted.status === 'accepted', 'expected accepted')
  assert(webhook.payload.status === 'accepted', 'webhook status accepted')
  assert(webhook.payload.provider?.name === p1.display_name, 'webhook provider name')
  assert(webhook.dryRun === true, 'expected dry-run webhook')

  const again = await getJob(job.job_id)
  assert(again?.status === 'accepted', 'getJob should return accepted')
  console.log('6) webhook payload status:', webhook.payload.status)

  console.log('\nOK — Phase 1 smoke passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})