import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import multer from 'multer'
import { NextFunction, Request, Response } from 'express'
import { env } from '../../config/env'
import { BadRequestError } from '../errors/AppError'

export const UPLOAD_ROOT = path.resolve(process.cwd(), env.UPLOAD_DIR)

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])

/** Visit photo attachments live under <UPLOAD_DIR>/visits/<visitId>/. */
export function visitAttachmentDir(visitId: string): string {
  return path.join(UPLOAD_ROOT, 'visits', String(visitId))
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = visitAttachmentDir(req.params.id)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 10)
    cb(null, `${crypto.randomUUID()}${ext}`)
  },
})

const visitPhotoUpload = multer({
  storage,
  limits: { fileSize: env.UPLOAD_MAX_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new BadRequestError('Only JPEG, PNG, WebP or HEIC photos are allowed'))
      return
    }
    cb(null, true)
  },
})

/** multer surfaces its own errors via next(err) with a MulterError, not an AppError — translate the common ones. */
export function handleVisitPhotoUpload(req: Request, res: Response, next: NextFunction): void {
  visitPhotoUpload.single('file')(req, res, (err: unknown) => {
    if (!err) { next(); return }
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      next(new BadRequestError(`Photo exceeds the ${env.UPLOAD_MAX_SIZE_MB}MB limit`))
      return
    }
    next(err)
  })
}

const CSV_MIME_TYPES = new Set(['text/csv', 'application/vnd.ms-excel', 'text/plain', 'application/csv'])
const CSV_MAX_SIZE_MB = 5

// Parsed in memory and discarded once staged as DealerImportCandidate rows —
// never written to disk, unlike the photo upload above.
const dealerImportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CSV_MAX_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const looksLikeCsv = CSV_MIME_TYPES.has(file.mimetype) || file.originalname.toLowerCase().endsWith('.csv')
    if (!looksLikeCsv) {
      cb(new BadRequestError('Only .csv files are accepted'))
      return
    }
    cb(null, true)
  },
})

export function handleDealerImportUpload(req: Request, res: Response, next: NextFunction): void {
  dealerImportUpload.single('file')(req, res, (err: unknown) => {
    if (!err) { next(); return }
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      next(new BadRequestError(`File exceeds the ${CSV_MAX_SIZE_MB}MB limit`))
      return
    }
    next(err)
  })
}
