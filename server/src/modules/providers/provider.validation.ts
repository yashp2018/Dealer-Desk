/**
 * modules/providers/provider.validation.ts
 */

import { body, query, param } from 'express-validator'

export const validateCreateProvider = [
  body('name').trim().notEmpty().withMessage('Provider name is required.'),
  body('providerCode')
    .optional()
    .trim()
    .isAlphanumeric()
    .withMessage('Provider code must be alphanumeric.'),
  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must be lowercase letters, numbers, and hyphens only.'),
  body('contact.email')
    .optional()
    .isEmail()
    .withMessage('Contact email must be a valid email address.'),
  body('contact.website')
    .optional()
    .isURL()
    .withMessage('Contact website must be a valid URL.'),
  body('verificationStatus')
    .optional()
    .isIn(['pending', 'verified', 'rejected', 'inactive'])
    .withMessage('Invalid verification status.'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive.'),
  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array.'),
]

export const validateUpdateProvider = [
  param('id').isMongoId().withMessage('Invalid provider ID.'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must be lowercase letters, numbers, and hyphens only.'),
  body('contact.email')
    .optional()
    .isEmail()
    .withMessage('Contact email must be a valid email address.'),
  body('verificationStatus')
    .optional()
    .isIn(['pending', 'verified', 'rejected', 'inactive'])
    .withMessage('Invalid verification status.'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive.'),
]

export const validateProviderListQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100.'),
  query('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Invalid status filter.'),
  query('verificationStatus')
    .optional()
    .isIn(['pending', 'verified', 'rejected', 'inactive'])
    .withMessage('Invalid verification status filter.'),
]

export const validateProviderId = [
  param('id').isMongoId().withMessage('Invalid provider ID.'),
]
