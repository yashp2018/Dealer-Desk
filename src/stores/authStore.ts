import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Staff } from '../api/types'

interface AuthState {
  token: string | null
  staff: Staff | null
  device_id: string | null
  ref_block: string | null
  login: (token: string, expires_in: number, staff: Staff, ref_block: string, device_id: string) => void
  setToken: (token: string, expires_in: number) => void
  refresh: () => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      staff: null,
      device_id: null,
      ref_block: null,
      login: (token, _expires_in, staff, ref_block, device_id) =>
        set({ token, staff, ref_block, device_id }),
      setToken: (token, _expires_in) => set({ token }),
      refresh: async () => {
        const { refreshToken } = await import('../api/auth')
        const { token } = await refreshToken()
        set({ token })
      },
      logout: () => set({ token: null, staff: null, device_id: null, ref_block: null }),
    }),
    { name: 'dd-auth' }
  )
)
