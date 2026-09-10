import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISequence extends Document {
  name: string
  value: number
}

const SequenceSchema = new Schema<ISequence>({
  name: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 },
})

export const SequenceModel: Model<ISequence> =
  mongoose.models.Sequence ?? mongoose.model<ISequence>('Sequence', SequenceSchema)
