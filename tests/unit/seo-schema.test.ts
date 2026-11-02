import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildBreadcrumbListSchema,
  buildProfessionalServiceSchema,
  buildProfessionalsItemListSchema,
  buildWebSiteSchema,
} from '@/lib/seo/schema'
import type { Professional } from '@/types/professional'

const samplePro: Professional = {
  id: 'pro-1',
  name: 'יוסי כהן',
  category: 'אינסטלטור',
  rating: 4.8,
  reviewCount: 12,
  startingPrice: 200,
  isAvailable: true,
  isApproved: true,
  isFeatured: false,
  completedJobs: 40,
  location: 'תל אביב',
}

describe('SEO schema builders', () => {
  it('builds WebSite SearchAction to /professionals?q=', () => {
    const schema = buildWebSiteSchema()
    const action = schema.potentialAction as { target: { urlTemplate: string } }
    assert.match(action.target.urlTemplate, /\/professionals\?q=\{search_term_string\}/)
  })

  it('adds AggregateRating when reviews exist', () => {
    const schema = buildProfessionalServiceSchema(samplePro, {
      cityNameHe: 'תל אביב',
      categoryNameHe: 'אינסטלטור',
    })
    assert.equal(schema['@type'], 'ProfessionalService')
    assert.ok(schema.aggregateRating)
  })

  it('omits AggregateRating without reviews', () => {
    const schema = buildProfessionalServiceSchema({
      ...samplePro,
      reviewCount: 0,
    })
    assert.equal(schema.aggregateRating, undefined)
  })

  it('builds ItemList and BreadcrumbList', () => {
    const list = buildProfessionalsItemListSchema([samplePro], {
      name: 'אינסטלטור בתל אביב',
    })
    assert.equal(list['@type'], 'ItemList')
    assert.equal(list.numberOfItems, 1)

    const crumbs = buildBreadcrumbListSchema([
      { name: 'Fixly', path: '/' },
      { name: 'אינסטלטור בתל אביב', path: '/services/tel-aviv/plumbing' },
    ])
    assert.equal(crumbs['@type'], 'BreadcrumbList')
  })
})
