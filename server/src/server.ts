import { createApp } from './app'
import { env, isTest } from './config/env'
import { logger } from './config/logger'
import { connectDatabase, disconnectDatabase } from './config/database'
import { startEscalationJob, stopEscalationJob } from './jobs/escalationJob'

async function main(): Promise<void> {
  try {
    await connectDatabase()
    logger.info('Database connection established')
  } catch (err) {
    logger.error({ err }, 'Failed to connect to MongoDB — server will start but all DB queries will fail. Check DATABASE_URL in .env')
  }

  if (!isTest) startEscalationJob()

  const app = createApp()
  const server = app.listen(env.PORT, () => {
    logger.info(`Dealer Desk API listening on port ${env.PORT} (${env.NODE_ENV})`)
  })

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down gracefully...`)
    stopEscalationJob()
    server.close(async () => {
      await disconnectDatabase()
      logger.info('Shutdown complete')
      process.exit(0)
    })
    // Force-exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection')
  })
  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception — exiting')
    process.exit(1)
  })
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal startup error:', err)
  process.exit(1)
})
