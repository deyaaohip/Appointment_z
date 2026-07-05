// In-memory cache with TTL support
interface CacheEntry<T> {
  data: T
  expiry: number
  createdAt: number
}

class CacheManager {
  private cache = new Map<string, CacheEntry<unknown>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttlMs: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
      createdAt: Date.now(),
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }
    return entry.data as T
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  invalidate(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  stats() {
    let valid = 0
    const now = Date.now()
    for (const entry of this.cache.values()) {
      if (now <= entry.expiry) valid++
    }
    return {
      total: this.cache.size,
      valid,
      invalid: this.cache.size - valid,
    }
  }

  // Cleanup expired entries every 5 minutes
  startCleanup(intervalMs: number = 5 * 60 * 1000) {
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiry) {
          this.cache.delete(key)
        }
      }
    }, intervalMs)
  }
}

export const cache = new CacheManager()

// Pre-configured cache instances
export const dashboardCache = {
  key: (tenantId: string) => `dashboard:${tenantId}`,
  ttl: 2 * 60 * 1000, // 2 minutes
}

export const bookingsCache = {
  key: (tenantId: string, page: number) => `bookings:${tenantId}:${page}`,
  ttl: 30 * 1000, // 30 seconds
}

export const servicesCache = {
  key: (tenantId: string) => `services:${tenantId}`,
  ttl: 5 * 60 * 1000,
}

export const customersCache = {
  key: (tenantId: string, page: number) => `customers:${tenantId}:${page}`,
  ttl: 30 * 1000,
}