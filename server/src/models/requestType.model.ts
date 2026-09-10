import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IRequestTypeField {
  key: string
  label: string
  inputType: string
  source?: string | null
  options: string[]
  filter?: string | null
  isRequired: boolean
  sortOrder: number
  helpText: string
}

export interface IRequestType extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  slug: string
  icon: string
  color: string
  defaultPriority: number
  slaHours: number
  pushTarget?: string | null
  allowsProspect: boolean
  fields: IRequestTypeField[]
}

const RequestTypeFieldSchema = new Schema<IRequestTypeField>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    inputType: { type: String, required: true },
    source: { type: String, default: null },
    options: [String],
    filter: { type: String, default: null },
    isRequired: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    helpText: { type: String, default: '' },
  },
  { _id: false },
)

const RequestTypeSchema = new Schema<IRequestType>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
  defaultPriority: { type: Number, default: 3 },
  slaHours: { type: Number, default: 72 },
  pushTarget: { type: String, default: null },
  allowsProspect: { type: Boolean, default: false },
  fields: [RequestTypeFieldSchema],
})

export const RequestTypeModel: Model<IRequestType> =
  mongoose.models.RequestType ?? mongoose.model<IRequestType>('RequestType', RequestTypeSchema)
