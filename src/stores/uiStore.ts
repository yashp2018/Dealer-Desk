import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ToastType = 'success' | 'error' | 'info' | 'warning'
export type ViewMode = 'desktop' | 'mobile'
interface Toast { id: number; message: string; type: ToastType }

interface UiState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  darkMode: boolean
  viewMode: ViewMode
  toasts: Toast[]
  globalSearchOpen: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  toggleDarkMode: () => void
  setDarkMode: (v: boolean) => void
  setViewMode: (v: ViewMode) => void
  addToast: (message: string, type?: ToastType) => void
  removeToast: (id: number) => void
  setGlobalSearchOpen: (v: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      darkMode: false,
      toasts: [],
      globalSearchOpen: false,
      viewMode: 'desktop',
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setViewMode: (v) => set({ viewMode: v }),
      toggleDarkMode: () => set((s) => {
        const next = !s.darkMode
        document.documentElement.classList.toggle('dark', next)
        return { darkMode: next }
      }),
      setDarkMode: (v) => {
        document.documentElement.classList.toggle('dark', v)
        set({ darkMode: v })
      },
      addToast: (message, type = 'info') => {
        const id = Date.now()
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
        setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000)
      },
      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      setGlobalSearchOpen: (v) => set({ globalSearchOpen: v }),
    }),
    {
      name: 'dd-ui',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, darkMode: s.darkMode, viewMode: s.viewMode }),
      onRehydrateStorage: () => (state) => {
        if (state?.darkMode) document.documentElement.classList.add('dark')
      },
    }
  )
)
