// ============================================================
// Demo Mode Detection & Demo DB Helper
// ============================================================
// Checks if the real Prisma/SQLite database is available.
// If not (e.g., serverless/preview deployment), provides
// a `isDemoMode` flag and in-memory demo data access.
// ============================================================

let _dbAvailable: boolean | null = null

export async function isDatabaseAvailable(): Promise<boolean> {
  if (_dbAvailable !== null) return _dbAvailable
  try {
    const { db } = await import('./db')
    // Try a simple query
    await db.tenant.count()
    _dbAvailable = true
  } catch {
    _dbAvailable = false
  }
  return _dbAvailable
}

export function isDemoMode(): boolean {
  return _dbAvailable === false
}

// Force demo mode (for testing)
export function forceDemoMode() {
  _dbAvailable = false
}