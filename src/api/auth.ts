import apiClient from './client'
import type { AxiosRequestConfig } from 'axios'
import type { AuthData, LoginPayload } from './types'
import { mockAuth, MOCK_CREDENTIALS } from './mockData'

const MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const login = (payload: LoginPayload): Promise<AuthData> => {
  if (MOCK) {
    if (payload.email === MOCK_CREDENTIALS.email && payload.password === MOCK_CREDENTIALS.password) {
      return Promise.resolve(mockAuth)
    }
    return Promise.reject(new Error('Invalid email or password'))
  }
  return apiClient.post('/auth/login', payload)
}

export const refreshToken = (): Promise<{ token: string; expires_in: number }> => {
  if (MOCK) return Promise.resolve({ token: mockAuth.token, expires_in: mockAuth.expires_in })
  return apiClient.post('/auth/refresh', undefined, { _skipAuthRefresh: true } as AxiosRequestConfig)
}

export const logout = (): Promise<void> => {
  if (MOCK) return Promise.resolve()
  return apiClient.post('/auth/logout')
}
