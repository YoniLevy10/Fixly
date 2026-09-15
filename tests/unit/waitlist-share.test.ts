import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildWaitlistShareMessage,
  buildWaitlistShareUrl,
  buildWaitlistWhatsAppShareUrl,
} from '../../lib/marketing/waitlist-share'

describe('waitlist-share', () => {
  it('builds share URL onto /waitlist with UTM + ref', () => {
    const url = buildWaitlistShareUrl('customer')
    assert.match(url, /\/waitlist/)
    assert.match(url, /utm_source=share/)
    assert.match(url, /utm_medium=whatsapp/)
    assert.match(url, /utm_campaign=weekend_waitlist/)
    assert.match(url, /utm_content=customer/)
    assert.match(url, /ref=waitlist_share/)
  })

  it('builds professional share onto /pro/join', () => {
    const url = buildWaitlistShareUrl('professional')
    assert.match(url, /\/pro\/join/)
    assert.match(url, /utm_content=professional/)
  })

  it('builds Hebrew WhatsApp deep link', () => {
    const wa = buildWaitlistWhatsAppShareUrl('professional')
    assert.ok(wa.startsWith('https://wa.me/?text='))
    const text = decodeURIComponent(wa.split('text=')[1] ?? '')
    assert.match(text, /Fixly/)
    assert.match(text, /utm_content=professional/)
    assert.match(text, /\/pro\/join/)
  })

  it('includes product framing in customer message', () => {
    const msg = buildWaitlistShareMessage('customer')
    assert.match(msg, /בעל מקצוע/)
    assert.match(msg, /\/waitlist/)
  })
})
