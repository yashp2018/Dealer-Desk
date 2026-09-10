import { Request } from 'express'

export interface PageParams {
  page: number
  limit: number
  skip: number
  sortBy?: string
  sortDir: 'asc' | 'desc'
}

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 20

export function parsePagination(req: Request, defaultSortBy?: string): PageParams {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1)
  const rawLimit = parseInt(String(req.query.limit ?? String(DEFAULT_LIMIT)), 10) || DEFAULT_LIMIT
  const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT)
  const sortDir = req.query.sort_dir === 'asc' ? 'asc' : req.query.sort_dir === 'desc' ? 'desc' : 'desc'
  const sortBy = (req.query.sort_by as string | undefined) ?? defaultSortBy

  return { page, limit, skip: (page - 1) * limit, sortBy, sortDir }
}
