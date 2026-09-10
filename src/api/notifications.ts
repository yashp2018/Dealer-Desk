import apiClient from './client'
import type { Notification } from './types'
import { mockNotifications } from './mockData'

const MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const state = { items: [...mockNotifications] }

export const getNotifications = (): Promise<Notification[]> =>
  MOCK ? Promise.resolve(state.items as Notification[]) : apiClient.get('/notifications')

export const markNotificationRead = (id: number): Promise<Notification> => {
  if (MOCK) {
    const n = state.items.find((i) => i.id === id)
    if (n) n.is_read = true
    return Promise.resolve(n as Notification)
  }
  return apiClient.post(`/notifications/${id}/read`)
}

export const markAllRead = (): Promise<void> => {
  if (MOCK) {
    state.items.forEach((n) => { n.is_read = true })
    return Promise.resolve()
  }
  return apiClient.post('/notifications/read-all')
}
