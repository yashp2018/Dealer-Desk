import mongoose from 'mongoose'
import { DealerModel, DealerContactModel } from '../../models/dealer.model'
import { RequestModel } from '../../models/request.model'
import { VisitModel } from '../../models/visit.model'
import { TimelineEntryModel } from '../../models/timeline.model'

const OPEN_STATUSES_NOT_IN = ['done', 'cancelled']

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id)
}

async function withRequestCounts<T extends { _id: mongoose.Types.ObjectId }>(dealers: T[]) {
  if (dealers.length === 0) return []
  const ids = dealers.map((d) => d._id)
  const now = new Date()

  const [openCounts, overdueCounts] = await Promise.all([
    RequestModel.aggregate([
      { $match: { dealerId: { $in: ids }, status: { $nin: OPEN_STATUSES_NOT_IN } } },
      { $group: { _id: '$dealerId', count: { $sum: 1 } } },
    ]),
    RequestModel.aggregate([
      { $match: { dealerId: { $in: ids }, status: { $nin: OPEN_STATUSES_NOT_IN }, dueAt: { $lt: now } } },
      { $group: { _id: '$dealerId', count: { $sum: 1 } } },
    ]),
  ])

  const openMap = new Map(openCounts.map((c: { _id: mongoose.Types.ObjectId; count: number }) => [String(c._id), c.count]))
  const overdueMap = new Map(overdueCounts.map((c: { _id: mongoose.Types.ObjectId; count: number }) => [String(c._id), c.count]))

  return dealers.map((d) => ({
    ...d,
    _openRequests: openMap.get(String(d._id)) ?? 0,
    _overdueRequests: overdueMap.get(String(d._id)) ?? 0,
  }))
}

export const dealerRepository = {
  async findMany(params: {
    skip: number
    take: number
    q?: string
    territoryId?: string
    tierId?: string
    ownerStaffId?: string
    health?: string
  }) {
    const filter: Record<string, unknown> = {}
    if (params.q) {
      filter.$or = [
        { name: { $regex: params.q, $options: 'i' } },
        { code: { $regex: params.q, $options: 'i' } },
        { city: { $regex: params.q, $options: 'i' } },
      ]
    }
    if (params.territoryId && isValidObjectId(params.territoryId)) filter.territoryId = new mongoose.Types.ObjectId(params.territoryId)
    if (params.tierId && isValidObjectId(params.tierId)) filter.tierId = new mongoose.Types.ObjectId(params.tierId)
    if (params.ownerStaffId && isValidObjectId(params.ownerStaffId)) filter.ownerStaffId = new mongoose.Types.ObjectId(params.ownerStaffId)
    if (params.health) filter.health = params.health

    const [dealers, total] = await Promise.all([
      DealerModel.find(filter)
        .populate('tierId')
        .populate('territoryId')
        .sort({ name: 1 })
        .skip(params.skip)
        .limit(params.take)
        .lean(),
      DealerModel.countDocuments(filter),
    ])

    return { dealers: await withRequestCounts(dealers as (typeof dealers[0] & { _id: mongoose.Types.ObjectId })[]), total }
  },

  async findById(id: string) {
    if (!isValidObjectId(id)) return null
    const dealer = await DealerModel.findById(id).populate('tierId').populate('territoryId').lean()
    if (!dealer) return null
    const [withCounts] = await withRequestCounts([dealer as typeof dealer & { _id: mongoose.Types.ObjectId }])
    return withCounts
  },

  async update(id: string, data: Record<string, unknown>) {
    if (!isValidObjectId(id)) return null
    return DealerModel.findByIdAndUpdate(id, data, { new: true }).populate('tierId').populate('territoryId').lean()
  },

  contacts(dealerId: string) {
    if (!isValidObjectId(dealerId)) return Promise.resolve([])
    return DealerContactModel.find({ dealerId: new mongoose.Types.ObjectId(dealerId), isActive: true })
      .sort({ isPrimary: -1, name: 1 })
      .lean()
  },

  async addContact(dealerId: string, data: { name: string; roleLabel?: string; phone?: string; email?: string; isPrimary?: boolean }) {
    if (!isValidObjectId(dealerId)) throw new Error('Invalid dealerId')
    const did = new mongoose.Types.ObjectId(dealerId)
    if (data.isPrimary) {
      await DealerContactModel.updateMany({ dealerId: did, isPrimary: true }, { isPrimary: false })
    }
    return DealerContactModel.create({
      dealerId: did,
      name: data.name,
      roleLabel: data.roleLabel ?? '',
      phone: data.phone ?? '',
      email: data.email ?? '',
      isPrimary: data.isPrimary ?? false,
    })
  },

  deactivateContact(dealerId: string, contactId: string) {
    if (!isValidObjectId(dealerId) || !isValidObjectId(contactId)) return Promise.resolve(null)
    return DealerContactModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(contactId), dealerId: new mongoose.Types.ObjectId(dealerId) },
      { isActive: false },
    )
  },

  requests(dealerId: string) {
    if (!isValidObjectId(dealerId)) return Promise.resolve([])
    return RequestModel.find({ dealerId: new mongoose.Types.ObjectId(dealerId) })
      .populate('typeId')
      .populate('ownerStaffId')
      .sort({ createdAt: -1 })
      .lean()
  },

  visits(dealerId: string) {
    if (!isValidObjectId(dealerId)) return Promise.resolve([])
    return VisitModel.find({ dealerId: new mongoose.Types.ObjectId(dealerId) })
      .populate('visitTypeId')
      .populate('ownerStaffId')
      .sort({ scheduledAt: -1 })
      .lean()
  },

  timeline(dealerId: string) {
    if (!isValidObjectId(dealerId)) return Promise.resolve([])
    return TimelineEntryModel.find({ entityType: 'dealer', entityId: new mongoose.Types.ObjectId(dealerId) })
      .populate('actorStaffId')
      .sort({ createdAt: -1 })
      .lean()
  },
}
