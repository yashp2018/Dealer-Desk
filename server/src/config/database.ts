import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

export const prisma = new PrismaClient()

let dbConnected = false

export async function connectDatabase(): Promise<void> {
  await prisma.$connect()
  dbConnected = true
  logger.info('MongoDB connected (Prisma)')
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
  dbConnected = false
  logger.info('MongoDB disconnected gracefully')
}

export function getDbStatus(): 'up' | 'down' {
  return dbConnected ? 'up' : 'down'
}
