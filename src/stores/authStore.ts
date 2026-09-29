import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Staff } from '../api/types'
import { queryClient } from '../lib/queryClient'

interface AuthState {
  token: string | null
  expiresAt: number | null
  staff: Staff | null
  device_id: string | null
  ref_block: string | null
  login: (token: string, expires_in: number, staff: Staff, ref_block: string, device_id: string) => void
  setToken: (token: string, expires_in: number) => void
  refresh: () => Promise<void>
  logout: () => void
}

let refreshTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Refreshes the access token ~60s before it expires so normal use never hits
 * a reactive 401. Without this, the token silently expires mid-session and
 * whichever request(s) happen to run next all 401 at once (very visible on a
 * page like Calendar, which fires 3 requests in parallel) before client.ts's
 * interceptor recovers them — functionally harmless but alarming in the
 * console. A failed proactive attempt (e.g. refresh token also expired) is
 * swallowed here; the existing reactive 401 → refresh → logout path in
 * api/client.ts still runs on the next real request.
 */
function scheduleProactiveRefresh(expiresAt: number | null) {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
  if (!expiresAt) return

  const delay = Math.max(expiresAt - Date.now() - 60_000, 5_000)
  refreshTimer = setTimeout(() => {
    useAuthStore.getState().refresh().catch(() => {})
  }, delay)
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      expiresAt: null,
      staff: null,
      device_id: null,
      ref_block: null,
      login: (token, expires_in, staff, ref_block, device_id) => {
        const expiresAt = Date.now() + expires_in * 1000
        set({ token, expiresAt, staff, ref_block, device_id })
        scheduleProactiveRefresh(expiresAt)
      },
      setToken: (token, expires_in) => {
        const expiresAt = Date.now() + expires_in * 1000
        set({ token, expiresAt })
        scheduleProactiveRefresh(expiresAt)
      },
      refresh: async () => {
        const { refreshToken } = await import('../api/auth')
        const { token, expires_in } = await refreshToken()
        const expiresAt = Date.now() + expires_in * 1000
        set({ token, expiresAt })
        scheduleProactiveRefresh(expiresAt)
      },
      logout: () => {
        // Every cached query (notifications, dealers, requests, ...) is keyed
        // without a staff id, so it must be dropped here — otherwise the next
        // person to log in on this tab/device can briefly see, or fire
        // mutations against, the previous account's stale cached data (e.g.
        // "mark as read" on a notification id that belongs to someone else).
        queryClient.clear()
        scheduleProactiveRefresh(null)
        set({ token: null, expiresAt: null, staff: null, device_id: null, ref_block: null })
      },
    }),
    {
      name: 'dd-auth',
      onRehydrateStorage: () => (state) => {
        scheduleProactiveRefresh(state?.expiresAt ?? null)
      },
    }
  )
)
