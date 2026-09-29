import { prisma } from '../../config/database'

export async function getStaffPermissions(staffId: number): Promise<string[]> {
  const staffRoles = await prisma.staffRole.findMany({
    where: { staffId },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  })

  const permissionKeys = new Set<string>()
  for (const sr of staffRoles) {
    for (const rp of sr.role.permissions) {
      permissionKeys.add(rp.permission.key)
    }
  }
  return Array.from(permissionKeys)
}

export async function hasAdminRole(staffId: number): Promise<boolean> {
  const adminRole = await prisma.staffRole.findFirst({
    where: { staffId, role: { key: 'admin' } },
  })
  return adminRole !== null
}
