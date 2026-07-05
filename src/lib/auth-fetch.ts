// ============================================================
// Auth-aware fetch wrapper
// Automatically attaches the JWT token from the app store
// to all API requests.
// ============================================================

export function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Get token from localStorage (set during login)
  const token = typeof window !== 'undefined' ? localStorage.getItem('bf_token') : null

  const headers = new Headers(init?.headers)
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (!headers.has('Content-Type') && !(init?.body instanceof FormData)) {
    // Don't set Content-Type for FormData (browser sets boundary automatically)
    if (typeof init?.body === 'string') {
      headers.set('Content-Type', 'application/json')
    }
  }

  return fetch(input, { ...init, headers })
}