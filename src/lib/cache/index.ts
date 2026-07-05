// ═══════════════════════════════════════════════════════════════════
// In-Memory Cache with TTL (Redis-ready interface)
// ═══════════════════════════════════════════════════════════════════

interface CacheEntry<T> {
  value: T
  expiresAt: number
  createdAt: number
}

class CacheStore {
  private store = new Map<string, CacheEntry<unknown>>()
  private defaultTTL: number
  private maxSize: number

  constructor(defaultTTLMs: number = 300000, maxSize: number = 10000) {
    this.defaultTTL = defaultTTLMs
    this.maxSize = maxSize
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 300000)
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store) {
      if (entry.expiresAt < now) {
        this.store.delete(key)
      }
    }
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value as T
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    // Evict oldest if at capacity
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      let oldestKey = ''
      let oldestTime = Infinity
      for (const [k, v] of this.store) {
        if (v.createdAt < oldestTime) {
          oldestTime = v.createdAt
          oldestKey = k
        }
      }
      if (oldestKey) this.store.delete(oldestKey)
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTTL),
      createdAt: Date.now(),
    })
  }

  delete(key: string): boolean {
    return this.store.delete(key)
  }

  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  clear(pattern?: string): void {
    if (!pattern) {
      this.store.clear()
      return
    }
    const regex = new RegExp(pattern)
    for (const key of this.store.keys()) {
      if (regex.test(key)) this.store.delete(key)
    }
  }

  get size(): number {
    return this.store.size
  }

  // Get or set pattern - fetches from fn if not cached
  async getOrSet<T>(key: string, fn: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== undefined) return cached

    const value = await fn()
    this.set(key, value, ttlMs)
    return value
  }

  // Increment a numeric value
  incr(key: string, amount: number = 1): number {
    const current = this.get<number>(key) || 0
    const next = current + amount
    this.set(key, next)
    return next
  }
}

// Cache instances with different TTLs
export const cache = {
  /** Short-lived cache: 1 minute */
  short: new CacheStore(60000, 5000),
  /** Medium-lived cache: 5 minutes */
  medium: new CacheStore(300000, 5000),
  /** Long-lived cache: 1 hour */
  long: new CacheStore(3600000, 2000),
  /** Session cache: 24 hours */
  session: new CacheStore(86400000, 10000),
}

// Cache key builders for consistent naming
export const cacheKeys = {
  dashboard: (tenantId: string, branchId?: string) =>
    `dashboard:${tenantId}:${branchId || 'all'}`,
  bookings: (tenantId: string, page: number, filters?: string) =>
    `bookings:${tenantId}:${page}:${filters || 'none'}`,
  customers: (tenantId: string, page: number, search?: string) =>
    `customers:${tenantId}:${page}:${search || ''}`,
  services: (tenantId: string) => `services:${tenantId}`,
  employees: (tenantId: string, branchId?: string) =>
    `employees:${tenantId}:${branchId || 'all'}`,
  availability: (tenantId: string, employeeId: string, date: string) =>
    `availability:${tenantId}:${employeeId}:${date}`,
  tenant: (tenantId: string) => `tenant:${tenantId}`,
  user: (userId: string) => `user:${userId}`,
  translations: (locale: string) => `translations:${locale}`,
  brand: (tenantId: string) => `brand:${tenantId}`,
}