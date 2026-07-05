// ═══════════════════════════════════════════════════════════════════
// File Upload Validation
// ═══════════════════════════════════════════════════════════════════

export const FILE_RULES = {
  maxFileSize: 5 * 1024 * 1024,  // 5MB
  allowedMimeTypes: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.csv', '.xlsx'],
  maxFileNameLength: 255,
  receiptMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  logoMimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
  avatarMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
} as const

export interface FileValidationResult {
  isValid: boolean
  error?: string
  sanitizedFileName?: string
}

// Dangerous file signatures (magic bytes)
const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.mjs',
  '.php', '.asp', '.aspx', '.jsp', '.cgi', '.pl', '.py',
  '.rb', '.jar', '.war', '.msi', '.scr', '.pif', '.com',
])

export function validateFileUpload(
  file: File,
  context: 'general' | 'receipt' | 'logo' | 'avatar' = 'general'
): FileValidationResult {
  // Check file name
  if (!file.name || file.name.length > FILE_RULES.maxFileNameLength) {
    return { isValid: false, error: 'Invalid file name' }
  }

  // Sanitize file name
  const sanitizedName = sanitizeFileName(file.name)
  const ext = getExtension(sanitizedName).toLowerCase()

  // Check dangerous extensions
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return { isValid: false, error: 'File type not allowed' }
  }

  // Check MIME type
  let allowedMimes = FILE_RULES.allowedMimeTypes
  if (context === 'receipt') allowedMimes = FILE_RULES.receiptMimeTypes
  if (context === 'logo') allowedMimes = FILE_RULES.logoMimeTypes
  if (context === 'avatar') allowedMimes = FILE_RULES.avatarMimeTypes

  if (!allowedMimes.includes(file.type)) {
    return { isValid: false, error: 'File type not supported' }
  }

  // Check extension
  const allowedExts = context === 'receipt'
    ? ['.jpg', '.jpeg', '.png', '.webp', '.pdf']
    : context === 'logo'
    ? ['.jpg', '.jpeg', '.png', '.svg', '.webp']
    : context === 'avatar'
    ? ['.jpg', '.jpeg', '.png', '.webp']
    : FILE_RULES.allowedExtensions

  if (!allowedExts.includes(ext)) {
    return { isValid: false, error: 'File extension not allowed' }
  }

  // Check file size
  if (file.size > FILE_RULES.maxFileSize) {
    const maxMB = FILE_RULES.maxFileSize / (1024 * 1024)
    return { isValid: false, error: `File size must be under ${maxMB}MB` }
  }

  if (file.size === 0) {
    return { isValid: false, error: 'File is empty' }
  }

  return { isValid: true, sanitizedFileName: sanitizedName }
}

function sanitizeFileName(name: string): string {
  // Remove path traversal
  let sanitized = name.replace(/\\/g, '/').split('/').pop() || 'file'
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')
  // Remove special characters except . - _
  sanitized = sanitized.replace(/[^a-zA-Z0-9.\-_\u0600-\u06FF\u4e00-\u9fff]/g, '_')
  // Limit length
  if (sanitized.length > FILE_RULES.maxFileNameLength) {
    const ext = getExtension(sanitized)
    const base = sanitized.slice(0, FILE_RULES.maxFileNameLength - ext.length - 1)
    sanitized = base + ext
  }
  return sanitized
}

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot >= 0 ? filename.slice(lastDot) : ''
}