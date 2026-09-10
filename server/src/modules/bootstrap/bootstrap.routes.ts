import { Router, Request, Response } from 'express'
import { createHash } from 'crypto'
import { authenticate } from '../../common/middleware/authenticate'
import { asyncHandler } from '../../common/utils/asyncHandler'
import { bootstrapService } from './bootstrap.service'

export const bootstrapRouter = Router()

bootstrapRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const payload = await bootstrapService.build()
    const etag = `"${createHash('sha1').update(JSON.stringify(payload)).digest('hex')}"`

    if (req.headers['if-none-match'] === etag) {
      res.status(304).end()
      return
    }

    res.setHeader('ETag', etag)
    // The frontend unwraps `.data` from the envelope, so send bootstrap directly as data.
    res.status(200).json({ message: 'Success', data: payload })
  }),
)
