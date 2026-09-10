import { Router, Request, Response } from 'express'
import { prisma } from '../../config/database'
import { authenticate } from '../../common/middleware/authenticate'
import { requirePermission } from '../../common/middleware/authorize'
import { asyncHandler } from '../../common/utils/asyncHandler'
import { ok } from '../../common/utils/response'

export const setupRouter = Router()
setupRouter.use(authenticate)

setupRouter.get(
  '/territories',
  asyncHandler(async (_req: Request, res: Response) => ok(res, await prisma.territory.findMany({ orderBy: { id: 'asc' } }))),
)

setupRouter.get(
  '/tiers',
  asyncHandler(async (_req: Request, res: Response) => ok(res, await prisma.tier.findMany({ orderBy: { id: 'asc' } }))),
)

setupRouter.get(
  '/visit-types',
  asyncHandler(async (_req: Request, res: Response) => ok(res, await prisma.visitType.findMany({ orderBy: { id: 'asc' } }))),
)

setupRouter.get(
  '/request-types',
  asyncHandler(async (_req: Request, res: Response) =>
    ok(res, await prisma.requestType.findMany({ include: { fields: true }, orderBy: { id: 'asc' } })),
  ),
)

setupRouter.get(
  '/staff',
  requirePermission('users.view_all'),
  asyncHandler(async (_req: Request, res: Response) =>
    ok(
      res,
      await prisma.staff.findMany({
        select: { id: true, name: true, email: true, isActive: true, createdAt: true, roles: { include: { role: true } } },
        orderBy: { id: 'asc' },
      }),
    ),
  ),
)

setupRouter.get(
  '/roles',
  requirePermission('users.view_all'),
  asyncHandler(async (_req: Request, res: Response) =>
    ok(res, await prisma.role.findMany({ include: { permissions: { include: { permission: true } } }, orderBy: { id: 'asc' } })),
  ),
)
