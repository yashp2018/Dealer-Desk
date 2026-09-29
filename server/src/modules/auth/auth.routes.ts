import { Router } from 'express'
import { authController } from './auth.controller'
import { authenticate } from '../../common/middleware/authenticate'
import { requireCsrfToken } from '../../common/middleware/csrf'
import { validate } from '../../common/middleware/validate'
import { authRateLimiter } from '../../common/middleware/rateLimit'
import {
  changePasswordSchema,
  forgotPasswordSchema,
  googleLoginSchema,
  loginSchema,
  resetPasswordSchema,
} from './auth.validation'

export const authRouter = Router()

// CSRF audit: /refresh and /logout are the ONLY routes in this entire app
// reachable using nothing but the ambient refresh-token cookie (confirmed by
// grepping for req.cookies usage — everywhere else, including /logout-all
// and every /portal/* route, requires a Bearer access token, which a
// cross-site request cannot forge). Those two get the double-submit CSRF
// check; nothing else needs it.
authRouter.post('/login', authRateLimiter, validate({ body: loginSchema }), authController.login)
authRouter.post('/google', authRateLimiter, validate({ body: googleLoginSchema }), authController.google)
authRouter.post('/forgot-password', authRateLimiter, validate({ body: forgotPasswordSchema }), authController.forgotPassword)
authRouter.post('/reset-password', authRateLimiter, validate({ body: resetPasswordSchema }), authController.resetPassword)
authRouter.post('/refresh', authRateLimiter, requireCsrfToken, authController.refresh)
// No auth middleware: logout only needs the refresh-token cookie, which is
// common to both staff and dealer sessions — gating it behind the staff-only
// `authenticate` would make a dealer portal login unable to log out.
authRouter.post('/logout', requireCsrfToken, authController.logout)
authRouter.post('/logout-all', authenticate, authController.logoutAll)
authRouter.get('/me', authenticate, authController.me)
authRouter.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  authController.changePassword,
)
