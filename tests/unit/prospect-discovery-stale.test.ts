import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

describe('discovery stale lock helpers', () => {
  it('exports wall-clock and stale lock defaults under Vercel maxDuration', async () => {
    const {
      DISCOVERY_WALL_CLOCK_MS,
      DISCOVERY_STALE_LOCK_MS,
      getDiscoveryWallClockMs,
      getDiscoveryStaleLockMs,
    } = await import('@/lib/prospects/config')
    assert.ok(DISCOVERY_WALL_CLOCK_MS < 300_000)
    assert.ok(DISCOVERY_STALE_LOCK_MS > 300_000)
    assert.equal(getDiscoveryWallClockMs(), DISCOVERY_WALL_CLOCK_MS)
    assert.equal(getDiscoveryStaleLockMs(), DISCOVERY_STALE_LOCK_MS)
  })

  it('releaseStaleDiscoveryRuns marks old running rows failed', async () => {
    const updates: Array<Record<string, unknown>> = []
    const admin = {
      from(table: string) {
        assert.equal(table, 'prospect_discovery_runs')
        return {
          update(payload: Record<string, unknown>) {
            updates.push(payload)
            return {
              eq() {
                return this
              },
              lt() {
                return this
              },
              select() {
                return Promise.resolve({
                  data: [{ id: 'run-1' }],
                  error: null,
                })
              },
            }
          },
        }
      },
    }

    const { releaseStaleDiscoveryRuns } = await import(
      '@/lib/prospects/query-stats-store'
    )
    const n = await releaseStaleDiscoveryRuns(admin as never, 60_000)
    assert.equal(n, 1)
    assert.equal(updates[0]?.status, 'failed')
    assert.match(String(updates[0]?.error_message), /timeout|נקטעה/)
  })

  it('forceUnlockDiscoveryRuns clears every running row', async () => {
    const admin = {
      from() {
        return {
          update(payload: Record<string, unknown>) {
            assert.equal(payload.status, 'failed')
            return {
              eq(_col: string, val: string) {
                assert.equal(val, 'running')
                return this
              },
              select() {
                return Promise.resolve({
                  data: [{ id: 'a' }, { id: 'b' }],
                  error: null,
                })
              },
            }
          },
        }
      },
    }
    const { forceUnlockDiscoveryRuns } = await import(
      '@/lib/prospects/query-stats-store'
    )
    assert.equal(await forceUnlockDiscoveryRuns(admin as never), 2)
  })
})
