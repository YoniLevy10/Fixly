import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { mapProfessionalRow } from '@/lib/data/supabase-mappers'

const base = {
  id: '11111111-2222-4333-8444-555555555555',
  title: 'דני כהן',
  description: 'אינסטלטור',
  category_id: null,
  rating: 4.8,
  reviews_count: 12,
  hourly_price: 200,
  city: 'תל אביב',
  available: true,
  profile_image: null,
}

describe('mapProfessionalRow isApproved', () => {
  it('approves verified + active', () => {
    const pro = mapProfessionalRow({
      ...base,
      is_active: true,
      is_verified: true,
    })
    assert.equal(pro.isApproved, true)
    assert.equal(pro.isVerified, true)
  })

  it('rejects active but unverified', () => {
    const pro = mapProfessionalRow({
      ...base,
      is_active: true,
      is_verified: false,
    })
    assert.equal(pro.isApproved, false)
    assert.equal(pro.isVerified, false)
  })

  it('rejects inactive even when verified', () => {
    const pro = mapProfessionalRow({
      ...base,
      is_active: false,
      is_verified: true,
    })
    assert.equal(pro.isApproved, false)
    assert.equal(pro.isVerified, true)
  })

  it('treats missing is_active as active', () => {
    const pro = mapProfessionalRow({
      ...base,
      is_verified: true,
    })
    assert.equal(pro.isApproved, true)
  })
})

describe('professional profile indexability', () => {
  it('unverified profiles should emit noindex via robots/isApproved gate', () => {
    const pro = mapProfessionalRow({
      ...base,
      is_active: true,
      is_verified: false,
    })
    const isDemo = false
    const robots =
      isDemo || !pro.isApproved
        ? { index: false, follow: true }
        : { index: true, follow: true }
    const indexable = !isDemo && pro.isVerified
    assert.equal(robots.index, false)
    assert.equal(indexable, false)
  })
})
