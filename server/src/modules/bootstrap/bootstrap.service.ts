import { prisma } from '../../config/database'
import { env } from '../../config/env'

export const bootstrapService = {
  async build() {
    const [statuses, transitions, tiers, territories, types, visitTypes, docTypes, dealers, staff] =
      await Promise.all([
        prisma.statusConfig.findMany({ where: { entityType: 'request' }, orderBy: { sortOrder: 'asc' } }),
        prisma.statusTransition.findMany({ where: { entityType: 'request' } }),
        prisma.tier.findMany({ orderBy: { id: 'asc' } }),
        prisma.territory.findMany({ orderBy: { id: 'asc' } }),
        prisma.requestType.findMany({ include: { fields: { orderBy: { sortOrder: 'asc' } } }, orderBy: { id: 'asc' } }),
        prisma.visitType.findMany({ orderBy: { id: 'asc' } }),
        prisma.docType.findMany({ orderBy: { id: 'asc' } }),
        prisma.dealer.findMany({
          select: { id: true, code: true, name: true, tierId: true, territoryId: true },
          orderBy: { id: 'asc' },
        }),
        prisma.staff.findMany({ where: { isActive: true }, select: { id: true, name: true, email: true }, orderBy: { id: 'asc' } }),
      ])

    const statusMap: Record<string, string> = {}
    for (const s of statuses) statusMap[s.key] = s.label

    const transitionMap: Record<string, string[]> = {}
    for (const s of statuses) transitionMap[s.key] = []
    for (const t of transitions) {
      transitionMap[t.fromStatus] = transitionMap[t.fromStatus] ?? []
      transitionMap[t.fromStatus].push(t.toStatus)
    }

    return {
      config: {
        voice_max_seconds: env.VOICE_MAX_SECONDS,
        recent_dealers_count: env.RECENT_DEALERS_COUNT,
        sync_batch_max: env.SYNC_BATCH_MAX,
        ref_block_size: env.REF_BLOCK_SIZE,
        sla_clock: env.SLA_CLOCK,
      },
      statuses: statusMap,
      transitions: transitionMap,
      tiers: tiers.map((t) => ({ id: t.id, name: t.name, multiplier: t.multiplier })),
      territories: territories.map((t) => ({ id: t.id, name: t.name })),
      types: types.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        icon: t.icon,
        color: t.color,
        default_priority: t.defaultPriority,
        sla_hours: t.slaHours,
        push_target: t.pushTarget,
        allows_prospect: t.allowsProspect,
        fields: t.fields.map((f) => ({
          key: f.key,
          label: f.label,
          input_type: f.inputType,
          source: f.source,
          options: f.options as string[],
          filter: f.filter,
          is_required: f.isRequired,
          sort_order: f.sortOrder,
          help_text: f.helpText,
        })),
      })),
      visit_types: visitTypes.map((v) => ({ id: v.id, name: v.name })),
      doc_types: docTypes.map((d) => ({ id: d.id, name: d.name })),
      dealers: dealers.map((d) => ({ id: d.id, code: d.code, name: d.name, tier_id: d.tierId, territory_id: d.territoryId })),
      staff,
    }
  },
}
