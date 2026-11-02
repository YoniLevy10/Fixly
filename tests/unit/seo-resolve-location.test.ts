import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  resolveInternalLinkCitySlug,
  resolveSeoCategorySlug,
  resolveSeoCitySlug,
  DEFAULT_CITY_SLUG,
} from '@/lib/seo/resolve-location'

describe('resolveSeoCitySlug', () => {
  it('defaults to jerusalem', () => {
    assert.equal(DEFAULT_CITY_SLUG, 'jerusalem')
    assert.equal(resolveSeoCitySlug(undefined), 'jerusalem')
    assert.equal(resolveSeoCitySlug(''), 'jerusalem')
  })

  it('maps Hebrew city names', () => {
    assert.equal(resolveSeoCitySlug('תל אביב-יפו'), 'tel-aviv')
    assert.equal(resolveSeoCitySlug('חיפה'), 'haifa')
    assert.equal(resolveSeoCitySlug('ירושלים'), 'jerusalem')
    assert.equal(resolveSeoCitySlug('באר שבע'), 'beer-sheva')
  })
})

describe('resolveInternalLinkCitySlug', () => {
  it('falls back to jerusalem when empty', () => {
    assert.equal(resolveInternalLinkCitySlug(undefined), 'jerusalem')
    assert.equal(resolveInternalLinkCitySlug(''), 'jerusalem')
  })

  it('maps anonymous guest Tel Aviv default to jerusalem', () => {
    assert.equal(
      resolveInternalLinkCitySlug('תל אביב-יפו', { isAnonymous: true }),
      'jerusalem',
    )
  })

  it('keeps a real detected city for signed-in users', () => {
    assert.equal(
      resolveInternalLinkCitySlug('תל אביב-יפו', { isAnonymous: false }),
      'tel-aviv',
    )
    assert.equal(resolveInternalLinkCitySlug('חיפה'), 'haifa')
    assert.equal(resolveInternalLinkCitySlug('ירושלים'), 'jerusalem')
  })
})

describe('resolveSeoCategorySlug', () => {
  it('maps Hebrew category labels onto SEO slugs', () => {
    assert.equal(resolveSeoCategorySlug('אינסטלטור'), 'plumbing')
    assert.equal(resolveSeoCategorySlug('חשמלאי מוסמך'), 'electricity')
    assert.equal(resolveSeoCategorySlug('מיזוג אוויר'), 'ac')
  })

  it('returns null outside the SEO set', () => {
    assert.equal(resolveSeoCategorySlug('הובלות'), null)
  })
})
