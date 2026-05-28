// In-memory sliding-window rate limiter. Per-process state, fine for single-instance dev/prod.
// For multi-instance deployments swap with Redis or @upstash/ratelimit later.

const buckets = new Map()

const sweep = () => {
  const now = Date.now()
  for (const [k, entry] of buckets) {
    if (entry.expiresAt <= now) buckets.delete(k)
  }
}

let sweepTimer = null
const ensureSweep = () => {
  if (sweepTimer) return
  sweepTimer = setInterval(sweep, 60_000)
  if (typeof sweepTimer.unref === "function") sweepTimer.unref()
}

// check(key, limit, windowMs) → { ok, remaining, retryAfterMs }
// Allows up to `limit` events per `windowMs` per key. Returns ok=false when exhausted.
export const check = (key, limit, windowMs) => {
  ensureSweep()
  const now = Date.now()
  const entry = buckets.get(key)
  if (!entry || entry.expiresAt <= now) {
    buckets.set(key, { count: 1, expiresAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 }
  }
  if (entry.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: entry.expiresAt - now }
  }
  entry.count += 1
  return { ok: true, remaining: limit - entry.count, retryAfterMs: 0 }
}

// Extract client IP from common headers; falls back to a constant when absent.
export const getClientIp = (request) => {
  const xff = request.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  const real = request.headers.get("x-real-ip")
  if (real) return real
  return "unknown"
}
