import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEMO_TOUR_STEPS,
  finishInvestorDemoTour,
  getInvestorTourStatusSequence,
} from '../../lib/demo/investor-tour'
import { TOUR_NARRATIVE } from '../../lib/demo/tour-narrative'

describe('investor demo tour', () => {
  it('covers the full status sequence investors need to see', () => {
    assert.deepEqual(getInvestorTourStatusSequence(), [
      'accepted',
      'on_the_way',
      'in_progress',
      'completed',
    ])
  })

  it('defines ordered walkthrough steps including live map', () => {
    const ids = DEMO_TOUR_STEPS.map((s) => s.id)
    assert.ok(ids.includes('create'))
    assert.ok(ids.includes('customer_map'))
    assert.ok(ids.includes('done'))
    assert.equal(ids[0], 'create')
    assert.equal(ids[ids.length - 1], 'done')
  })

  it('keeps narrative beats aligned with tour steps', () => {
    assert.deepEqual(
      TOUR_NARRATIVE.map((b) => b.id),
      DEMO_TOUR_STEPS.map((s) => s.id)
    )
    assert.ok((TOUR_NARRATIVE.find((b) => b.id === 'customer_map')?.dwellMs ?? 0) >= 5000)
  })

  it('hard-exits to Yossi pro dashboard when finishing', () => {
    const roles: string[] = []
    const paths: string[] = []
    finishInvestorDemoTour({
      switchRole: (role) => roles.push(role),
      navigate: (path) => paths.push(path),
    })
    assert.deepEqual(roles, ['professional'])
    assert.equal(paths.length, 1)
    assert.equal(paths[0], '/pro/dashboard')
  })
})
