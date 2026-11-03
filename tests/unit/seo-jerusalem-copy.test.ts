import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  JERUSALEM_PRIORITY_CATEGORIES,
  getJerusalemCategoryIntro,
  jerusalemPriorityLinks,
} from '@/lib/seo/jerusalem-copy'
import { PRIMARY_SEO_CITY_SLUG, SEO_CITIES } from '@/lib/seo/marketplace-pages'

describe('jerusalem SEO cluster', () => {
  it('lists jerusalem as the primary SEO city', () => {
    assert.equal(PRIMARY_SEO_CITY_SLUG, 'jerusalem')
    assert.equal(SEO_CITIES[0].slug, 'jerusalem')
  })

  it('exposes unique intros for priority categories', () => {
    for (const slug of JERUSALEM_PRIORITY_CATEGORIES) {
      const intro = getJerusalemCategoryIntro(slug)
      assert.ok(intro)
      assert.ok(intro.lead.includes('ירושלים') || intro.body.includes('ירושלים'))
      assert.ok(intro.h2.length > 8)
      assert.notEqual(intro.lead, intro.body)
    }
    assert.equal(getJerusalemCategoryIntro('cleaning'), null)
  })

  it('builds three Jerusalem priority internal links', () => {
    const links = jerusalemPriorityLinks()
    assert.equal(links.length, 3)
    assert.deepEqual(
      links.map((l) => l.path),
      [
        '/professionals/plumbing/jerusalem',
        '/professionals/electricity/jerusalem',
        '/professionals/ac/jerusalem',
      ],
    )
    assert.match(links[0].label, /אינסטלטור בירושלים/)
  })
})
