import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  WAITLIST_PROFESSION_OPTIONS,
  joinWaitlistProfessions,
  parseWaitlistProfessions,
} from '@/lib/waitlist/profession-options'

describe('waitlist profession options', () => {
  it('is sorted Hebrew A→Z', () => {
    const sorted = [...WAITLIST_PROFESSION_OPTIONS].sort((a, b) =>
      a.localeCompare(b, 'he'),
    )
    assert.deepEqual(WAITLIST_PROFESSION_OPTIONS, sorted)
    assert.ok(WAITLIST_PROFESSION_OPTIONS.length >= 40)
  })

  it('includes core Midrag home trades', () => {
    for (const name of [
      'אינסטלטורים',
      'חשמלאים',
      'טכנאי מזגנים',
      'מדבירים',
      'מובילים',
      'שיפוצניקים',
    ]) {
      assert.ok(
        WAITLIST_PROFESSION_OPTIONS.includes(name),
        `missing ${name}`,
      )
    }
  })

  it('joins multi-select into category text', () => {
    const joined = joinWaitlistProfessions([
      'טכנאי מזגנים',
      'חשמלאים',
      'טכנאי מזגנים',
      'לא קיים',
    ])
    assert.equal(joined, 'חשמלאים, טכנאי מזגנים')
    assert.deepEqual(parseWaitlistProfessions(joined), [
      'חשמלאים',
      'טכנאי מזגנים',
    ])
  })

  it('returns null for empty selection', () => {
    assert.equal(joinWaitlistProfessions([]), null)
    assert.equal(joinWaitlistProfessions(undefined), null)
  })
})
