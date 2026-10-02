import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { RequestType, RequestTypeField, EscalationRule, Tier, Staff, StaffRole, Role } from '@prisma/client'
import { prisma } from '../../config/database'
import { authenticate } from '../../common/middleware/authenticate'
import { requirePermission } from '../../common/middleware/authorize'
import { validate } from '../../common/middleware/validate'
import { asyncHandler } from '../../common/utils/asyncHandler'
import { ok, created, noContent } from '../../common/utils/response'
import { idParam } from '../../common/validators/common'
import { BadRequestError, NotFoundError, ConflictError } from '../../common/errors/AppError'
import { hashPassword } from '../../common/utils/password'
import { runEscalationCheck } from '../escalations/escalation.service'

function toRequestTypeDto(t: RequestType & { fields: RequestTypeField[] }) {
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    icon: t.icon,
    color: t.color,
    default_priority: t.defaultPriority,
    sla_hours: t.slaHours,
    push_target: t.pushTarget,
    allows_prospect: t.allowsProspect,
    goes_through_production: t.goesThroughProduction,
    question_count: t.fields.length,
  }
}

const requestTypeSchema = z.object({
  name: z.string().min(1).max(191),
  slug: z.string().min(1).max(191).regex(/^[a-z0-9_-]+$/, 'Slug must be lowercase letters, numbers, hyphens or underscores'),
  icon: z.string().min(1).max(191).default('fa-circle'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #0b6272').default('#6366f1'),
  default_priority: z.coerce.number().int().min(1).max(4),
  sla_hours: z.coerce.number().int().positive(),
  push_target: z.string().trim().optional().transform((v) => (v ? v : null)),
  allows_prospect: z.boolean().default(false),
  goes_through_production: z.boolean().default(false),
})

const updateRequestTypeSchema = requestTypeSchema.partial()

function toTierDto(t: Tier) {
  return {
    id: t.id,
    name: t.name,
    rank: t.rank,
    priority_boost: t.priorityBoost,
    multiplier: t.multiplier,
    color: t.color,
  }
}

const tierSchema = z.object({
  name: z.string().min(1).max(191),
  rank: z.coerce.number().int().min(0),
  priority_boost: z.coerce.number().int().min(0).max(3),
  multiplier: z.coerce.number().positive(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #0b6272').default('#6b7280'),
})

const updateTierSchema = tierSchema.partial()

function toStaffAdminDto(s: Staff & { roles: (StaffRole & { role: Role })[] }) {
  return {
    id: s.id,
    name: s.name,
    email: s.email,
    is_active: s.isActive,
    created_at: s.createdAt.toISOString(),
    roles: s.roles.map((r) => ({ id: r.role.id, key: r.role.key, name: r.role.name })),
  }
}

const staffCreateSchema = z.object({
  name: z.string().min(1).max(191),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role_ids: z.array(z.string().min(1)).min(1, 'At least one role is required'),
})

const staffUpdateSchema = z.object({
  name: z.string().min(1).max(191).optional(),
  email: z.string().email().max(191).optional(),
  is_active: z.boolean().optional(),
  role_ids: z.array(z.string().min(1)).min(1, 'At least one role is required').optional(),
})

function toEscalationRuleDto(r: EscalationRule) {
  return {
    id: r.id,
    name: r.name,
    is_active: r.isActive,
    trigger_priority: r.triggerPriority,
    trigger_request_type_id: r.triggerRequestTypeId,
    trigger_hours_overdue: r.triggerHoursOverdue,
    action_type: r.actionType,
    action_target_staff_id: r.actionTargetStaffId,
    action_target_role: r.actionTargetRole,
    escalation_message: r.escalationMessage,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  }
}

const ACTION_TYPES = ['notify_owner', 'notify_role', 'reassign'] as const

// action_type and its matching target are enforced together: reassign needs
// action_target_staff_id, notify_role needs action_target_role. Applied to
// both create (action_type always present) and update (only enforced when
// action_type is actually part of the patch — see escalationRulesRouter
// update handler for the extra check needed when it ISN'T part of the patch
// but would leave a stored record inconsistent).
function withTargetRefinement<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema
    .refine((d) => (d as { action_type?: string }).action_type !== 'reassign' || !!(d as { action_target_staff_id?: string | null }).action_target_staff_id, {
      message: 'action_target_staff_id is required when action_type is "reassign"',
      path: ['action_target_staff_id'],
    })
    .refine((d) => (d as { action_type?: string }).action_type !== 'notify_role' || !!(d as { action_target_role?: string | null }).action_target_role, {
      message: 'action_target_role is required when action_type is "notify_role"',
      path: ['action_target_role'],
    })
}

const escalationRuleBaseSchema = z.object({
  name: z.string().min(1).max(191),
  is_active: z.boolean().default(true),
  trigger_priority: z.coerce.number().int().min(1).max(4).nullable().optional(),
  trigger_request_type_id: z.string().min(1).nullable().optional(),
  trigger_hours_overdue: z.coerce.number().int().min(0).max(8760), // one year — a rule that never fires within a year is a config mistake, not a real SLA
  action_type: z.enum(ACTION_TYPES),
  action_target_staff_id: z.string().min(1).nullable().optional(),
  action_target_role: z.string().min(1).max(191).nullable().optional(),
  escalation_message: z.string().min(1),
})

const escalationRuleSchema = withTargetRefinement(escalationRuleBaseSchema)
const updateEscalationRuleSchema = withTargetRefinement(escalationRuleBaseSchema.partial())

export const setupRouter = Router()
setupRouter.use(authenticate)

setupRouter.get(
  '/territories',
  asyncHandler(async (_req: Request, res: Response) => ok(res, await prisma.territory.findMany({ orderBy: { id: 'asc' } }))),
)

setupRouter.get(
  '/tiers',
  asyncHandler(async (_req: Request, res: Response) => {
    const tiers = await prisma.tier.findMany({ orderBy: { rank: 'asc' } })
    ok(res, tiers.map(toTierDto))
  }),
)

setupRouter.post(
  '/tiers',
  requirePermission('users.manage'),
  validate({ body: tierSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const b = req.body as z.infer<typeof tierSchema>
    const tier = await prisma.tier.create({
      data: { name: b.name, rank: b.rank, priorityBoost: b.priority_boost, multiplier: b.multiplier, color: b.color },
    })
    created(res, toTierDto(tier))
  }),
)

setupRouter.patch(
  '/tiers/:id',
  requirePermission('users.manage'),
  validate({ params: idParam, body: updateTierSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const b = req.body as z.infer<typeof updateTierSchema>
    const tier = await prisma.tier.update({
      where: { id: req.params.id },
      data: {
        ...(b.name !== undefined ? { name: b.name } : {}),
        ...(b.rank !== undefined ? { rank: b.rank } : {}),
        ...(b.priority_boost !== undefined ? { priorityBoost: b.priority_boost } : {}),
        ...(b.multiplier !== undefined ? { multiplier: b.multiplier } : {}),
        ...(b.color !== undefined ? { color: b.color } : {}),
      },
    })
    ok(res, toTierDto(tier))
  }),
)

const visitTypeSchema = z.object({ name: z.string().trim().min(1).max(191) })
const updateVisitTypeSchema = visitTypeSchema.partial()

setupRouter.get(
  '/visit-types',
  asyncHandler(async (_req: Request, res: Response) => ok(res, await prisma.visitType.findMany({ orderBy: { id: 'asc' } }))),
)

setupRouter.post(
  '/visit-types',
  requirePermission('users.manage'),
  validate({ body: visitTypeSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const b = req.body as z.infer<typeof visitTypeSchema>
    const type = await prisma.visitType.create({ data: { name: b.name } })
    created(res, type)
  }),
)

setupRouter.patch(
  '/visit-types/:id',
  requirePermission('users.manage'),
  validate({ params: idParam, body: updateVisitTypeSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const existing = await prisma.visitType.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Visit type')

    const b = req.body as z.infer<typeof updateVisitTypeSchema>
    const type = await prisma.visitType.update({
      where: { id },
      data: { ...(b.name !== undefined ? { name: b.name } : {}) },
    })
    ok(res, type)
  }),
)

setupRouter.delete(
  '/visit-types/:id',
  requirePermission('users.manage'),
  validate({ params: idParam }),
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const existing = await prisma.visitType.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Visit type')

    // Visit.visitTypeId is a required FK with no cascade — check first so the
    // caller gets a clear reason instead of a raw foreign-key error.
    const inUse = await prisma.visit.count({ where: { visitTypeId: id } })
    if (inUse > 0) {
      throw new ConflictError(`Cannot delete — ${inUse} visit${inUse === 1 ? '' : 's'} already use this type`)
    }

    await prisma.visitType.delete({ where: { id } })
    noContent(res)
  }),
)

