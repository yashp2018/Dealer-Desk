/**
 * common/permissions/permissions.service.ts
 *
 * Role-based permission checks.
 * Mirrors Dd_permission_service.php: defines which roles can perform
 * which actions on which resources, and exposes middleware factories
 * for use in route definitions.
 */

import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError'

// ─── Role definitions ─────────────────────────────────────────────────────────

export type Role = 'admin' | 'manager' | 'staff'

export type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage' // admin-only: full control

export type Resource =
  | 'services'
  | 'providers'
  | 'requests'
  | 'visits'
  | 'dealers'
  | 'auth'

// Permission matrix — mirrors Dd_permission_service.php's can() logic
const PERMISSIONS: Record<Role, Record<Resource, Action[]>> = {
  admin: {
    services: ['create', 'read', 'update', 'delete', 'manage'],
    providers: ['create', 'read', 'update', 'delete', 'manage'],
    requests: ['create', 'read', 'update', 'delete', 'manage'],
    visits: ['create', 'read', 'update', 'delete', 'manage'],
    dealers: ['create', 'read', 'update', 'delete', 'manage'],
    auth: ['create', 'read', 'update', 'delete', 'manage'],
  },
  manager: {
    services: ['create', 'read', 'update', 'delete'],
    providers: ['create', 'read', 'update', 'delete'],
    requests: ['create', 'read', 'update', 'delete'],
    visits: ['create', 'read', 'update', 'delete'],
    dealers: ['create', 'read', 'update'],
    auth: ['read'],
  },
  staff: {
    services: ['read'],
    providers: ['read'],
    requests: ['create', 'read', 'update'],
    visits: ['create', 'read', 'update'],
    dealers: ['read'],
    auth: ['read'],
  },
}

// ─── Core check ───────────────────────────────────────────────────────────────

export function can(role: Role, action: Action, resource: Resource): boolean {
  return PERMISSIONS[role]?.[resource]?.includes(action) ?? false
}

// ─── Middleware factory ────────────────────────────────────────────────────────

export function requirePermission(action: Action, resource: Resource) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = (req.staff?.role ?? 'staff') as Role
    if (!can(role, action, resource)) {
      return next(AppError.forbidden(`You do not have permission to ${action} ${resource}.`))
    }
    next()
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = (req.staff?.role ?? 'staff') as Role
    if (!roles.includes(role)) {
      return next(AppError.forbidden('Insufficient role.'))
    }
    next()
  }
}
