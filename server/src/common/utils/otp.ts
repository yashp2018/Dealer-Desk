import { randomInt } from 'crypto'
import { createHash } from 'crypto'

/** 6-digit numeric code — easy to type on a phone, ~1M possibilities per attempt window. */
export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex')
}
