import { Router, Request, Response } from 'express'
import { prisma } from '../../config/database'
import { authenticate } from '../../common/middleware/authenticate'
import { asyncHandler } from '../../common/utils/asyncHandler'
import { ok } from '../../common/utils/response'
import { NotFoundError } from '../../common/errors/AppError'

function toNotificationDto(n: { id: string; title: string; body: string; message: string; linkUrl: string | null; isRead: boolean; createdAt: Date }) {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    message: n.message,
    link_url: n.linkUrl,
    is_read: n.isRead,
    created_at: n.createdAt.toISOString(),
  }
}

export const notificationRouter = Router()
notificationRouter.use(authenticate)

notificationRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const notifications = await prisma.notification.findMany({
      where: { staffId: req.staff!.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    ok(res, notifications.map(toNotificationDto))
  }),
)

notificationRouter.get(
  '/unread-count',
  asyncHandler(async (req: Request, res: Response) => {
    const count = await prisma.notification.count({ where: { staffId: req.staff!.id, isRead: false } })
    ok(res, { count })
  }),
)

notificationRouter.post(
  '/:id/read',
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const existing = await prisma.notification.findFirst({ where: { id, staffId: req.staff!.id } })
    if (!existing) throw new NotFoundError('Notification')
    const updated = await prisma.notification.update({ where: { id }, data: { isRead: true } })
    ok(res, toNotificationDto(updated))
  }),
)

notificationRouter.post(
  '/read-all',
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.notification.updateMany({ where: { staffId: req.staff!.id, isRead: false }, data: { isRead: true } })
    ok(res, null, 'All notifications marked read')
  }),
)

// PATCH alias — some clients call read-all via PATCH per the enterprise spec.
notificationRouter.patch(
  '/read-all',
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.notification.updateMany({ where: { staffId: req.staff!.id, isRead: false }, data: { isRead: true } })
    ok(res, null, 'All notifications marked read')
  }),
)

notificationRouter.patch(
  '/:id/read',
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const existing = await prisma.notification.findFirst({ where: { id, staffId: req.staff!.id } })
    if (!existing) throw new NotFoundError('Notification')
    const updated = await prisma.notification.update({ where: { id }, data: { isRead: true } })
    ok(res, toNotificationDto(updated))
  }),
)
