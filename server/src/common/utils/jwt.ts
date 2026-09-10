import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken'
import { randomBytes, createHash } from 'crypto'
import { env } from '../../config/env'

export interface AccessTokenPayload extends JwtPayload {
  sub: string // staff or dealerUser id
  permissions: string[]
  role?: string
  dealerId?: string
}

export function signAccessToken(
  staffId: string,
  permissions: string[],
  extra?: { role?: string; dealerId?: string },
): { token: string; expiresIn: number } {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'] }
  const token = jwt.sign({ sub: String(staffId), permissions, ...extra }, env.JWT_ACCESS_SECRET, options)
  const decoded = jwt.decode(token) as JwtPayload
  const expiresIn = decoded.exp && decoded.iat ? decoded.exp - decoded.iat : 0
  return { token, expiresIn }
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload
}

/** Refresh tokens are opaque random strings; only their SHA-256 hash is stored, never the raw value. */
export function generateRefreshToken(): string {
  return randomBytes(48).toString('hex')
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function refreshExpiryDate(): Date {
  const ms = parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN)
  return new Date(Date.now() + ms)
}

function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim())
  if (!match) return 30 * 24 * 60 * 60 * 1000 // default 30d
  const value = Number(match[1])
  const unit = match[2]
  const unitMs: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }
  return value * unitMs[unit]
}
