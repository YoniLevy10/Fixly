import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { selectSmsRecipients, loadSmsRecipients, type SmsProspect } from '../../lib/sms/prospect-recipients'
import { send019Campaign, sms019Configured } from '../../lib/sms/019'
import type { SupabaseClient } from '@supabase/supabase-js'

const row = (id: string, phone: string | null, status = 'discovered', whatsapp_phone: string | null = null): SmsProspect => ({ id, phone, status, whatsapp_phone })

describe('recruitment SMS audience', () => {
  it('normalizes Israeli formats, deduplicates and rejects landlines/foreign/invalid phones', () => {
    const audience = selectSmsRecipients([
      row('a', '050-123-4567'), row('b', '+972501234567'), row('c', '00972501234567'),
      row('d', '02-1234567'), row('e', '+15551234567'), row('f', 'not-a-phone'),
      row('g', null, 'verified', '0521234567'),
    ])
    assert.deepEqual(audience.recipients, ['0501234567', '0521234567'])
    assert.equal(audience.excluded, 3)
    assert.equal(audience.duplicates, 2)
  })
  it('suppresses every duplicate of a do-not-contact number, even when blocked row comes last', () => {
    assert.deepEqual(selectSmsRecipients([
      row('a', '0501234567'), row('b', '+972501234567', 'do_not_contact'),
      row('c', '0521234567'), row('d', null, 'do_not_contact', '+972521234567'),
    ]).recipients, [])
  })
  it('falls back to a mobile WhatsApp phone when main phone is a landline', () => {
    assert.deepEqual(selectSmsRecipients([row('a', '021234567', 'discovered', '0541234567')]).recipients, ['0541234567'])
  })
  it('snapshot is order-independent and changes with the actual audience', () => {
    const rows = [row('a', '0501234567'), row('b', '0521234567')]
    assert.equal(selectSmsRecipients(rows).snapshot, selectSmsRecipients([...rows].reverse()).snapshot)
    assert.notEqual(selectSmsRecipients(rows).snapshot, selectSmsRecipients(rows.slice(1)).snapshot)
  })
  it('excludes rejected leads and phones that already registered', () => {
    const audience = selectSmsRecipients(
      [row('a', '0501234567', 'rejected'), row('b', '0521234567'), row('c', '0531234567', 'discovered', null)],
      ['0531234567'],
    )
    assert.deepEqual(audience.recipients, ['0521234567'])
  })
  it('loads beyond the Supabase default response limit', async () => {
    const ranges: number[][] = []
    const admin = { from: (table: string) => {
      if (table === 'pro_waitlist') {
        return { select: () => ({ order: () => ({ range: async () => ({ data: [], error: null }) }) }) }
      }
      assert.equal(table, 'professional_prospects')
      return { select: () => ({ order: () => ({ range: async (start: number, end: number) => {
        ranges.push([start, end])
        return { data: Array.from({ length: start < 1000 ? 500 : 5 }, (_, i) => row(String(start + i), `05${String(start + i).padStart(8, '0')}`)), error: null }
      } }) }) }
    } } as unknown as SupabaseClient
    const result = await loadSmsRecipients(admin)
    assert.equal(result.count, 1005)
    assert.deepEqual(ranges, [[0, 499], [500, 999], [1000, 1499]])
  })
})

