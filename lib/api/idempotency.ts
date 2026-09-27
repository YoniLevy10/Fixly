/** Short-lived idempotency cache for POST /api/requests (in-process). */
type Cached = { body: unknown; status: number; expiresAt: number }

const store = new Map<string, Cached>()
const TTL_MS = 60_000
const MAX_KEYS = 500

function prune() {
  const now = Date.now()
  for (const [key, value] of store) {
    if (value.expiresAt <= now) store.delete(key)
  }
  if (store.size <= MAX_KEYS) return
  const overflow = store.size - MAX_KEYS
  let i = 0
  for (const key of store.keys()) {
    store.delete(key)
    if (++i >= overflow) break
  }
}

export function getIdempotentResponse(key: string): Cached | null {
  prune()
  const hit = store.get(key)
  if (!hit) return null
  if (hit.expiresAt <= Date.now()) {
    store.delete(key)
    return null
  }
  return hit
}

export function setIdempotentResponse(
  key: string,
  body: unknown,
  status: number,
): void {
  prune()
  store.set(key, { body, status, expiresAt: Date.now() + TTL_MS })
}
