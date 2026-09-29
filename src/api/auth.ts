import apiClient from './client'
import type { AxiosRequestConfig } from 'axios'
import type { AuthData, LoginPayload } from './types'

export const login = (payload: LoginPayload): Promise<AuthData> =>
  apiClient.post('/auth/login', payload)

export interface GoogleLoginPayload {
  credential: string
  device_id: string
  platform: string
  app_version: string
  os_version: string
}

export const googleLogin = (payload: GoogleLoginPayload): Promise<AuthData> =>
  apiClient.post('/auth/google', payload)

/** dev_otp is only ever present when OTP_DELIVERY=console on the server (no real email provider configured yet) — see server/src/common/utils/mailer.ts. */
export const forgotPassword = (email: string): Promise<{ dev_otp?: string }> =>
  apiClient.post('/auth/forgot-password', { email })

export const resetPassword = (data: { email: string; otp: string; new_password: string }): Promise<void> =>
  apiClient.post('/auth/reset-password', data)

export const refreshToken = (): Promise<{ token: string; expires_in: number }> =>
  apiClient.post('/auth/refresh', undefined, { _skipAuthRefresh: true } as AxiosRequestConfig)

export const logout = (): Promise<void> =>
  apiClient.post('/auth/logout')
