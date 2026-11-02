import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  resolveSeoCategorySlug,
  resolveSeoCitySlug,
} from '@/lib/seo/resolve-location'

describe('resolveSeoCitySlug', () => {
  it('defaults to tel-aviv', () => {
    assert.equal(resolveSeoCitySlug(undefined), 'tel-aviv')
    assert.equal(resolveSeoCitySlug(''), 'tel-aviv')
  })

  it('maps Hebrew city names', () => {
    assert.equal(resolveSeoCitySlug('תל אביב-יפו'), 'tel-aviv')
    assert.equal(resolveSeoCitySlug('חיפה'), 'haifa')
    assert.equal(resolveSeoCitySlug('ירושלים'), 'jerusalem')
    assert.equal(resolveSeoCitySlug('באר שבע'), 'beer-sheva')
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
