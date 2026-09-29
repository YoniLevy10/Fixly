import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildWaitlistShareMessage,
  buildWaitlistShareUrl,
  buildWaitlistWhatsAppShareUrl,
} from '../../lib/marketing/waitlist-share'

describe('waitlist-share', () => {
  it('builds share URL onto /waitlist with canonical UTM medium=share', () => {
    const url = buildWaitlistShareUrl('customer')
    assert.match(url, /\/waitlist/)
    assert.match(url, /utm_source=share/)
    assert.match(url, /utm_medium=share/)
    assert.match(url, /utm_campaign=waitlist_referral/)
    assert.match(url, /utm_content=customer/)
    assert.match(url, /ref=waitlist_share/)
  })

  it('builds professional share onto /waitlist?audience=professional', () => {
    const url = buildWaitlistShareUrl('professional')
    assert.match(url, /\/waitlist/)
    assert.match(url, /audience=professional/)
    assert.match(url, /utm_content=professional/)
    assert.doesNotMatch(url, /\/pro\/join/)
  })

  it('builds Hebrew WhatsApp deep link', () => {
    const wa = buildWaitlistWhatsAppShareUrl('professional')
    assert.ok(wa.startsWith('https://wa.me/?text='))
    const text = decodeURIComponent(wa.split('text=')[1] ?? '')
    assert.match(text, /Fixly/)
    assert.match(text, /utm_content=professional/)
    assert.match(text, /\/waitlist/)
  })

  it('includes product framing in customer message', () => {
    const msg = buildWaitlistShareMessage('customer')
    assert.match(msg, /בעל מקצוע/)
    assert.match(msg, /\/waitlist/)
  })
})
