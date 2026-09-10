import { Prisma } from '@prisma/client'
import { prisma } from '../../config/database'

type TxClient = Prisma.TransactionClient

async function nextSequenceValue(name: string, tx?: TxClient): Promise<number> {
  const client = tx ?? prisma
  const key = name.toLowerCase()
  const seq = await client.sequence.upsert({
    where: { name: key },
    create: { name: key, value: 1 },
    update: { value: { increment: 1 } },
  })
  return seq.value
}

export async function nextRefNo(prefix: string, tx?: TxClient, padLength = 6): Promise<string> {
  const value = await nextSequenceValue(prefix, tx)
  return `${prefix}-${String(value).padStart(padLength, '0')}`
}
