import apiClient from './client'
import type { Notification } from './types'

export const getNotifications = (): Promise<Notification[]> =>
  apiClient.get('/notifications')

export const markNotificationRead = (id: string): Promise<Notification> =>
  apiClient.post(`/notifications/${id}/read`)

export const markAllRead = (): Promise<void> =>
  apiClient.post('/notifications/read-all')
