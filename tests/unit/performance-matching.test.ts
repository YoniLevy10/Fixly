import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  computePerformanceScore,
  minutesToScore,
  priceFitScore,
  rankCandidates,
  reopenToScore,
  type RankableCandidate,
} from '../../lib/matching/performance-score'
import { matchesAvailability } from '../../lib/matching/availability-match'

describe('performance-score', () => {
  it('scores faster response higher', () => {
    assert.equal(minutesToScore(5, 10, 90), 100)
    assert.ok(minutesToScore(30, 10, 90) < minutesToScore(15, 10, 90))
    assert.equal(minutesToScore(200, 10, 90), 0)
  })

  it('scores price fit around estimate midpoint', () => {
    assert.equal(priceFitScore(250, 250), 100)
    assert.ok(priceFitScore(400, 250) < 100)
    assert.equal(priceFitScore(null, 250), 50)
  })

  it('penalizes reopen rate', () => {
    assert.equal(reopenToScore(0), 100)
    assert.equal(reopenToScore(1), 0)
    assert.equal(reopenToScore(0.5), 50)
  })

  it('computes composite score with cold-start pull to 50', () => {
    const cold = computePerformanceScore({
      acceptRate: 1,
      avgResponseMinutes: 5,
      avgArrivalMinutes: 20,
      priceAccuracyScore: 100,
      closeQualityScore: 100,
      reopenRate: 0,
      starRating: 5,
      jobsCompleted: 0,
    })
    assert.equal(cold.score, 50)

    const warm = computePerformanceScore({
      acceptRate: 1,
      avgResponseMinutes: 5,
      avgArrivalMinutes: 20,
      priceAccuracyScore: 100,
      closeQualityScore: 100,
      reopenRate: 0,
      starRating: 5,
      jobsCompleted: 10,
    })
    assert.ok(warm.score > 85)
  })

  it('ranks by performance then verified then response', () => {
    const candidates: RankableCandidate[] = [
      {
        professionalId: 'a',
        name: 'A',
        rating: 5,
        isVerified: false,
        available: true,
        avgResponseMinutes: 5,
        hourlyPrice: 200,
        performanceScore: 60,
        acceptRate: 0.5,
        city: 'תל אביב',
        categoryId: '1',
      },
      {
        professionalId: 'b',
        name: 'B',
        rating: 4,
        isVerified: true,
        available: true,
        avgResponseMinutes: 20,
        hourlyPrice: 220,
        performanceScore: 90,
        acceptRate: 0.9,
        city: 'תל אביב',
        categoryId: '1',
      },
      {
        professionalId: 'c',
        name: 'C',
        rating: 4.5,
        isVerified: true,
        available: true,
        avgResponseMinutes: 8,
        hourlyPrice: 210,
        performanceScore: 90,
        acceptRate: 0.9,
        city: 'תל אביב',
        categoryId: '1',
      },
    ]
    const ranked = rankCandidates(candidates, { estimateMid: 215 })
    assert.equal(ranked[0].professionalId, 'c')
    assert.equal(ranked[1].professionalId, 'b')
    assert.equal(ranked[2].professionalId, 'a')
  })
})

describe('availability-match', () => {
  it('allows when no preferred slot', () => {
    assert.equal(matchesAvailability([{ day_of_week: 1, start_time: '09:00', end_time: '17:00' }]), true)
  })

  it('allows flexible pros with no rules', () => {
    assert.equal(matchesAvailability([], '2026-09-07', '10:00'), true)
  })

  it('filters by weekday and time window', () => {
    // 2026-09-07 is Monday (1)
    const rules = [{ day_of_week: 1, start_time: '09:00:00', end_time: '12:00:00' }]
    assert.equal(matchesAvailability(rules, '2026-09-07', '10:30'), true)
    assert.equal(matchesAvailability(rules, '2026-09-07', '15:00'), false)
    assert.equal(matchesAvailability(rules, '2026-09-08', '10:30'), false)
  })
})
