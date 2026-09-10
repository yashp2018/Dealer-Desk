import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markNotificationRead } from '../api/notifications'

export function useNotifications() {
  return useQuery({ queryKey: ['notifications'], queryFn: getNotifications, refetchInterval: 60000 })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: markNotificationRead, onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) })
}
