import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

describe('discovery stale lock helpers', () => {
  it('exports chunk wall-clock under Vercel maxDuration; heartbeat allows leave-screen resume', async () => {
    const {
      DISCOVERY_WALL_CLOCK_MS,
      DISCOVERY_STALE_LOCK_MS,
      DISCOVERY_HEARTBEAT_STALE_MS,
      DISCOVERY_SESSION_MAX_MS,
      DISCOVERY_CHUNK_MAX_JOBS,
      getDiscoveryWallClockMs,
      getDiscoveryStaleLockMs,
      getDiscoveryHeartbeatStaleMs,
      getDiscoverySessionMaxMs,
    } = await import('@/lib/prospects/config')
    assert.ok(DISCOVERY_WALL_CLOCK_MS < 120_000)
    assert.ok(DISCOVERY_SESSION_MAX_MS <= 110_000)
    assert.ok(DISCOVERY_STALE_LOCK_MS >= 300_000)
    // Long enough that leaving the UI does not fail the run before cron resumes.
    assert.ok(DISCOVERY_HEARTBEAT_STALE_MS >= 600_000)
    assert.ok(DISCOVERY_CHUNK_MAX_JOBS >= 10)
    assert.equal(getDiscoveryWallClockMs(), DISCOVERY_WALL_CLOCK_MS)
    assert.equal(getDiscoveryStaleLockMs(), DISCOVERY_STALE_LOCK_MS)
    assert.equal(getDiscoveryHeartbeatStaleMs(), DISCOVERY_HEARTBEAT_STALE_MS)
    assert.equal(getDiscoverySessionMaxMs(), DISCOVERY_SESSION_MAX_MS)
  })

  it('fresh heartbeat keeps multi-chunk runs alive past started_at age', async () => {
    const { isDiscoveryRunStale } = await import(
      '@/lib/prospects/query-stats-store'
    )
    const now = Date.now()
    assert.equal(
      isDiscoveryRunStale(
        {
          started_at: new Date(now - 400_000).toISOString(),
          details: { heartbeatAt: new Date(now - 8_000).toISOString() },
        },
        now,
        { maxAgeMs: 360_000, heartbeatStaleMs: 90_000 },
      ),
      false,
    )
  })

  it('isDiscoveryRunStale uses heartbeat when present', async () => {
    const { isDiscoveryRunStale } = await import(
      '@/lib/prospects/query-stats-store'
    )
    const now = Date.now()
    assert.equal(
      isDiscoveryRunStale(
        {
          started_at: new Date(now - 60_000).toISOString(),
          details: { heartbeatAt: new Date(now - 5_000).toISOString() },
        },
        now,
        { maxAgeMs: 120_000, heartbeatStaleMs: 90_000 },
      ),
      false,
    )
    assert.equal(
      isDiscoveryRunStale(
        {
          started_at: new Date(now - 60_000).toISOString(),
          details: { heartbeatAt: new Date(now - 95_000).toISOString() },
        },
        now,
        { maxAgeMs: 120_000, heartbeatStaleMs: 90_000 },
      ),
      true,
    )
  })

  it('isDiscoveryRunStale unlocks runs with no heartbeat after grace', async () => {
    const { isDiscoveryRunStale } = await import(
      '@/lib/prospects/query-stats-store'
    )
    const now = Date.now()
    assert.equal(
      isDiscoveryRunStale(
        {
          started_at: new Date(now - 10_000).toISOString(),
          details: {},
        },
        now,
        { maxAgeMs: 120_000, heartbeatStaleMs: 90_000 },
      ),
      false,
    )
    assert.equal(
      isDiscoveryRunStale(
        {
          started_at: new Date(now - 50_000).toISOString(),
          details: {},
        },
        now,
        { maxAgeMs: 120_000, heartbeatStaleMs: 90_000 },
      ),
      true,
    )
  })

  it('releaseStaleDiscoveryRuns marks stale running rows failed', async () => {
    const updates: Array<Record<string, unknown>> = []
    const now = Date.now()
    const admin = {
      from(table: string) {
        assert.equal(table, 'prospect_discovery_runs')
        return {
          select() {
            return {
              eq() {
                return Promise.resolve({
                  data: [
                    {
                      id: 'fresh',
                      started_at: new Date(now - 10_000).toISOString(),
                      details: {
                        heartbeatAt: new Date(now - 3_000).toISOString(),
                      },
                    },
                    {
                      id: 'dead',
                      started_at: new Date(now - 60_000).toISOString(),
                      details: {
                        // Older than DISCOVERY_HEARTBEAT_STALE_MS (20 min)
                        heartbeatAt: new Date(now - 1_300_000).toISOString(),
                      },
                    },
                  ],
                  error: null,
                })
              },
            }
          },
          update(payload: Record<string, unknown>) {
            updates.push(payload)
            return {
              in(col: string, ids: string[]) {
                assert.equal(col, 'id')
                assert.deepEqual(ids, ['dead'])
                return this
              },
              eq() {
                return this
              },
              select() {
                return Promise.resolve({
                  data: [{ id: 'dead' }],
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
    const n = await releaseStaleDiscoveryRuns(admin as never)
    assert.equal(n, 1)
    assert.equal(updates[0]?.status, 'failed')
    assert.match(String(updates[0]?.error_message), /נעילה שוחררה/)
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
