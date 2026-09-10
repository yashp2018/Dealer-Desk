import mongoose from 'mongoose'
import { RequestModel, RequestFieldValueModel, RequestLineModel } from '../../models/request.model'
import { TimelineEntryModel } from '../../models/timeline.model'

const populate = [
  { path: 'typeId' },
  { path: 'ownerStaffId' },
  { path: 'dealerId' },
]

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id)
}

export const requestRepository = {
  async findMany(params: {
    skip: number
    take: number
    q?: string
    status?: string
    priority?: number
    dealerId?: string
    ownerStaffId?: string
    typeId?: string
    startDate?: string
    endDate?: string
  }) {
    const filter: Record<string, unknown> = {}
    if (params.q) filter.$or = [{ title: { $regex: params.q, $options: 'i' } }, { refNo: { $regex: params.q, $options: 'i' } }]
    if (params.status) filter.status = params.status
    if (params.priority) filter.priority = params.priority
    if (params.dealerId && isValidObjectId(params.dealerId)) filter.dealerId = new mongoose.Types.ObjectId(params.dealerId)
    if (params.ownerStaffId && isValidObjectId(params.ownerStaffId)) filter.ownerStaffId = new mongoose.Types.ObjectId(params.ownerStaffId)
    if (params.typeId && isValidObjectId(params.typeId)) filter.typeId = new mongoose.Types.ObjectId(params.typeId)
    if (params.startDate || params.endDate) {
      const dateFilter: Record<string, Date> = {}
      if (params.startDate) dateFilter.$gte = new Date(params.startDate)
      if (params.endDate) dateFilter.$lte = new Date(params.endDate)
      filter.$or = [{ dueAt: dateFilter }, { scheduledAt: dateFilter }]
    }

    const [requests, total] = await Promise.all([
      RequestModel.find(filter).populate(populate).sort({ createdAt: -1 }).skip(params.skip).limit(params.take).lean(),
      RequestModel.countDocuments(filter),
    ])
    return { requests, total }
  },

  findById(id: string) {
    if (!isValidObjectId(id)) return Promise.resolve(null)
    return RequestModel.findById(id).populate(populate).lean()
  },

  findByClientUuid(clientUuid: string) {
    return RequestModel.findOne({ clientUuid }).populate(populate).lean()
  },

  fields(requestId: string) {
    if (!isValidObjectId(requestId)) return Promise.resolve([])
    return RequestFieldValueModel.find({ requestId: new mongoose.Types.ObjectId(requestId) }).lean()
  },

  async upsertFields(requestId: string, fields: Record<string, string>) {
    if (!isValidObjectId(requestId)) return
    const rid = new mongoose.Types.ObjectId(requestId)
    await Promise.all(
      Object.entries(fields).map(([key, value]) =>
        RequestFieldValueModel.findOneAndUpdate(
          { requestId: rid, key },
          { value },
          { upsert: true, new: true },
        ),
      ),
    )
  },

  lines(requestId: string) {
    if (!isValidObjectId(requestId)) return Promise.resolve([])
    return RequestLineModel.find({ requestId: new mongoose.Types.ObjectId(requestId) }).lean()
  },

  timeline(requestId: string) {
    if (!isValidObjectId(requestId)) return Promise.resolve([])
    return TimelineEntryModel.find({ entityType: 'request', entityId: new mongoose.Types.ObjectId(requestId) })
      .populate('actorStaffId')
      .sort({ createdAt: -1 })
      .lean()
  },
}
