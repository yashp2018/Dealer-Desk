import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/database'
import { authenticate } from '../../common/middleware/authenticate'
import { validate } from '../../common/middleware/validate'
import { asyncHandler } from '../../common/utils/asyncHandler'
import { ok } from '../../common/utils/response'
import { env } from '../../config/env'
import { requestService } from '../requests/request.service'
import { visitService } from '../visits/visit.service'
import { createRequestSchema, noteSchema } from '../requests/request.validation'
import { createVisitSchema, visitOutcomeSchema } from '../visits/visit.validation'

const visitOutcomeMutationSchema = visitOutcomeSchema.extend({ visit_id: z.string().min(1) })
const requestNoteMutationSchema = noteSchema.extend({ request_id: z.string().min(1) })

const mutationSchema = z.object({
  client_uuid: z.string().uuid(),
  op_type: z.enum(['request.create', 'visit.create', 'visit.outcome', 'request.note']),
  payload: z.record(z.unknown()),
})
 
const batchSchema = z.object({
  mutations: z.array(mutationSchema).max(env.SYNC_BATCH_MAX),
})

export const syncRouter = Router()
syncRouter.use(authenticate)
 
syncRouter.post(
  '/batch',
  validate({ body: batchSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const staffId = req.staff!.id
    const results: Array<{ client_uuid: string; status: 'applied' | 'skipped' | 'failed'; error?: string }> = []

    for (const mutation of req.body.mutations as z.infer<typeof mutationSchema>[]) {
      const already = await prisma.syncMutation.findUnique({ where: { clientUuid: mutation.client_uuid } })
      if (already) {
        results.push({ client_uuid: mutation.client_uuid, status: 'skipped' })
        continue
      }

      try {
        let entityId: string | undefined
        if (mutation.op_type === 'request.create') {
          const parsed = createRequestSchema.parse({ ...mutation.payload, client_uuid: mutation.client_uuid })
          const created = await requestService.create(parsed, req.staff!)
          entityId = created.id
        } else if (mutation.op_type === 'visit.create') {
          const parsed = createVisitSchema.parse({ ...mutation.payload, client_uuid: mutation.client_uuid })
          const createdVisit = await visitService.create(parsed, req.staff!)
          entityId = createdVisit.id
        } else if (mutation.op_type === 'visit.outcome') {
          const payload = visitOutcomeMutationSchema.parse(mutation.payload)
          const updated = await visitService.submitOutcome(payload.visit_id, payload, staffId)
          entityId = updated.id
        } else if (mutation.op_type === 'request.note') {
          const payload = requestNoteMutationSchema.parse(mutation.payload)
          await requestService.addNote(payload.request_id, payload.body, staffId)
          entityId = payload.request_id
        }

        await prisma.syncMutation.create({
          data: { clientUuid: mutation.client_uuid, staffId, opType: mutation.op_type, entityType: mutation.op_type.split('.')[0], entityId, status: 'applied' },
        })
        results.push({ client_uuid: mutation.client_uuid, status: 'applied' })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        await prisma.syncMutation.create({
          data: { clientUuid: mutation.client_uuid, staffId, opType: mutation.op_type, entityType: mutation.op_type.split('.')[0], status: 'failed', error: message },
        })
        results.push({ client_uuid: mutation.client_uuid, status: 'failed', error: message })
      }
    }

    ok(res, { synced: results.filter((r) => r.status === 'applied').length, results })
  }),
)

syncRouter.get(
  '/changes',
  asyncHandler(async (req: Request, res: Response) => {
    const since = req.query.since ? new Date(String(req.query.since)) : new Date(0)
    const perms = req.staff!.permissions
    const canViewAllRequests = perms.includes('*') || perms.includes('requests.view_all')
    const canViewAllVisits = perms.includes('*') || perms.includes('visits.view_all')
    const [requests, visits] = await Promise.all([
      prisma.request.findMany({
        where: { updatedAt: { gt: since }, ...(canViewAllRequests ? {} : { ownerStaffId: req.staff!.id }) },
        select: { id: true, updatedAt: true, status: true },
      }),
      prisma.visit.findMany({
        where: { updatedAt: { gt: since }, ...(canViewAllVisits ? {} : { ownerStaffId: req.staff!.id }) },
        select: { id: true, updatedAt: true, status: true },
      }),
    ])
    ok(res, {
      changes: [
        ...requests.map((r) => ({ entity_type: 'request', entity_id: r.id, status: r.status, updated_at: r.updatedAt.toISOString() })),
        ...visits.map((v) => ({ entity_type: 'visit', entity_id: v.id, status: v.status, updated_at: v.updatedAt.toISOString() })),
      ],
      server_time: new Date().toISOString(),
    })
  }),
)