setupRouter.get(
  '/request-types',
  asyncHandler(async (_req: Request, res: Response) => {
    const types = await prisma.requestType.findMany({ include: { fields: true }, orderBy: { id: 'asc' } })
    ok(res, types.map(toRequestTypeDto))
  }),
)

setupRouter.post(
  '/request-types',
  requirePermission('users.manage'),
  validate({ body: requestTypeSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const b = req.body as z.infer<typeof requestTypeSchema>
    const type = await prisma.requestType.create({
      data: {
        name: b.name,
        slug: b.slug,
        icon: b.icon,
        color: b.color,
        defaultPriority: b.default_priority,
        slaHours: b.sla_hours,
        pushTarget: b.push_target,
        allowsProspect: b.allows_prospect,
        goesThroughProduction: b.goes_through_production,
      },
      include: { fields: true },
    })
    created(res, toRequestTypeDto(type))
  }),
)

setupRouter.patch(
  '/request-types/:id',
  requirePermission('users.manage'),
  validate({ params: idParam, body: updateRequestTypeSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const b = req.body as z.infer<typeof updateRequestTypeSchema>
    const type = await prisma.requestType.update({
      where: { id: req.params.id },
      data: {
        ...(b.name !== undefined ? { name: b.name } : {}),
        ...(b.slug !== undefined ? { slug: b.slug } : {}),
        ...(b.icon !== undefined ? { icon: b.icon } : {}),
        ...(b.color !== undefined ? { color: b.color } : {}),
        ...(b.default_priority !== undefined ? { defaultPriority: b.default_priority } : {}),
        ...(b.sla_hours !== undefined ? { slaHours: b.sla_hours } : {}),
        ...(b.push_target !== undefined ? { pushTarget: b.push_target } : {}),
        ...(b.allows_prospect !== undefined ? { allowsProspect: b.allows_prospect } : {}),
        ...(b.goes_through_production !== undefined ? { goesThroughProduction: b.goes_through_production } : {}),
      },
      include: { fields: true },
    })
    ok(res, toRequestTypeDto(type))
  }),
)

