import { Router, Request, Response } from 'express'
import { prisma } from '../../config/database'
import { authenticate } from '../../common/middleware/authenticate'
import { asyncHandler } from '../../common/utils/asyncHandler'
import { ok } from '../../common/utils/response'
import { BadRequestError } from '../../common/errors/AppError'

export const searchRouter = Router()
searchRouter.use(authenticate)

searchRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const q = String(req.query.q ?? '').trim()
    if (q.length < 2) throw new BadRequestError('Query must be at least 2 characters')

    const [dealers, prospects, requests, visits] = await Promise.all([
      prisma.dealer.findMany({ where: { OR: [{ name: { contains: q } }, { code: { contains: q } }] }, take: 8 }),
      prisma.prospect.findMany({ where: { OR: [{ companyName: { contains: q } }, { refNo: { contains: q } }] }, take: 8 }),
      prisma.request.findMany({ where: { OR: [{ title: { contains: q } }, { refNo: { contains: q } }] }, take: 8 }),
      prisma.visit.findMany({ where: { OR: [{ title: { contains: q } }, { refNo: { contains: q } }] }, take: 8 }),
    ])

    ok(res, {
      dealers: dealers.map((d) => ({ id: d.id, label: `${d.code} — ${d.name}`, type: 'dealer' })),
      prospects: prospects.map((p) => ({ id: p.id, label: `${p.refNo} — ${p.companyName}`, type: 'prospect' })),
      requests: requests.map((r) => ({ id: r.id, label: `${r.refNo} — ${r.title}`, type: 'request' })),
      visits: visits.map((v) => ({ id: v.id, label: `${v.refNo} — ${v.title || 'Visit'}`, type: 'visit' })),
    })
  }),
)
