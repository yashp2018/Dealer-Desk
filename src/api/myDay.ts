import apiClient from './client'
import type { QueueResponse, Visit, DashboardData } from './types'

export const getMyDay = (): Promise<Visit[]> =>
  apiClient.get('/my-day')

export const getMyWeek = (): Promise<Visit[]> =>
  apiClient.get('/my-week')

export const getQueue = (): Promise<QueueResponse> =>
  apiClient.get('/queue')

export const getDashboard = (): Promise<DashboardData> =>
  apiClient.get('/dashboard')
