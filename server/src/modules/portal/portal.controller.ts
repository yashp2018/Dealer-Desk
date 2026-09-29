/**
 * modules/portal/portal.controller.ts
 *
 * The entire dealer-portal API surface. Every handler here reads
 * `req.dealerAuth` (set by requireDealerAuth) and never trusts a
 * client-supplied dealer id — even where a route takes an `:id` in the URL
 * (a specific request), the handler re-verifies that resource belongs to
 * req.dealerAuth.dealerId before returning anything, and returns 404
 * (not 403) on a mismatch so a dealer can't even confirm another dealer's
 * request id exists.
 */
import { Request, Response } from 'express'
import { asyncHandler } from '../../common/utils/asyncHandler'
import { ok, created, paginated } from '../../common/utils/response'
import { parsePagination } from '../../common/utils/pagination'
import { prisma } from '../../config/database'
import { NotFoundError } from '../../common/errors/AppError'
import { dealerService } from '../dealers/dealer.service'
import { requestService } from '../requests/request.service'
import { requestRepository } from '../requests/request.repository'
import { toDealerRequestDto, toDealerTimelineEntries, toRequestLineDto, toRequestDetailsDto } from '../requests/request.mapper'
import { listServices, getService } from '../services/service.service'
import { listProviders, getProvider, getProviderServices } from '../providers/provider.service'
import { authService } from '../auth/auth.service'

function toDealerNotificationDto(n: { id: number; title: string; body: string; message: string; linkUrl: string | null; isRead: boolean; createdAt: Date }) {
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

export const portalController = {
  // ── Profile ──────────────────────────────────────────────────────────────
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await dealerService.getOwnDealer(req.dealerAuth!.dealerId))
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await dealerService.updateOwnProfile(req.dealerAuth!.dealerId, req.body))
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.changePassword(req.dealerAuth!.id, 'dealer', req.body.current_password, req.body.new_password)
    ok(res, null, 'Password updated')
  }),

  logoutAll: asyncHandler(async (req: Request, res: Response) => {
    await authService.logoutAll(req.dealerAuth!.id, 'dealer')
    ok(res, null, 'Logged out from all devices')
  }),

  // ── Requests ─────────────────────────────────────────────────────────────
  // Note: goes straight to requestRepository, not requestService.list() —
  // that method maps through the staff-facing toRequestDto, which is exactly
  // the shape a dealer must never see. toDealerRequestDto needs the raw row.
  listRequests: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req)
    const { requests, total } = await requestRepository.findMany({ skip, take: limit, dealerId: req.dealerAuth!.dealerId })
    paginated(res, requests.map(toDealerRequestDto), { page, limit, total })
  }),

  getRequest: asyncHandler(async (req: Request, res: Response) => {
    const request = await requestRepository.findById(Number(req.params.id))
    if (!request || request.dealerId !== req.dealerAuth!.dealerId) throw new NotFoundError('Request')
    ok(res, toDealerRequestDto(request))
  }),

  getRequestTimeline: asyncHandler(async (req: Request, res: Response) => {
    const request = await requestRepository.findById(Number(req.params.id))
    if (!request || request.dealerId !== req.dealerAuth!.dealerId) throw new NotFoundError('Request')
    const entries = await requestRepository.timeline(request.id)
    ok(res, toDealerTimelineEntries(entries))
  }),

  getRequestDetails: asyncHandler(async (req: Request, res: Response) => {
    const request = await requestRepository.findById(Number(req.params.id))
    if (!request || request.dealerId !== req.dealerAuth!.dealerId) throw new NotFoundError('Request')
    const fields = await requestRepository.fields(request.id)
    ok(res, toRequestDetailsDto(request.id, fields))
  }),

  getRequestLines: asyncHandler(async (req: Request, res: Response) => {
    const request = await requestRepository.findById(Number(req.params.id))
    if (!request || request.dealerId !== req.dealerAuth!.dealerId) throw new NotFoundError('Request')
    const lines = await requestRepository.lines(request.id)
    ok(res, lines.map(toRequestLineDto))
  }),

  createRequest: asyncHandler(async (req: Request, res: Response) => {
    const result = await requestService.createForDealer(req.body, req.dealerAuth!.dealerId)
    created(res, result)
  }),

  // Dealer-safe request type picker for the "New Request" form. Deliberately
  // NOT the /bootstrap payload (staff-only — carries the full staff list and
  // all-dealers picker) and not full RequestType rows (sla_hours/push_target
  // are internal workflow detail a dealer doesn't need to pick a type).
  listRequestTypes: asyncHandler(async (_req: Request, res: Response) => {
    const types = await prisma.requestType.findMany({ include: { fields: true }, orderBy: { id: 'asc' } })
    ok(res, types.map((t) => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      fields: t.fields
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((f) => ({
          key: f.key,
          label: f.label,
          input_type: f.inputType,
          options: f.options as string[],
          is_required: f.isRequired,
          sort_order: f.sortOrder,
          help_text: f.helpText,
        })),
    })))
  }),

  // ── Catalog (read-only) ──────────────────────────────────────────────────
  listServices: asyncHandler(async (req: Request, res: Response) => {
    const result = await listServices({
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      search: req.query.search as string | undefined,
      category: req.query.category ? Number(req.query.category) : undefined,
      status: 'active', // never let a dealer see draft/inactive/archived services
    })
    paginated(res, result.items, { page: result.meta.page, limit: result.meta.limit, total: result.meta.total })
  }),

  getService: asyncHandler(async (req: Request, res: Response) => {
    const service = await getService(Number(req.params.id))
    if (service.status !== 'active') throw new NotFoundError('Service')
    ok(res, service)
  }),

  listProviders: asyncHandler(async (req: Request, res: Response) => {
    const result = await listProviders({
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      search: req.query.search as string | undefined,
      category: req.query.category as string | undefined,
      status: 'active',
    })
    paginated(res, result.items, { page: result.meta.page, limit: result.meta.limit, total: result.meta.total })
  }),

  getProvider: asyncHandler(async (req: Request, res: Response) => {
    const provider = await getProvider(Number(req.params.id))
    if (provider.status !== 'active') throw new NotFoundError('Provider')
    ok(res, provider)
  }),

  getProviderServices: asyncHandler(async (req: Request, res: Response) => {
    const provider = await getProvider(Number(req.params.id))
    if (provider.status !== 'active') throw new NotFoundError('Provider')
    const services = await getProviderServices(Number(req.params.id))
    ok(res, services.filter((s) => s.status === 'active'))
  }),

  // ── Notifications ────────────────────────────────────────────────────────
  listNotifications: asyncHandler(async (req: Request, res: Response) => {
    const notifications = await prisma.notification.findMany({
      where: { dealerId: req.dealerAuth!.dealerId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    ok(res, notifications.map(toDealerNotificationDto))
  }),

  markNotificationRead: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const existing = await prisma.notification.findFirst({ where: { id, dealerId: req.dealerAuth!.dealerId } })
    if (!existing) throw new NotFoundError('Notification')
    const updated = await prisma.notification.update({ where: { id }, data: { isRead: true } })
    ok(res, toDealerNotificationDto(updated))
  }),

  markAllNotificationsRead: asyncHandler(async (req: Request, res: Response) => {
    await prisma.notification.updateMany({ where: { dealerId: req.dealerAuth!.dealerId, isRead: false }, data: { isRead: true } })
    ok(res, null, 'All notifications marked read')
  }),
}
