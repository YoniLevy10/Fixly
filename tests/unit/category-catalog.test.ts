import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeCategorySlug,
  resolveCategoryEmoji,
  resolveCategoryNameHe,
  resolveCategoryNameEn,
} from '../../lib/categories/catalog'
import { getCategoryLabel } from '../../lib/i18n/category-label'

describe('category catalog', () => {
  it('maps english names to slugs', () => {
    assert.equal(normalizeCategorySlug('', 'Furniture'), 'furniture')
    assert.equal(normalizeCategorySlug('', 'Appliance Repair'), 'appliance_repair')
  })

  it('resolves emojis by slug instead of wrench fallback', () => {
    assert.equal(resolveCategoryEmoji('elevators', 'wrench'), '🛗')
    assert.equal(resolveCategoryEmoji('furniture', null), '🛋️')
    assert.equal(resolveCategoryEmoji('glazing', 'wrench'), '🪟')
    assert.equal(resolveCategoryEmoji('unknown_slug', 'wrench'), '🔧')
  })

  it('never returns english for hebrew labels of known categories', () => {
    assert.equal(resolveCategoryNameHe('furniture', null, 'Furniture'), 'ריהוט')
    assert.equal(
      resolveCategoryNameHe('appliance_repair', 'Appliance Repair', 'Appliance Repair'),
      'תיקון מכשירים',
    )
  })

  it('keeps english labels in en locale via i18n', () => {
    assert.equal(getCategoryLabel('en', 'furniture'), 'Furniture')
    assert.equal(getCategoryLabel('he', 'furniture'), 'ריהוט')
    assert.equal(getCategoryLabel('he', 'appliance_repair'), 'תיקון מכשירים')
  })

  it('exposes english catalog names', () => {
    assert.equal(resolveCategoryNameEn('computers'), 'Computers')
  })
})
