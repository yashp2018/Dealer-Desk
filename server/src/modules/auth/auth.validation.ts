import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required').max(72),
  device_id: z.string().min(1).max(191),
  platform: z.string().min(1).max(191),
  app_version: z.string().min(1).max(191),
  os_version: z.string().min(1).max(191),
})

export const changePasswordSchema = z.object({
  current_password: z.string().min(1).max(72),
  new_password: z.string().min(8, 'New password must be at least 8 characters').max(72, 'New password must be at most 72 characters'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
  new_password: z.string().min(8, 'New password must be at least 8 characters').max(72, 'New password must be at most 72 characters'),
})

export const googleLoginSchema = z.object({
  credential: z.string().min(1),
  device_id: z.string().min(1).max(191),
  platform: z.string().min(1).max(191),
  app_version: z.string().min(1).max(191),
  os_version: z.string().min(1).max(191),
})

export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>
