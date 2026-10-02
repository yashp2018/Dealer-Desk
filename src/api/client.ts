/**
 * src/api/client.ts
 *
 * Single Axios instance for the entire application.
 *
 * Responsibilities:
 *  - Read base URL from VITE_API_BASE_URL
 *  - Attach Authorization: Bearer <token> to every request
 *  - Attach X-CSRF-Token (read from the csrf_token cookie) to every request —
 *    the server only actually checks it on /auth/refresh and /auth/logout
 *    (the only two routes authenticated purely by cookie), but attaching it
 *    everywhere means no individual api/*.ts file has to remember to do it
 *  - Unwrap { message, data, meta } envelope
 *  - Handle 401 → attempt one token refresh → retry original request
 *  - If refresh fails → clear auth state → redirect to /login
 *  - Never create a second Axios instance
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios'
import { useAuthStore } from '../stores/authStore'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiEnvelope<T = unknown> {
  message: string
  data: T
  meta?: Record<string, unknown>
}

export interface ApiErrorBody {
  message: string
  errors?: Record<string, string[]>
}

// ─── Axios instance ───────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

if (!BASE_URL) {
  console.warn(
    '[DealerDesk] VITE_API_BASE_URL is not set. ' +
      'Copy .env.example → .env and set the value.'
  )
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL ?? '',
  timeout: 15_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// ─── Request interceptor — attach token + CSRF header ─────────────────────────

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!BASE_URL) {
    return Promise.reject(
      new Error('Network error. Please try again.')
    )
  }

  const token = useAuthStore.getState().token
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  const csrfToken = readCookie('csrf_token')
  if (csrfToken && config.headers) {
    config.headers['X-CSRF-Token'] = csrfToken
  }

  return config
})

// ─── Response interceptor — unwrap envelope + handle 401 ─────────────────────

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

function processQueue(token: string) {
  refreshQueue.forEach((cb) => cb(token))
  refreshQueue = []
}

apiClient.interceptors.response.use(
  (response) => {
    // Unwrap the standard { message, data, meta } envelope when present
    const body = response.data as ApiEnvelope | unknown
    if (
      body !== null &&
      typeof body === 'object' &&
      'data' in (body as object)
    ) {
      return (body as ApiEnvelope).data as never
    }
    return response.data
  },
  async (error: AxiosError<ApiErrorBody>) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean
      _skipAuthRefresh?: boolean
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest._skipAuthRefresh
    ) {
      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            if (originalRequest.headers) {
              (originalRequest.headers as Record<string, string>)[
                'Authorization'
              ] = `Bearer ${token}`
            }
            resolve(apiClient(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { refreshToken } = await import('./auth')

        const { token, expires_in } = await refreshToken()
        useAuthStore.getState().setToken(token, expires_in)
        processQueue(token)

        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>)[
            'Authorization'
          ] = `Bearer ${token}`
        }
        return apiClient(originalRequest)
      } catch {
        // Refresh failed — clear auth and redirect
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    // Normalise error message
    const message =
      error.response?.data?.message ??
      error.message ??
      'An unexpected error occurred.'

    return Promise.reject(new Error(message))
  }
)

export default apiClient
