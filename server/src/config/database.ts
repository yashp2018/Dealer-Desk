import mongoose from 'mongoose'
import { env } from './env'
import { logger } from './logger'

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true)

  mongoose.connection.on('connected', () => logger.info('MongoDB connected'))
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB connection error'))
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'))

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
  })
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect()
  logger.info('MongoDB disconnected gracefully')
}

export function getDbStatus(): 'up' | 'down' {
  return mongoose.connection.readyState === 1 ? 'up' : 'down'
}
