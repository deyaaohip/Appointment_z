// ═══════════════════════════════════════════════════════════════════
// XSS Protection & Input Sanitization
// ═══════════════════════════════════════════════════════════════════

// XSS dangerous patterns
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<\s*script[^>]*>|<\/\s*script>/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /<\s*iframe[^>]*>|<\/\s*iframe>/gi,
  /<\s*object[^>]*>|<\/\s*object>/gi,
  /<\s*embed[^>]*>|<\/\s*embed>/gi,
  /<\s*form[^>]*>|<\/\s*form>/gi,
  /<\s*input[^>]*>/gi,
  /<\s*img[^>]+\bon\w+\s*=[^>]*>/gi,
  /expression\s*\(/gi,
  /url\s*\(\s*["']?\s*javascript/gi,
  /data\s*:\s*text\/html/gi,
]

// SQL Injection patterns
const SQLI_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION|HAVING|GROUP BY|ORDER BY)\b)/gi,
  /(--|;|\/\*|\*\/|xp_|0x)/gi,
  /('\s*(OR|AND)\s+['"]?\d*['"]?\s*=\s*['"]?)/gi,
  /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/gi,
  /('\s*(OR|AND)\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?)/gi,
]

/**
 * Strip all HTML tags from a string
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
  }
  return input.replace(/[&<>"'/]/g, (ch) => map[ch] || ch)
}

/**
 * Detect XSS patterns in input
 */
export function detectXSS(input: string): boolean {
  return XSS_PATTERNS.some(pattern => pattern.test(input))
}

/**
 * Detect SQL Injection patterns in input
 */
export function detectSQLInjection(input: string): boolean {
  // Only check non-natural text patterns
  return SQLI_PATTERNS.some(pattern => pattern.test(input))
}

/**
 * Sanitize a single string input - removes XSS threats
 */
export function sanitizeInput(input: string, options?: { allowHtml?: boolean; maxLength?: number }): string {
  if (!input || typeof input !== 'string') return ''

  let sanitized = input.trim()

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')

  // Remove XSS patterns
  for (const pattern of XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }

  if (!options?.allowHtml) {
    sanitized = stripHtml(sanitized)
  }

  // Limit length
  if (options?.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.slice(0, options.maxLength)
  }

  return sanitized
}

/**
 * Sanitize all string values in an object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T, options?: { allowHtml?: boolean; maxLength?: number }): T {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value, options)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeInput(item, options) :
        typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>, options) : item
      )
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>, options)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized as T
}

/**
 * Sanitize database query parameters
 */
export function sanitizeQuery(params: Record<string, string | number | boolean | undefined>): Record<string, string | number | boolean> {
  const clean: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    if (typeof value === 'string') {
      clean[key] = sanitizeInput(value, { maxLength: 1000 })
    } else {
      clean[key] = value
    }
  }
  return clean
}

/**
 * Escape special regex characters
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}