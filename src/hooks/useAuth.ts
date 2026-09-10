import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const { token, staff, login, refresh, logout } = useAuthStore()
  return {
    isAuthenticated: !!token,
    staff,
    role: staff?.role ?? null,
    isAdmin: staff?.role === 'admin',
    isDealer: staff?.role === 'dealer',
    isStaff: staff?.role === 'staff',
    login,
    refresh,
    logout,
  }
}
