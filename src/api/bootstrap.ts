import apiClient from './client'
import type { Bootstrap } from './types'

let cachedEtag: string | null = null
let cachedBootstrap: Bootstrap | null = null

export const getBootstrap = async (): Promise<Bootstrap> => {
  const headers: Record<string, string> = {}
  if (cachedEtag) headers['If-None-Match'] = cachedEtag

  const response = await apiClient.get('/bootstrap', {
    headers,
    // A 304 has no body and is outside axios's default 200-299 "success"
    // range — without this, it's routed to the error interceptor instead of
    // returning here, and the caller gets nothing back.
    validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
    transformResponse: (data, responseHeaders) => {
      const etag = (responseHeaders as Record<string, string>)?.['etag']
      if (etag) cachedEtag = etag
      if (!data) return null // 304 Not Modified — no body to parse
      try { return JSON.parse(data as string) } catch { return null }
    },
  })

  if (response && typeof response === 'object') {
    cachedBootstrap = response as unknown as Bootstrap
  }
  if (!cachedBootstrap) {
    // Only reachable if the very first call ever made somehow came back
    // empty/malformed — drop the etag so the next attempt asks for a full body.
    cachedEtag = null
    throw new Error('Bootstrap data unavailable')
  }
  return cachedBootstrap
}
