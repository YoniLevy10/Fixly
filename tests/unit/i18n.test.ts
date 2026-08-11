import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { translate } from '../../lib/i18n/translate'

describe('translate', () => {
  it('resolves English catalog keys', () => {
    assert.equal(translate('en', 'app.name'), 'Fixly')
    assert.equal(translate('en', 'monetization.tierPro'), 'Pro')
    assert.equal(translate('en', 'monetization.upgradeToPro'), 'Upgrade to Pro')
    assert.equal(translate('en', 'errors.somethingWentWrong'), 'Something went wrong')
  })

  it('resolves Hebrew catalog keys', () => {
    assert.equal(translate('he', 'app.name'), 'Fixly')
    assert.equal(translate('he', 'monetization.tierFree'), 'חינם')
    assert.equal(translate('he', 'monetization.manageSubscription'), 'ניהול מנוי')
    assert.equal(translate('he', 'pro.proTier'), 'מנוי')
  })

  it('interpolates variables', () => {
    assert.equal(
      translate('en', 'monetization.freeLeads', { count: 3 }),
      '3 free leads per month',
    )
    assert.match(translate('he', 'monetization.leadCharged', { amount: 15 }), /15/)
  })

  it('falls back to Hebrew then key for missing paths', () => {
    const missing = 'this.key.does.not.exist'
    assert.equal(translate('en', missing), missing)
  })
})
