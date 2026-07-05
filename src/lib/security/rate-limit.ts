const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
}

const STRICT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 5,
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  if (!entry || now - entry.lastReset > config.windowMs) {
    rateLimitMap.set(identifier, { count: 1, lastReset: now })
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs }
  }

  entry.count++
  const remaining = Math.max(0, config.maxRequests - entry.count)
  const resetAt = entry.lastReset + config.windowMs

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt }
  }

  return { allowed: true, remaining, resetAt }
}

export function authRateLimit(identifier: string) {
  return rateLimit(identifier, STRICT_CONFIG)
}

// Cleanup old entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now - entry.lastReset > DEFAULT_CONFIG.windowMs * 2) {
        rateLimitMap.delete(key)
      }
    }
  }, 10 * 60 * 1000)
}