import { useQuery } from '@tanstack/react-query'
import * as api from '../api/dealers'

export const useDealers = () => useQuery({ queryKey: ['dealers'], queryFn: () => api.getDealers() })
export const useDealer = (id: string) => useQuery({ queryKey: ['dealers', id], queryFn: () => api.getDealer(id), enabled: !!id })
export const useDealerRequests = (id: string) => useQuery({ queryKey: ['dealers', id, 'requests'], queryFn: () => api.getDealerRequests(id), enabled: !!id })
export const useDealerContacts = (id: string) => useQuery({ queryKey: ['dealers', id, 'contacts'], queryFn: () => api.getDealerContacts(id), enabled: !!id })
export const useDealerVisits = (id: string) => useQuery({ queryKey: ['dealers', id, 'visits'], queryFn: () => api.getDealerVisits(id), enabled: !!id })
export const useDealerTimeline = (id: string) => useQuery({ queryKey: ['dealers', id, 'timeline'], queryFn: () => api.getDealerTimeline(id), enabled: !!id })
