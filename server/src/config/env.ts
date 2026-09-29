import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('/api/v1'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  MAX_FAILED_LOGIN_ATTEMPTS: z.coerce.number().int().positive().default(5),
  ACCOUNT_LOCK_MINUTES: z.coerce.number().int().positive().default(15),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  UPLOAD_MAX_SIZE_MB: z.coerce.number().int().positive().default(10),
  UPLOAD_DIR: z.string().default('uploads'),

  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),

  ERP_BASE_URL: z.string().optional().default(''),
  ERP_API_KEY: z.string().optional().default(''),

  // Google Sign-In. Leave unset to keep /auth/google disabled — it returns a
  // clear "not configured" error rather than crashing. Create this in
  // Google Cloud Console > APIs & Services > Credentials > OAuth client ID
  // (type "Web application", authorized JavaScript origin = your frontend URL).
  GOOGLE_CLIENT_ID: z.string().optional().default(''),

  // Password-reset OTP. Dev-mode only — see mailer.ts. A real deployment
  // must set OTP_DELIVERY=email with real SMTP/provider credentials before
  // going live; until then the OTP is only ever printed to the server log.
  OTP_DELIVERY: z.enum(['console', 'email']).default('console'),
  OTP_EXPIRES_MINUTES: z.coerce.number().int().positive().default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),

  // How often the escalation-rule engine sweeps open requests. The first
  // scheduled job in the app — a plain setInterval, no queue infrastructure.
  ESCALATION_JOB_INTERVAL_MINUTES: z.coerce.number().int().positive().default(15),

  VOICE_MAX_SECONDS: z.coerce.number().int().positive().default(120),
  RECENT_DEALERS_COUNT: z.coerce.number().int().positive().default(10),
  SYNC_BATCH_MAX: z.coerce.number().int().positive().default(50),
  REF_BLOCK_SIZE: z.coerce.number().int().positive().default(20),
  SLA_CLOCK: z.string().default('business_hours'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
export const isProd = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'