setupRouter.get(
  '/escalation-rules',
  asyncHandler(async (_req: Request, res: Response) => {
    const rules = await prisma.escalationRule.findMany({ orderBy: { id: 'asc' } })
    ok(res, rules.map(toEscalationRuleDto))
  }),
)

setupRouter.get(
  '/escalation-rules/:id',
  validate({ params: idParam }),
  asyncHandler(async (req: Request, res: Response) => {
    const rule = await prisma.escalationRule.findUnique({ where: { id: req.params.id } })
    if (!rule) throw new NotFoundError('Escalation rule')
    ok(res, toEscalationRuleDto(rule))
  }),
)

setupRouter.post(
  '/escalation-rules',
  requirePermission('users.manage'),
  validate({ body: escalationRuleSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const b = req.body as z.infer<typeof escalationRuleSchema>
    const rule = await prisma.escalationRule.create({
      data: {
        name: b.name,
        isActive: b.is_active,
        triggerPriority: b.trigger_priority ?? null,
        triggerRequestTypeId: b.trigger_request_type_id ?? null,
        triggerHoursOverdue: b.trigger_hours_overdue,
        actionType: b.action_type,
        actionTargetStaffId: b.action_target_staff_id ?? null,
        actionTargetRole: b.action_target_role ?? null,
        escalationMessage: b.escalation_message,
      },
    })
    created(res, toEscalationRuleDto(rule))
  }),
)

