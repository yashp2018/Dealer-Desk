import { randomBytes } from 'crypto'

/**
 * Double-submit CSRF token — a plain random value, not a signed/lookup
 * token. Its security comes entirely from same-origin policy: a cross-site
 * page can't read this cookie's value to echo it back as a header, even
 * though the browser will still attach the cookie itself to same-origin
 * requests. No server-side storage needed.
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex')
}
