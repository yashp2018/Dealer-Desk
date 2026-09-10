import { StaffRoleModel } from '../../models/role.model'

export async function getStaffPermissions(staffId: string): Promise<string[]> {
  const staffRoles = await StaffRoleModel.find({ staffId })
    .populate({ path: 'roleId', populate: { path: 'permissions' } })
    .lean()

  const permissionKeys = new Set<string>()
  for (const sr of staffRoles) {
    const role = sr.roleId as unknown as { permissions: Array<{ key: string }> }
    if (role?.permissions) {
      for (const p of role.permissions) {
        permissionKeys.add(p.key)
      }
    }
  }
  return Array.from(permissionKeys)
}
