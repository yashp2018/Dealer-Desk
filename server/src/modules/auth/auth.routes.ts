import { Router } from 'express'
import { authController } from './auth.controller'
import { authenticate } from '../../common/middleware/authenticate'
import { validate } from '../../common/middleware/validate'
import { authRateLimiter } from '../../common/middleware/rateLimit'
import { changePasswordSchema, loginSchema } from './auth.validation'

export const authRouter = Router()

authRouter.post('/login', authRateLimiter, validate({ body: loginSchema }), authController.login)
authRouter.post('/refresh', authRateLimiter, authController.refresh)
authRouter.post('/logout', authenticate, authController.logout)
authRouter.post('/logout-all', authenticate, authController.logoutAll)
authRouter.get('/me', authenticate, authController.me)
authRouter.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  authController.changePassword,
)
