/**
 * common/sequence/sequence.service.ts
 *
 * Auto-incrementing reference number generator.
 * Mirrors Dd_sequence_service.php: maintains a per-entity counter in
 * MongoDB and returns zero-padded reference strings like REQ-0001,
 * VIS-001, PRV-001, SVC-001.
 *
 * Uses findOneAndUpdate with $inc for atomic, race-condition-safe increments.
 */

import mongoose, { Schema, Document, Model } from 'mongoose'

interface ISequence extends Document {
  entity: string
  seq: number
}

const SequenceSchema = new Schema<ISequence>({
  entity: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
})

const Sequence: Model<ISequence> =
  mongoose.models.Sequence ??
  mongoose.model<ISequence>('Sequence', SequenceSchema)

// ─── Prefix + padding config — mirrors Dd_sequence_service.php ────────────────

const SEQUENCE_CONFIG: Record<string, { prefix: string; pad: number }> = {
  request: { prefix: 'REQ', pad: 4 },
  visit: { prefix: 'VIS', pad: 3 },
  provider: { prefix: 'PRV', pad: 3 },
  service: { prefix: 'SVC', pad: 3 },
  prospect: { prefix: 'PSP', pad: 4 },
}

export async function nextRef(entity: string): Promise<string> {
  const config = SEQUENCE_CONFIG[entity]
  if (!config) throw new Error(`Unknown sequence entity: ${entity}`)

  const doc = await Sequence.findOneAndUpdate(
    { entity },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  )

  const padded = String(doc.seq).padStart(config.pad, '0')
  return `${config.prefix}-${padded}`
}