setupRouter.patch(
  '/escalation-rules/:id',
  requirePermission('users.manage'),
  validate({ params: idParam, body: updateEscalationRuleSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const existing = await prisma.escalationRule.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Escalation rule')

    const b = req.body as z.infer<typeof updateEscalationRuleSchema>

    // The Zod refine above only checks the patch body in isolation — it
    // can't see that e.g. a patch touching only action_target_role would
    // leave a *stored* action_type: 'reassign' rule without a staff target.
    // Re-check against the merged result so that can't happen either.
    const mergedActionType = b.action_type ?? existing.actionType
    const mergedTargetStaffId = b.action_target_staff_id !== undefined ? b.action_target_staff_id : existing.actionTargetStaffId
    const mergedTargetRole = b.action_target_role !== undefined ? b.action_target_role : existing.actionTargetRole
    if (mergedActionType === 'reassign' && !mergedTargetStaffId) {
      throw new BadRequestError('action_target_staff_id is required when action_type is "reassign"')
    }
    if (mergedActionType === 'notify_role' && !mergedTargetRole) {
      throw new BadRequestError('action_target_role is required when action_type is "notify_role"')
    }

    const rule = await prisma.escalationRule.update({
      where: { id },
      data: {
        ...(b.name !== undefined ? { name: b.name } : {}),
        ...(b.is_active !== undefined ? { isActive: b.is_active } : {}),
        ...(b.trigger_priority !== undefined ? { triggerPriority: b.trigger_priority } : {}),
        ...(b.trigger_request_type_id !== undefined ? { triggerRequestTypeId: b.trigger_request_type_id } : {}),
        ...(b.trigger_hours_overdue !== undefined ? { triggerHoursOverdue: b.trigger_hours_overdue } : {}),
        ...(b.action_type !== undefined ? { actionType: b.action_type } : {}),
        ...(b.action_target_staff_id !== undefined ? { actionTargetStaffId: b.action_target_staff_id } : {}),
        ...(b.action_target_role !== undefined ? { actionTargetRole: b.action_target_role } : {}),
        ...(b.escalation_message !== undefined ? { escalationMessage: b.escalation_message } : {}),
      },
    })
    ok(res, toEscalationRuleDto(rule))
  }),
)

setupRouter.post(
  '/escalation-rules/run-now',
  requirePermission('users.manage'),
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await runEscalationCheck()
    ok(res, { requests_checked: result.requestsChecked, rules_fired: result.rulesFired })
  }),
)

setupRouter.get(
  '/staff',
  requirePermission('users.view_all'),
  asyncHandler(async (_req: Request, res: Response) => {
    const staff = await prisma.staff.findMany({
      include: { roles: { include: { role: true } } },
      orderBy: { id: 'asc' },
    })
    ok(res, staff.map(toStaffAdminDto))
  }),
)

setupRouter.post(
  '/staff',
  requirePermission('users.manage'),
  validate({ body: staffCreateSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const b = req.body as z.infer<typeof staffCreateSchema>
    const existing = await prisma.staff.findUnique({ where: { email: b.email } })
    if (existing) throw new ConflictError('An employee with this email already exists')

    const roles = await prisma.role.findMany({ where: { id: { in: b.role_ids } } })
    if (roles.length !== b.role_ids.length) throw new BadRequestError('One or more roles are invalid')

    const passwordHash = await hashPassword(b.password)
    const staff = await prisma.staff.create({
      data: {
        name: b.name,
        email: b.email,
        passwordHash,
        roles: { create: b.role_ids.map((roleId) => ({ roleId })) },
      },
      include: { roles: { include: { role: true } } },
    })
    created(res, toStaffAdminDto(staff))
  }),
)

setupRouter.patch(
  '/staff/:id',
  requirePermission('users.manage'),
  validate({ params: idParam, body: staffUpdateSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const b = req.body as z.infer<typeof staffUpdateSchema>
    const existing = await prisma.staff.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Employee')

    if (b.email && b.email !== existing.email) {
      const emailTaken = await prisma.staff.findUnique({ where: { email: b.email } })
      if (emailTaken) throw new ConflictError('An employee with this email already exists')
    }

    if (b.role_ids) {
      const roles = await prisma.role.findMany({ where: { id: { in: b.role_ids } } })
      if (roles.length !== b.role_ids.length) throw new BadRequestError('One or more roles are invalid')
    }

    const staff = await prisma.$transaction(async (tx) => {
      if (b.role_ids) {
        await tx.staffRole.deleteMany({ where: { staffId: id } })
        await tx.staffRole.createMany({ data: b.role_ids.map((roleId) => ({ staffId: id, roleId })) })
      }
      return tx.staff.update({
        where: { id },
        data: {
          ...(b.name !== undefined ? { name: b.name } : {}),
          ...(b.email !== undefined ? { email: b.email } : {}),
          ...(b.is_active !== undefined ? { isActive: b.is_active } : {}),
        },
        include: { roles: { include: { role: true } } },
      })
    })
    ok(res, toStaffAdminDto(staff))
  }),
)

setupRouter.get(
  '/roles',
  requirePermission('users.view_all'),
  asyncHandler(async (_req: Request, res: Response) =>
    ok(res, await prisma.role.findMany({ include: { permissions: { include: { permission: true } } }, orderBy: { id: 'asc' } })),
  ),
)
