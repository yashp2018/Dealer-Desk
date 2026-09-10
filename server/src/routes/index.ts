import { Router, Request, Response } from 'express'
import { getDbStatus } from '../config/database'
import { authRouter } from '../modules/auth/auth.routes'
import { bootstrapRouter } from '../modules/bootstrap/bootstrap.routes'
import { dealerRouter } from '../modules/dealers/dealer.routes'
import { prospectRouter } from '../modules/prospects/prospect.routes'
import { requestRouter } from '../modules/requests/request.routes'
import { visitRouter } from '../modules/visits/visit.routes'
import { notificationRouter } from '../modules/notifications/notification.routes'
import { dashboardRouter } from '../modules/dashboard/dashboard.routes'
import { syncRouter } from '../modules/sync/sync.routes'
import { searchRouter } from '../modules/search/search.routes'
import { setupRouter } from '../modules/staff/setup.routes'
import { serviceRouter } from '../modules/services/service.routes'
import { providerRouter } from '../modules/providers/provider.routes'

export const apiRouter = Router()

apiRouter.get('/health', (_req: Request, res: Response) => {
  const dbStatus = getDbStatus()
  res.status(dbStatus === 'up' ? 200 : 503).json({
    status: dbStatus === 'up' ? 'ok' : 'degraded',
    database: dbStatus,
    uptime_seconds: Math.round(process.uptime()),
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

apiRouter.use('/auth', authRouter)
apiRouter.use('/bootstrap', bootstrapRouter)
apiRouter.use('/dealers', dealerRouter)
apiRouter.use('/prospects', prospectRouter)
apiRouter.use('/requests', requestRouter)
apiRouter.use('/visits', visitRouter)
apiRouter.use('/notifications', notificationRouter)
apiRouter.use('/search', searchRouter)
apiRouter.use('/sync', syncRouter)
apiRouter.use('/setup', setupRouter)
apiRouter.use('/services', serviceRouter)
apiRouter.use('/providers', providerRouter)

// My Day / My Week / Queue / Dashboard are top-level in the frontend contract
// (src/api/myDay.ts calls '/my-day', '/queue', '/dashboard' directly), so this
// router is mounted at the API root rather than nested under a prefix.
apiRouter.use('/', dashboardRouter)
