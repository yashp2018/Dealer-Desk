/**
 * modules/auth/auth.ts
 *
 * Auth module: Staff model + login/refresh/logout service + routes.
 * Matches the frontend AuthData contract: { token, expires_in, staff, ref_block }.
 *
 * Business rules from Dd_base_service.php:
 * - Tokens expire in JWT_EXPIRES_IN seconds (default 604800 = 7 days).
 * - ref_block is a per-session reference prefix for offline ref generation.
 * - Refresh issues a new token from the current valid token (no refresh token needed).
 * - Logout is stateless (JWT) — client discards the token.
 */

import { Router, Request, Response, NextFunction } from 'express'
import mongoose, { Schema, Model, Document } from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import { AppError } from '../../common/errors/AppError'
import { respond } from '../../common/middleware/respond'
import { authenticate, StaffPayload } from '../../common/middleware/authenticate'

// ─── Staff model ──────────────────────────────────────────────────────────────

interface IStaff extends Document {
  name: string
  email: string
  passwordHash: string
  role: 'admin' | 'manager' | 'staff'
  isActive: boolean
}

const StaffSchema = new Schema<IStaff>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'manager', 'staff'], default: 'staff' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const StaffModel: Model<IStaff> =
  mongoose.models.Staff ?? mongoose.model<IStaff>('Staff', StaffSchema)

// ─── Token helpers ────────────────────────────────────────────────────────────

function signToken(payload: StaffPayload): { token: string; expires_in: number } {
  const secret = process.env.JWT_SECRET!
  const expires_in = Number(process.env.JWT_EXPIRES_IN ?? 604800)
  const token = jwt.sign(payload, secret, { expiresIn: expires_in })
  return { token, expires_in }
}

function generateRefBlock(staffId: string): string {
  const ts = Date.now().toString(36).toUpperCase()
  return `${staffId.slice(-4).toUpperCase()}-${ts}`
}

// ─── Route handlers ───────────────────────────────────────────────────────────

async function handleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const mapped: Record<string, string[]> = {}
      for (const e of errors.array()) {
        const field = 'path' in e ? (e.path as string) : 'general'
        mapped[field] = [...(mapped[field] ?? []), e.msg as string]
      }
      return next(AppError.badRequest('Validation failed.', mapped))
    }

    const { email, password } = req.body as { email: string; password: string }

    const staff = await StaffModel.findOne({ email: email.toLowerCase(), isActive: true })
    if (!staff) return next(AppError.unauthorized('Invalid email or password.'))

    const valid = await bcrypt.compare(password, staff.passwordHash)
    if (!valid) return next(AppError.unauthorized('Invalid email or password.'))

    const payload: StaffPayload = {
      id: staff._id.toString(),
      email: staff.email,
      name: staff.name,
      role: staff.role,
    }

    const { token, expires_in } = signToken(payload)
    const ref_block = generateRefBlock(staff._id.toString())

    respond(res, {
      token,
      expires_in,
      staff: { id: staff._id, name: staff.name, email: staff.email },
      ref_block,
    }, 'Login successful.')
  } catch (err) {
    next(err)
  }
}

async function handleRefresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // authenticate middleware already verified the token and set req.staff
    const { token, expires_in } = signToken(req.staff!)
    respond(res, { token, expires_in }, 'Token refreshed.')
  } catch (err) {
    next(err)
  }
}

async function handleLogout(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // JWT is stateless — client discards the token
    respond(res, null, 'Logged out successfully.')
  } catch (err) {
    next(err)
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

const router = Router()

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  handleLogin,
)

router.post('/refresh', authenticate, handleRefresh)
router.post('/logout', authenticate, handleLogout)

export default router
