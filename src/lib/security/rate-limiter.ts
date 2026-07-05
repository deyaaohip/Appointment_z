// ═══════════════════════════════════════════════════════════════════
// Rate Limiting - Sliding Window Counter
// ═══════════════════════════════════════════════════════════════════

export const RATE_LIMITS = {
  auth: { windowMs: 900000, maxRequests: 5 },           // 15 min, 5 requests
  api: { windowMs: 60000, maxRequests: 100 },            // 1 min, 100 requests
  fileUpload: { windowMs: 3600000, maxRequests: 20 },    // 1 hour, 20 uploads
  passwordReset: { windowMs: 3600000, maxRequests: 3 },  // 1 hour, 3 attempts
  login: { windowMs: 900000, maxRequests: 10 },          // 15 min, 10 attempts
  webhook: { windowMs: 60000, maxRequests: 50 },         // 1 min, 50 requests
  public: { windowMs: 60000, maxRequests: 200 },         // 1 min, 200 requests
} as const

interface RateLimitEntry {
  count: number
  windowStart: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore) {
    if (now - entry.windowStart > 3600000) { // Remove entries older than 1 hour
      rateLimitStore.delete(key)
    }
  }
}, 300000)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
}

export function checkRateLimit(
  key: string,
  limit: { windowMs: number; maxRequests: number }
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now - entry.windowStart > limit.windowMs) {
    // New window
    rateLimitStore.set(key, { count: 1, windowStart: now })
    return {
      allowed: true,
      remaining: limit.maxRequests - 1,
      resetAt: now + limit.windowMs,
      limit: limit.maxRequests,
    }
  }

  if (entry.count >= limit.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.windowStart + limit.windowMs,
      limit: limit.maxRequests,
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: limit.maxRequests - entry.count,
    resetAt: entry.windowStart + limit.windowMs,
    limit: limit.maxRequests,
  }
}

export function rateLimitMiddleware(
  type: keyof typeof RATE_LIMITS,
  identifier: string
): RateLimitResult {
  const key = `rl:${type}:${identifier}`
  return checkRateLimit(key, RATE_LIMITS[type])
}