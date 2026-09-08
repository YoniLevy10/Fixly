import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { normalizePhone, phonesMatch } from '@/lib/prospects/phone'
import { findDuplicate } from '@/lib/prospects/dedupe'
import { assertTransition, canTransition, isContactAllowed } from '@/lib/prospects/status'
import { buildRecruitWhatsAppMessage } from '@/lib/prospects/message'
import { parseProspectsCsv, serializeProspectsCsv } from '@/lib/prospects/csv'
import { createProspectSchema, bulkProspectStatusSchema } from '@/lib/api/schemas'
import { isAdminUser } from '@/lib/admin/is-admin'
import { JOIN_URL } from '@/lib/prospects/config'

describe('normalizePhone', () => {
  it('normalizes local Israeli mobiles to 972', () => {
    assert.equal(normalizePhone('050-123-4567'), '972501234567')
    assert.equal(normalizePhone('0521234567'), '972521234567')
  })

  it('keeps already-international numbers', () => {
    assert.equal(normalizePhone('+972501234567'), '972501234567')
    assert.equal(normalizePhone('972501234567'), '972501234567')
  })

  it('matches equivalent formats', () => {
    assert.equal(phonesMatch('0501234567', '+972501234567'), true)
  })
})

describe('dedupe', () => {
  const existing = [
    {
      id: 'a',
      phoneNormalized: '972501111111',
      sourceName: 'csv',
      externalId: 'ext-1',
      businessName: 'יוסי אינסטלציה',
      categoryId: 'cat-1',
      city: 'ירושלים',
    },
  ]

  it('detects phone duplicates', () => {
    const hit = findDuplicate({ phoneNormalized: '972501111111' }, existing)
    assert.equal(hit?.reason, 'phone')
    assert.equal(hit?.existingId, 'a')
  })

  it('detects source+external_id duplicates', () => {
    const hit = findDuplicate(
      { sourceName: 'csv', externalId: 'ext-1' },
      existing,
    )
    assert.equal(hit?.reason, 'source_external')
  })

  it('detects business+category+city duplicates', () => {
    const hit = findDuplicate(
      {
        businessName: 'יוסי אינסטלציה',
        categoryId: 'cat-1',
        city: 'ירושלים',
      },
      existing,
    )
    assert.equal(hit?.reason, 'business_category_city')
  })

  it('returns null when no match', () => {
    assert.equal(
      findDuplicate(
        {
          phoneNormalized: '972509999999',
          sourceName: 'manual',
          externalId: 'x',
          businessName: 'אחר',
          categoryId: 'cat-2',
          city: 'תל אביב',
        },
        existing,
      ),
      null,
    )
  })
})

describe('status transitions', () => {
  it('allows forward funnel and reject', () => {
    assert.equal(canTransition('discovered', 'verified'), true)
    assert.equal(canTransition('verified', 'approved'), true)
    assert.equal(canTransition('approved', 'rejected'), true)
    assert.equal(assertTransition('discovered', 'active').ok, true)
  })

  it('allows contact only from approved+', () => {
    assert.equal(isContactAllowed('discovered'), false)
    assert.equal(isContactAllowed('verified'), false)
    assert.equal(isContactAllowed('approved'), true)
    assert.equal(isContactAllowed('contacted'), true)
  })
})

describe('recruit message', () => {
  it('builds trusted copy without inventing demand', () => {
    const msg = buildRecruitWhatsAppMessage({
      name: 'דני',
      category: 'אינסטלטור',
      city: 'ירושלים',
    })
    assert.match(msg, /דני/)
    assert.match(msg, /אינסטלטור/)
    assert.match(msg, /ירושלים/)
    assert.match(msg, new RegExp(JOIN_URL.replace(/\./g, '\\.')))
    assert.equal(msg.includes('בקשות פעילות'), false)
  })

  it('appends demand only for positive integer counts', () => {
    const msg = buildRecruitWhatsAppMessage({
      name: 'דני',
      category: 'אינסטלטור',
      matchingOpenRequests: 3,
    })
    assert.match(msg, /3 בקשות פעילות/)
  })

  it('ignores zero or non-integer demand', () => {
    assert.equal(
      buildRecruitWhatsAppMessage({
        name: 'א',
        category: 'ב',
        matchingOpenRequests: 0,
      }).includes('בקשות פעילות'),
      false,
    )
  })
})

describe('csv', () => {
  it('round-trips basic rows', () => {
    const csv = serializeProspectsCsv([
      {
        name: 'רועי',
        phone: '0501234567',
        city: 'ירושלים',
        category_slug: 'plumbing',
        source_name: 'csv',
      },
    ])
    const parsed = parseProspectsCsv(csv)
    assert.equal(parsed.errors.length, 0)
    assert.equal(parsed.records.length, 1)
    assert.equal(parsed.records[0].name, 'רועי')
    assert.equal(parsed.records[0].categorySlug, 'plumbing')
  })

  it('reports missing name column', () => {
    const parsed = parseProspectsCsv('phone,city\n050,ירושלים')
    assert.ok(parsed.errors.length > 0)
  })
})

describe('admin auth', () => {
  it('accepts app_metadata admin role', () => {
    assert.equal(
      isAdminUser({ email: 'x@y.com', app_metadata: { role: 'admin' } }),
      true,
    )
  })

  it('does not trust user_metadata admin role', () => {
    assert.equal(
      isAdminUser({ email: 'x@y.com', user_metadata: { role: 'admin' } }),
      false,
    )
  })

  it('accepts ADMIN_EMAILS allow-list', () => {
    const prev = process.env.ADMIN_EMAILS
    process.env.ADMIN_EMAILS = 'ops@fixly.tech'
    assert.equal(isAdminUser({ email: 'ops@fixly.tech' }), true)
    assert.equal(isAdminUser({ email: 'other@fixly.tech' }), false)
    process.env.ADMIN_EMAILS = prev
  })
})

describe('prospect schemas', () => {
  it('requires phone or external id on create', () => {
    const bad = createProspectSchema.safeParse({ name: 'בדיקה', city: 'ירושלים' })
    assert.equal(bad.success, false)

    const ok = createProspectSchema.safeParse({
      name: 'בדיקה',
      phone: '0501234567',
    })
    assert.equal(ok.success, true)
  })

  it('validates bulk status payload', () => {
    const parsed = bulkProspectStatusSchema.parse({
      ids: ['11111111-1111-4111-8111-111111111111'],
      status: 'approved',
    })
    assert.equal(parsed.status, 'approved')
  })
})
