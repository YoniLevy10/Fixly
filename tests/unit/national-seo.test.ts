import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  SEO_CATEGORIES,
  SEO_CITIES,
  SEO_PAIR_COUNT,
  categoryHubPath,
  getCategoryBySlug,
  getCityBySlug,
  legacyServicesPath,
  locationHubPath,
  seoPagePath,
} from '@/lib/seo/marketplace-pages'
import { professionalPublicSlug, slugifyHe } from '@/lib/seo/pro-slug'
import { SEO_WAITLIST_DEMAND_THRESHOLD } from '@/lib/seo/has-seo-value'

describe('national SEO inventory', () => {
  it('covers multiple cities nationwide (not Jerusalem-only)', () => {
    assert.ok(SEO_CITIES.length >= 15)
    assert.ok(SEO_CITIES.some((c) => c.slug === 'tel-aviv'))
    assert.ok(SEO_CITIES.some((c) => c.slug === 'haifa'))
    assert.ok(SEO_CITIES.some((c) => c.slug === 'beer-sheva'))
    assert.ok(SEO_CITIES.some((c) => c.slug === 'jerusalem'))
  })

  it('includes core trades with jobs phrasing for recruitment SEO', () => {
    assert.ok(SEO_CATEGORIES.length >= 10)
    const plumbing = getCategoryBySlug('plumbing')
    assert.ok(plumbing)
    assert.match(plumbing.jobsHe, /אינסטל/)
    assert.ok(getCategoryBySlug('handyman'))
    assert.ok(getCategoryBySlug('electricity'))
  })

  it('builds canonical profession×city paths', () => {
    assert.equal(seoPagePath('plumbing', 'jerusalem'), '/professionals/plumbing/jerusalem')
    assert.equal(seoPagePath('electricity', 'tel-aviv'), '/professionals/electricity/tel-aviv')
    assert.equal(categoryHubPath('plumbing'), '/professionals/plumbing')
    assert.equal(locationHubPath('haifa'), '/locations/haifa')
    assert.equal(
      legacyServicesPath('tel-aviv', 'plumbing'),
      '/services/tel-aviv/plumbing',
    )
    assert.equal(SEO_PAIR_COUNT, SEO_CITIES.length * SEO_CATEGORIES.length)
  })

  it('resolves known city and category slugs', () => {
    assert.equal(getCityBySlug('rishon-lezion')?.nameHe, 'ראשון לציון')
    assert.equal(getCategoryBySlug('missing'), undefined)
  })
})

describe('SEO value gate', () => {
  it('requires at least 3 customer waitlist signups for demand-based index', () => {
    assert.equal(SEO_WAITLIST_DEMAND_THRESHOLD, 3)
  })
})

describe('pro public slug', () => {
  it('builds stable public slug from name + id suffix', () => {
    const slug = professionalPublicSlug('יוסי כהן', 'abcdef01-2222-3333-4444-555555555555')
    assert.match(slug, /abcdef01$/)
    assert.ok(slugifyHe('Tel Aviv').includes('tel'))
  })
})
