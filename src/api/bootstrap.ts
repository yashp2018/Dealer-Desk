import apiClient from './client'
import type { Bootstrap } from './types'
import { mockBootstrap } from './mockData'

const MOCK = import.meta.env.VITE_USE_MOCK === 'true'
let cachedEtag: string | null = null

export const getBootstrap = async (): Promise<Bootstrap> => {
  if (MOCK) return Promise.resolve(mockBootstrap as Bootstrap)

  const headers: Record<string, string> = {}
  if (cachedEtag) headers['If-None-Match'] = cachedEtag

  const response = await apiClient.get('/bootstrap', {
    headers,
    transformResponse: (data, responseHeaders) => {
      const etag = (responseHeaders as Record<string, string>)?.['etag']
      if (etag) cachedEtag = etag
      try { return JSON.parse(data as string) } catch { return data }
    },
  })
  return response as unknown as Bootstrap
}
