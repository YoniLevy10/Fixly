import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildWhatsAppLink,
  isAppleMobileBrowser,
  navigateAfterAsyncClick,
  openExternalUrl,
} from '@/lib/contact/whatsapp-link'
import { buildRecruitWhatsAppMessage } from '@/lib/prospects/message'

describe('buildWhatsAppLink', () => {
  it('normalizes Israeli mobile numbers to wa.me', () => {
    const url = buildWhatsAppLink('050-123-4567', 'שלום')
    assert.ok(url)
    assert.match(url!, /^https:\/\/wa\.me\/972501234567\?text=/)
    assert.match(url!, /text=%D7%A9%D7%9C%D7%95%D7%9D/)
  })

  it('accepts numbers already in 972 form', () => {
    const url = buildWhatsAppLink('+972 50-111-2222', 'hi')
    assert.ok(url)
    assert.match(url!, /^https:\/\/wa\.me\/972501112222\?text=/)
  })

  it('returns null for empty phone', () => {
    assert.equal(buildWhatsAppLink('   ', 'x'), null)
  })

  it('embeds recruit message for outreach', () => {
    const msg = buildRecruitWhatsAppMessage({
      name: 'יוסי',
      category: 'אינסטלציה',
      city: 'ירושלים',
    })
    const url = buildWhatsAppLink('050-123-4567', msg)
    assert.ok(url)
    assert.match(url!, /wa\.me\/972501234567\?text=/)
    const text = decodeURIComponent(url!.split('text=')[1]!)
    assert.ok(text.includes('Fixly'))
    assert.ok(text.includes('אינסטלציה'))
  })
})

describe('openExternalUrl / navigateAfterAsyncClick', () => {
  it('exports apple detection helper', () => {
    assert.equal(typeof isAppleMobileBrowser, 'function')
    assert.equal(typeof openExternalUrl, 'function')
    assert.equal(typeof navigateAfterAsyncClick, 'function')
  })
})
