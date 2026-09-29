import { Router } from 'express'
import { requireDealerAuth } from '../../common/middleware/dealerAuth'
import { validate } from '../../common/middleware/validate'
import { portalController } from './portal.controller'
import {
  catalogListQuery,
  changePasswordSchema,
  createRequestSchema,
  idParam,
  listRequestsQuery,
  updateOwnProfileSchema,
} from './portal.validation'

/**
 * The entire dealer-portal surface. Every route is gated by
 * requireDealerAuth ONLY — never `authenticate` — so a staff token cannot
 * reach any of these (see requireDealerAuth's `type !== 'dealer'` check),
 * and a dealer token cannot reach anything outside this router (see
 * authenticate's `type !== 'staff'` check on every other module).
 */
export const portalRouter = Router()
portalRouter.use(requireDealerAuth)

// ── Profile ──────────────────────────────────────────────────────────────
portalRouter.get('/me', portalController.getProfile)
portalRouter.patch('/me', validate({ body: updateOwnProfileSchema }), portalController.updateProfile)
portalRouter.post('/change-password', validate({ body: changePasswordSchema }), portalController.changePassword)
portalRouter.post('/logout-all', portalController.logoutAll)

// ── Requests ─────────────────────────────────────────────────────────────
portalRouter.get('/request-types', portalController.listRequestTypes)
portalRouter.get('/requests', validate({ query: listRequestsQuery }), portalController.listRequests)
portalRouter.post('/requests', validate({ body: createRequestSchema }), portalController.createRequest)
portalRouter.get('/requests/:id', validate({ params: idParam }), portalController.getRequest)
portalRouter.get('/requests/:id/timeline', validate({ params: idParam }), portalController.getRequestTimeline)
portalRouter.get('/requests/:id/details', validate({ params: idParam }), portalController.getRequestDetails)
portalRouter.get('/requests/:id/lines', validate({ params: idParam }), portalController.getRequestLines)

// ── Catalog (read-only) ────────────────────────────────────────────────────
portalRouter.get('/services', validate({ query: catalogListQuery }), portalController.listServices)
portalRouter.get('/services/:id', validate({ params: idParam }), portalController.getService)
portalRouter.get('/providers', validate({ query: catalogListQuery }), portalController.listProviders)
portalRouter.get('/providers/:id', validate({ params: idParam }), portalController.getProvider)
portalRouter.get('/providers/:id/services', validate({ params: idParam }), portalController.getProviderServices)

// ── Notifications ────────────────────────────────────────────────────────
portalRouter.get('/notifications', portalController.listNotifications)
portalRouter.post('/notifications/:id/read', validate({ params: idParam }), portalController.markNotificationRead)
portalRouter.post('/notifications/read-all', portalController.markAllNotificationsRead)
