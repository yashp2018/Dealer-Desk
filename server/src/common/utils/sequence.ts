import { SequenceModel } from '../../models/sequence.model'

export async function nextSequenceValue(name: string): Promise<number> {
  const doc = await SequenceModel.findOneAndUpdate(
    { name },
    { $inc: { value: 1 } },
    { new: true, upsert: true },
  )
  return doc!.value
}

export async function nextRefNo(prefix: string, padLength = 6): Promise<string> {
  const value = await nextSequenceValue(prefix.toLowerCase())
  return `${prefix}-${String(value).padStart(padLength, '0')}`
}
