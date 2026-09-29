import { env, isProd } from '../../config/env'
import { logger } from '../../config/logger'

/**
 * Password-reset OTP delivery. There is currently no real email provider
 * wired up (no SMTP/SendGrid/Resend credentials configured anywhere in this
 * project) — OTP_DELIVERY defaults to 'console', which just logs the code
 * instead of emailing it, so the full reset flow is testable end to end
 * before any provider account exists.
 *
 * To go live: set OTP_DELIVERY=email and fill in a real send call below
 * (nodemailer + SMTP creds, or an HTTP call to SendGrid/Resend/etc).
 * Refuses to silently no-op in production with console delivery, since that
 * would mean password resets appear to work but no one ever receives a code.
 */
export async function sendPasswordResetOtp(email: string, otp: string): Promise<void> {
  if (isProd && env.OTP_DELIVERY === 'console') {
    throw new Error(
      'OTP_DELIVERY=console in production — set a real email provider before enabling password reset.',
    )
  }

  if (env.OTP_DELIVERY === 'console') {
    logger.info(`\n\n[DEV ONLY — no email provider configured] Password reset code for ${email}: ${otp}\n`)
    return
  }

  // TODO: wire a real provider here once credentials are available, e.g.:
  //   await transporter.sendMail({ to: email, subject: 'Your Dealer Desk reset code', text: `Code: ${otp}` })
  throw new Error('OTP_DELIVERY=email but no email provider is implemented yet.')
}
