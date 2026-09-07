import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

process.env.NEXT_PUBLIC_FF_DEMO_DATA = 'true'

import {
  createRequest,
  getRequestById,
  updateRequestStatus,
  resetRequestStore,
  listRequestsByProfessional,
} from '../../lib/data/request-store'
import {
  createDemoReview,
  listDemoReviewsByProfessional,
  resetDemoReviewStore,
} from '../../lib/data/review-store'
import { DEMO_PROFESSIONAL_ID } from '../../lib/auth/constants'

describe('investor demo full booking', () => {
  beforeEach(() => {
    resetRequestStore()
    resetDemoReviewStore()
  })

  it('creates a single-pro request assigned to demo pro', () => {
    const created = createRequest({
      customerId: 'guest',
      customerName: 'משקיע',
      professionalId: DEMO_PROFESSIONAL_ID,
      professionalName: 'יוסי כהן',
      category: 'אינסטלציה',
      description: 'ברז דולף במטבח לדוגמה',
      location: 'תל אביב',
      destinationLat: 32.08,
      destinationLng: 34.78,
    })
    assert.equal(created.status, 'pending')
    assert.equal(created.professionalId, DEMO_PROFESSIONAL_ID)
    assert.ok(listRequestsByProfessional(DEMO_PROFESSIONAL_ID).some((r) => r.id === created.id))
  })

  it('advances status through the full job lifecycle and enables live tracking', () => {
    const created = createRequest({
      customerId: 'guest',
      customerName: 'משקיע',
      professionalId: DEMO_PROFESSIONAL_ID,
      professionalName: 'יוסי כהן',
      category: 'אינסטלציה',
      description: 'תיקון דחוף',
      destinationLat: 32.08,
      destinationLng: 34.78,
    })

    assert.ok(updateRequestStatus(created.id, 'accepted'))
    const onWay = updateRequestStatus(created.id, 'on_the_way')
    assert.equal(onWay?.liveTrackingActive, true)
    assert.ok(updateRequestStatus(created.id, 'in_progress'))
    const done = updateRequestStatus(created.id, 'completed')
    assert.equal(done?.status, 'completed')
    assert.equal(done?.liveTrackingActive, false)
  })

  it('seeds multi-match candidates and lists invites for the demo pro', () => {
    const created = createRequest({
      customerId: 'guest',
      customerName: 'משקיע',
      professionalName: '',
      category: 'אינסטלציה',
      description: 'בקשה מהירה לדמו',
      matchMode: true,
    })
    assert.equal(created.matchMode, 'multi')
    assert.ok((created.candidates?.length ?? 0) >= 1)
    assert.ok(
      listRequestsByProfessional(DEMO_PROFESSIONAL_ID).some((r) => r.id === created.id),
      'demo pro should see multi-match invites'
    )
  })

  it('stores a demo review after completion', () => {
    const review = createDemoReview({
      requestId: 'req-demo-test',
      professionalId: DEMO_PROFESSIONAL_ID,
      rating: 5,
      text: 'מעולה לדמו',
    })
    assert.equal(review.rating, 5)
    const listed = listDemoReviewsByProfessional(DEMO_PROFESSIONAL_ID)
    assert.ok(listed.some((r) => r.id === review.id))
  })

  it('reads back created request by id', () => {
    const created = createRequest({
      customerId: 'guest',
      customerName: 'משקיע',
      professionalId: DEMO_PROFESSIONAL_ID,
      professionalName: 'יוסי',
      category: 'חשמל',
      description: 'שקע לא עובד',
    })
    assert.equal(getRequestById(created.id)?.description, 'שקע לא עובד')
  })
})
