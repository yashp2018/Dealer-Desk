/**
 * modules/services/service.validation.ts
 *
 * express-validator rule sets for service endpoints.
 */

import { body, query, param } from 'express-validator'

export const validateCreateService = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('serviceCode')
    .optional()
    .trim()
    .isAlphanumeric()
    .withMessage('Service code must be alphanumeric.'),
  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must be lowercase letters, numbers, and hyphens only.'),
  body('status')
    .optional()
    .isIn(['draft', 'active', 'inactive', 'archived'])
    .withMessage('Invalid status value.'),
  body('pricing.type')
    .optional()
    .isIn(['free', 'fixed', 'range', 'quote'])
    .withMessage('Invalid pricing type.'),
  body('pricing.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Pricing amount must be a positive number.'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean.'),
  body('availability.days')
    .optional()
    .isArray()
    .withMessage('Availability days must be an array.'),
]

export const validateUpdateService = [
  param('id').isMongoId().withMessage('Invalid service ID.'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must be lowercase letters, numbers, and hyphens only.'),
  body('status')
    .optional()
    .isIn(['draft', 'active', 'inactive', 'archived'])
    .withMessage('Invalid status value.'),
  body('pricing.type')
    .optional()
    .isIn(['free', 'fixed', 'range', 'quote'])
    .withMessage('Invalid pricing type.'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean.'),
]

export const validateServiceListQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100.'),
  query('status')
    .optional()
    .isIn(['draft', 'active', 'inactive', 'archived'])
    .withMessage('Invalid status filter.'),
]

export const validateServiceId = [
  param('id').isMongoId().withMessage('Invalid service ID.'),
]
