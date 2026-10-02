import { QueryClient } from '@tanstack/react-query'

// Single shared instance — imported by App.tsx to back <QueryClientProvider>,
// and by authStore.ts so logout() can clear every cached query. Keeping it in
// its own module (rather than inline in App.tsx) avoids a circular import
// between the store and the app root.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on timeout or 4xx errors — only on network/5xx
        const msg = (error as Error)?.message ?? ''
        if (msg.includes('timeout') || msg.includes('Network Error')) return false
        return failureCount < 1
      },
      staleTime: 30_000,
      gcTime: 5 * 60_000, // 5 minutes
    },
  },
})