const originalFetch = globalThis.fetch
const previousEnv = { ...process.env }
afterEach(() => { globalThis.fetch = originalFetch; process.env = { ...previousEnv } })
function configure() {
  process.env.SMS_019_USERNAME = 'test-user'
  process.env.SMS_019_TOKEN = 'test-token'
  process.env.SMS_019_SENDER = 'Fixly'
}
describe('019 campaign provider (mocked)', () => {
  it('refuses missing credentials without calling provider', async () => {
    delete process.env.SMS_019_TOKEN
    let called = false
    globalThis.fetch = async () => { called = true; return new Response('{}') }
    assert.equal(sms019Configured(), false)
    await assert.rejects(send019Campaign('campaign', 'שלום', ['0501234567']))
    assert.equal(called, false)
  })
  it('submits one request to all recipients and reports acceptance', async () => {
    configure()
    let calls = 0
    globalThis.fetch = async (url, options) => {
      calls++
      assert.equal(url, 'https://019sms.co.il/api')
      const body = JSON.parse(String(options?.body))
      assert.deepEqual(body.sms.destinations.phone, [{ _: '0501234567' }, { _: '0521234567' }])
      assert.equal(body.sms.message, 'שלום')
      assert.equal(body.sms.add_unsubscribe, '3')
      assert.equal((options?.headers as Record<string, string>).Authorization, 'Bearer test-token')
      return Response.json({ status: '0', shipment_id: 'shipment' })
    }
    assert.deepEqual(await send019Campaign('campaign', 'שלום', ['0501234567', '0521234567']), { status: 'accepted', shipmentId: 'shipment' })
    assert.equal(calls, 1)
  })
  it('marks a timeout unknown without retrying', async () => {
    configure()
    let calls = 0
    globalThis.fetch = async () => { calls++; throw new Error('timeout') }
    assert.equal((await send019Campaign('campaign', 'שלום', ['0501234567'])).status, 'unknown')
    assert.equal(calls, 1)
  })
  it('distinguishes provider rejection from a malformed response', async () => {
    configure()
    globalThis.fetch = async () => Response.json({ status: 3 })
    assert.equal((await send019Campaign('campaign', 'שלום', ['0501234567'])).status, 'rejected')
    globalThis.fetch = async () => Response.json({ message: 'unexpected' })
    assert.equal((await send019Campaign('campaign', 'שלום', ['0501234567'])).status, 'unknown')
  })
})

describe('owner signup alerts', () => {
  it('includes the saved registration details and correct audience', async () => {
    const { buildSignupAlert } = await import('../../lib/sms/signup-notify')
    const text = buildSignupAlert({ full_name: 'דני כהן', phone: '0501234567', audience: 'professional', city: 'ירושלים' })
    assert.match(text, /הרשמה חדשה ב־Fixly/)
    assert.match(text, /דני כהן/)
    assert.match(text, /0501234567/)
    assert.match(text, /איש מקצוע/)
    assert.match(text, /ירושלים/)
    assert.match(buildSignupAlert({ full_name: 'דנה', phone: '0521234567', audience: 'customer' }), /לקוח/)
  })
  it('uses the owner phone, validates overrides and does not send before configured', async () => {
    const { signupNotifyPhone, deliverSignupNotification } = await import('../../lib/sms/signup-notify')
    delete process.env.SMS_SIGNUP_NOTIFY_PHONE
    assert.equal(signupNotifyPhone(), '0552819086')
    process.env.SMS_SIGNUP_NOTIFY_PHONE = '+972501234567'
    assert.equal(signupNotifyPhone(), '0501234567')
    process.env.SMS_SIGNUP_NOTIFY_PHONE = 'invalid'
    assert.equal(signupNotifyPhone(), null)
    process.env.SMS_SIGNUP_NOTIFICATIONS_ENABLED = 'true'
    delete process.env.SMS_019_TOKEN
    assert.deepEqual(await deliverSignupNotification({} as SupabaseClient, 'id'), { status: 'not_configured' })
  })
  it('owner SMS does not append a recruitment unsubscribe link', async () => {
    configure()
    globalThis.fetch = async (_url, options) => {
      assert.equal(JSON.parse(String(options?.body)).sms.add_unsubscribe, '0')
      return Response.json({ status: 0, shipment_id: 'owner-alert' })
    }
    assert.equal((await send019Campaign('owner-alert', 'הרשמה חדשה', ['0552819086'], false)).status, 'accepted')
  })
})


describe('signup notification activation gate', () => {
  it('remains disabled even when 019 is configured, without accessing data or sending SMS', async () => {
    configure()
    delete process.env.SMS_SIGNUP_NOTIFICATIONS_ENABLED
    const { signupNotificationsEnabled, deliverSignupNotification } = await import('../../lib/sms/signup-notify')
    assert.equal(signupNotificationsEnabled(), false)
    globalThis.fetch = async () => { throw new Error('must not contact provider') }
    assert.deepEqual(await deliverSignupNotification({} as SupabaseClient, 'id'), { status: 'disabled' })
  })
})
