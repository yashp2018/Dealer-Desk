import { beforeAll, afterAll } from 'vitest'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/config/database'

export const TEST_PASSWORD = 'TestPass123!'
export let testStaffId: number

beforeAll(async () => {
  await prisma.$queryRaw`SELECT 1` // fail fast with a clear error if DATABASE_URL isn't a reachable test DB

  const permission = await prisma.permission.upsert({
    where: { key: 'dealers.view_all' },
    create: { key: 'dealers.view_all', label: 'View all dealers' },
    update: {},
  })
  const role = await prisma.role.upsert({ where: { key: 'test_role' }, create: { key: 'test_role', name: 'Test Role' }, update: {} })
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
    create: { roleId: role.id, permissionId: permission.id },
    update: {},
  })

  const staff = await prisma.staff.upsert({
    where: { email: 'test.user@dealer.com' },
    create: { name: 'Test User', email: 'test.user@dealer.com', passwordHash: await bcrypt.hash(TEST_PASSWORD, 4) },
    update: {},
  })
  testStaffId = staff.id

  await prisma.staffRole.upsert({
    where: { staffId_roleId: { staffId: staff.id, roleId: role.id } },
    create: { staffId: staff.id, roleId: role.id },
    update: {},
  })

  await prisma.tier.upsert({ where: { id: 1 }, create: { id: 1, name: 'Gold', multiplier: 0.8 }, update: {} })
  await prisma.territory.upsert({ where: { id: 1 }, create: { id: 1, name: 'North' }, update: {} })
})

afterAll(async () => {
  await prisma.$disconnect()
})
