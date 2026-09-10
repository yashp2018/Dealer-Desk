import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ITier extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  multiplier: number
  color: string
}

export interface ITerritory extends Document {
  _id: mongoose.Types.ObjectId
  name: string
}

export interface IVisitType extends Document {
  _id: mongoose.Types.ObjectId
  name: string
}

export interface IDocType extends Document {
  _id: mongoose.Types.ObjectId
  name: string
}

const TierSchema = new Schema<ITier>({ name: { type: String, required: true }, multiplier: { type: Number, required: true }, color: { type: String, default: '#6b7280' } })
const TerritorySchema = new Schema<ITerritory>({ name: { type: String, required: true } })
const VisitTypeSchema = new Schema<IVisitType>({ name: { type: String, required: true } })
const DocTypeSchema = new Schema<IDocType>({ name: { type: String, required: true } })

export const TierModel: Model<ITier> = mongoose.models.Tier ?? mongoose.model<ITier>('Tier', TierSchema)
export const TerritoryModel: Model<ITerritory> = mongoose.models.Territory ?? mongoose.model<ITerritory>('Territory', TerritorySchema)
export const VisitTypeModel: Model<IVisitType> = mongoose.models.VisitType ?? mongoose.model<IVisitType>('VisitType', VisitTypeSchema)
export const DocTypeModel: Model<IDocType> = mongoose.models.DocType ?? mongoose.model<IDocType>('DocType', DocTypeSchema)
