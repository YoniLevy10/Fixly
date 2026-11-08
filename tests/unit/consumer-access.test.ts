import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { assertConsumerRegionOpen } from '../../lib/regions/consumer-access'

describe('consumer region access', () => {
  it('allows when demo mode is on (investor / local path)', async () => {
    const prevKill = process.env.NEXT_PUBLIC_FF_DEMO_KILL
    const prevDemo = process.env.NEXT_PUBLIC_FF_DEMO_DATA
    delete process.env.NEXT_PUBLIC_FF_DEMO_KILL
    process.env.NEXT_PUBLIC_FF_DEMO_DATA = 'true'
    try {
      const result = await assertConsumerRegionOpen('תל אביב')
      assert.equal(result.allowed, true)
    } finally {
      if (prevKill === undefined) delete process.env.NEXT_PUBLIC_FF_DEMO_KILL
      else process.env.NEXT_PUBLIC_FF_DEMO_KILL = prevKill
      if (prevDemo === undefined) delete process.env.NEXT_PUBLIC_FF_DEMO_DATA
      else process.env.NEXT_PUBLIC_FF_DEMO_DATA = prevDemo
    }
  })

  it('denies empty city when demo is killed', async () => {
    const prev = process.env.NEXT_PUBLIC_FF_DEMO_KILL
    process.env.NEXT_PUBLIC_FF_DEMO_KILL = 'true'
    try {
      const result = await assertConsumerRegionOpen('  ')
      assert.equal(result.allowed, false)
      if (!result.allowed) {
        assert.ok(result.waitlistPath.includes('/waitlist'))
        assert.match(result.error, /עיר|אזור/)
      }
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_FF_DEMO_KILL
      else process.env.NEXT_PUBLIC_FF_DEMO_KILL = prev
    }
  })
})
