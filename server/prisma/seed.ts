/**
 * DEVELOPMENT SEED ONLY.
 * Seeds roles/permissions, master data (tiers/territories/request types/etc.),
 * request status workflow, and a single development admin account.
 * Never run this against a production database with these credentials.
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const PERMISSIONS = [
  'dealers.view_own', 'dealers.view_all', 'dealers.edit', 'dealers.delete',
  'prospects.view_own', 'prospects.view_all', 'prospects.create', 'prospects.edit', 'prospects.convert',
  'requests.view_own', 'requests.view_all', 'requests.create', 'requests.edit', 'requests.assign', 'requests.push',
  'visits.view_own', 'visits.view_all', 'visits.create', 'visits.edit',
  'services.view_all', 'services.create', 'services.edit', 'services.delete',
  'providers.view_all', 'providers.create', 'providers.edit', 'providers.delete',
  'users.view_all', 'users.manage',
]

async function main() {
  console.log('Seeding development data...')

  const tierIdByName = (name: string): number => ['Gold', 'Silver', 'Bronze'].indexOf(name) + 1

  // ── Permissions & roles ──────────────────────────────────────────────
  const permissionRecords = await Promise.all(
    PERMISSIONS.map((key) => prisma.permission.upsert({ where: { key }, create: { key, label: key }, update: {} })),
  )

  const adminRole = await prisma.role.upsert({ where: { key: 'admin' }, create: { key: 'admin', name: 'Administrator' }, update: {} })
  const staffRole = await prisma.role.upsert({ where: { key: 'field_staff' }, create: { key: 'field_staff', name: 'Field Staff' }, update: {} })

  await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } })
  await prisma.rolePermission.createMany({
    data: permissionRecords.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
  })

  const ownPermissions = permissionRecords.filter(
    (p) => /view_own|create|edit$/.test(p.key) || /^(services|providers)\.view_all$/.test(p.key),
  )
  await prisma.rolePermission.deleteMany({ where: { roleId: staffRole.id } })
  await prisma.rolePermission.createMany({
    data: ownPermissions.map((p) => ({ roleId: staffRole.id, permissionId: p.id })),
  })

  // ── Admin user (development only — change this password immediately) ─
  const adminPasswordHash = await bcrypt.hash('ChangeMe123!', 12)
  const admin = await prisma.staff.upsert({
    where: { email: 'admin@dealer.com' },
    create: { name: 'Admin User', email: 'admin@dealer.com', passwordHash: adminPasswordHash },
    update: {},
  })
  await prisma.staffRole.upsert({
    where: { staffId_roleId: { staffId: admin.id, roleId: adminRole.id } },
    create: { staffId: admin.id, roleId: adminRole.id },
    update: {},
  })

  const staffMembers = await Promise.all(
    [
      { name: 'Sarah Chen', email: 'sarah@dealer.com' },
      { name: 'James Okafor', email: 'james@dealer.com' },
    ].map(async (s) => {
      const staff = await prisma.staff.upsert({
        where: { email: s.email },
        create: { name: s.name, email: s.email, passwordHash: await bcrypt.hash('ChangeMe123!', 12) },
        update: {},
      })
      await prisma.staffRole.upsert({
        where: { staffId_roleId: { staffId: staff.id, roleId: staffRole.id } },
        create: { staffId: staff.id, roleId: staffRole.id },
        update: {},
      })
      return staff
    }),
  )

  // ── Master data ───────────────────────────────────────────────────────
  const tiers = await Promise.all(
    [
      { name: 'Gold', multiplier: 0.8, color: '#f59e0b' },
      { name: 'Silver', multiplier: 1.0, color: '#6b7280' },
      { name: 'Bronze', multiplier: 1.2, color: '#92400e' },
    ].map((t) => prisma.tier.upsert({ where: { id: tierIdByName(t.name) }, create: t, update: t })),
  )

  const territories = await Promise.all(
    ['North', 'South', 'East', 'West'].map((name, i) =>
      prisma.territory.upsert({ where: { id: i + 1 }, create: { name }, update: { name } }),
    ),
  )

  await Promise.all(
    ['Sales Visit', 'Technical Support', 'Audit'].map((name, i) =>
      prisma.visitType.upsert({ where: { id: i + 1 }, create: { name }, update: { name } }),
    ),
  )

  await Promise.all(
    ['Dealer Agreement', 'Insurance Certificate', 'Business License'].map((name, i) =>
      prisma.docType.upsert({ where: { id: i + 1 }, create: { name }, update: { name } }),
    ),
  )

  const warranty = await prisma.requestType.upsert({
    where: { slug: 'warranty' },
    create: { name: 'Warranty Claim', slug: 'warranty', icon: 'shield', color: '#6366f1', defaultPriority: 2, slaHours: 48, pushTarget: 'estimate' },
    update: {},
  })
  const service = await prisma.requestType.upsert({
    where: { slug: 'service' },
    create: { name: 'Service Request', slug: 'service', icon: 'wrench', color: '#f59e0b', defaultPriority: 3, slaHours: 72 },
    update: {},
  })
  const parts = await prisma.requestType.upsert({
    where: { slug: 'parts' },
    create: { name: 'Parts Order', slug: 'parts', icon: 'package', color: '#10b981', defaultPriority: 3, slaHours: 96, pushTarget: 'estimate' },
    update: {},
  })

  const fieldSpecs: Array<[number, { key: string; label: string; inputType: string; options: string[]; isRequired: boolean; sortOrder: number }]> = [
    [warranty.id, { key: 'vin', label: 'VIN Number', inputType: 'text', options: [], isRequired: true, sortOrder: 1 }],
    [warranty.id, { key: 'mileage', label: 'Mileage', inputType: 'number', options: [], isRequired: true, sortOrder: 2 }],
    [warranty.id, { key: 'fault_desc', label: 'Fault Description', inputType: 'textarea', options: [], isRequired: true, sortOrder: 3 }],
    [warranty.id, { key: 'severity', label: 'Severity', inputType: 'select', options: ['Minor', 'Major', 'Critical'], isRequired: true, sortOrder: 4 }],
    [service.id, { key: 'service_type', label: 'Service Type', inputType: 'select', options: ['Scheduled', 'Unscheduled', 'Emergency'], isRequired: true, sortOrder: 1 }],
    [service.id, { key: 'notes', label: 'Notes', inputType: 'textarea', options: [], isRequired: false, sortOrder: 2 }],
    [parts.id, { key: 'part_number', label: 'Part Number', inputType: 'text', options: [], isRequired: true, sortOrder: 1 }],
    [parts.id, { key: 'quantity', label: 'Quantity', inputType: 'number', options: [], isRequired: true, sortOrder: 2 }],
    [parts.id, { key: 'urgency', label: 'Urgency', inputType: 'select', options: ['Standard', 'Express', 'Critical'], isRequired: true, sortOrder: 3 }],
  ]
  for (const [typeId, field] of fieldSpecs) {
    await prisma.requestTypeField.upsert({
      where: { requestTypeId_key: { requestTypeId: typeId, key: field.key } },
      create: { requestTypeId: typeId, ...field, helpText: '' },
      update: {},
    })
  }

  // ── Request status workflow ──────────────────────────────────────────
  const statuses: Array<[string, string, number]> = [
    ['new', 'New', 1],
    ['in_progress', 'In Progress', 2],
    ['waiting_dealer', 'Waiting on Dealer', 3],
    ['waiting_internal', 'Waiting Internal', 4],
    ['done', 'Done', 5],
    ['cancelled', 'Cancelled', 6],
  ]
  for (const [key, label, sortOrder] of statuses) {
    await prisma.statusConfig.upsert({
      where: { entityType_key: { entityType: 'request', key } },
      create: { entityType: 'request', key, label, sortOrder },
      update: { label, sortOrder },
    })
  }
  const transitions: Array<[string, string]> = [
    ['new', 'in_progress'], ['new', 'cancelled'],
    ['in_progress', 'waiting_dealer'], ['in_progress', 'waiting_internal'], ['in_progress', 'done'], ['in_progress', 'cancelled'],
    ['waiting_dealer', 'in_progress'], ['waiting_dealer', 'cancelled'],
    ['waiting_internal', 'in_progress'], ['waiting_internal', 'cancelled'],
  ]
  for (const [fromStatus, toStatus] of transitions) {
    await prisma.statusTransition.upsert({
      where: { entityType_fromStatus_toStatus: { entityType: 'request', fromStatus, toStatus } },
      create: { entityType: 'request', fromStatus, toStatus },
      update: {},
    })
  }

  // ── Dealers ───────────────────────────────────────────────────────────
  const sampleDealers = [
    { code: 'DLR-001', name: 'AutoPrime Motors', city: 'Mumbai', state: 'Maharashtra', tier: tiers[0], territory: territories[0], owner: admin, health: 'good', healthScore: 90, phone: '+91-9000000001' },
    { code: 'DLR-002', name: 'City EV Hub', city: 'Chennai', state: 'Tamil Nadu', tier: tiers[1], territory: territories[1], owner: staffMembers[1], health: 'warning', healthScore: 60, phone: '+91-9000000002' },
    { code: 'DLR-003', name: 'Green Drive Co.', city: 'Kolkata', state: 'West Bengal', tier: tiers[2], territory: territories[2], owner: admin, health: 'critical', healthScore: 30, phone: '+91-9000000003' },
    { code: 'DLR-004', name: 'Horizon Auto', city: 'Delhi', state: 'Delhi', tier: tiers[0], territory: territories[3], owner: staffMembers[0], health: 'good', healthScore: 85, phone: '+91-9000000004' },
  ]
  const dealers = []
  for (const d of sampleDealers) {
    const dealer = await prisma.dealer.upsert({
      where: { code: d.code },
      create: {
        code: d.code, name: d.name, displayName: d.name,
        tierId: d.tier.id, territoryId: d.territory.id,
        city: d.city, stateNormalized: d.state,
        ownerStaffId: d.owner.id, health: d.health,
        healthScore: d.healthScore, phonePrimary: d.phone, whatsappPhone: d.phone,
        lastContactAt: new Date(),
      },
      update: {},
    })
    dealers.push(dealer)
  }

  // ── Dealer Portal login (development only) ─────────────────────────────
  await prisma.dealerUser.upsert({
    where: { email: 'portal@autoprime.com' },
    create: {
      email: 'portal@autoprime.com',
      passwordHash: await bcrypt.hash('ChangeMe123!', 12),
      dealerId: dealers[0].id,
      name: 'AutoPrime Motors Portal',
    },
    update: {},
  })

  // ── Dealer Contacts ───────────────────────────────────────────────────
  const contactsData = [
    { dealerId: dealers[0].id, name: 'Rajesh Sharma', roleLabel: 'Owner', phone: '+91-9100000001', email: 'rajesh@autoprime.com', isPrimary: true },
    { dealerId: dealers[0].id, name: 'Priya Mehta', roleLabel: 'Service Manager', phone: '+91-9100000002', email: 'priya@autoprime.com', isPrimary: false },
    { dealerId: dealers[1].id, name: 'Arjun Nair', roleLabel: 'Owner', phone: '+91-9100000003', email: 'arjun@cityev.com', isPrimary: true },
    { dealerId: dealers[2].id, name: 'Sunita Das', roleLabel: 'Manager', phone: '+91-9100000004', email: 'sunita@greendrive.com', isPrimary: true },
  ]
  for (const c of contactsData) {
    await prisma.dealerContact.create({ data: c }).catch(() => {})
  }

  // ── Prospects ─────────────────────────────────────────────────────────
  const prospectsData = [
    { refNo: 'PRO-001', companyName: 'Gamma Dealers', contactName: 'Ravi Kumar', email: 'ravi@gammadealers.com', phone: '+91-9200000001', whatsapp: '+91-9200000001', city: 'Pune', stateNormalized: 'Maharashtra', stage: 'contacted', ownerStaffId: admin.id, source: 'referral' },
    { refNo: 'PRO-002', companyName: 'Delta Motors', contactName: 'Sneha Patel', email: 'sneha@deltamotors.com', phone: '+91-9200000002', whatsapp: '+91-9200000002', city: 'Ahmedabad', stateNormalized: 'Gujarat', stage: 'demo_done', ownerStaffId: staffMembers[0].id, source: 'website' },
    { refNo: 'PRO-003', companyName: 'Omega Auto', contactName: 'Vikram Singh', email: 'vikram@omegaauto.com', phone: '+91-9200000003', whatsapp: '+91-9200000003', city: 'Jaipur', stateNormalized: 'Rajasthan', stage: 'new', ownerStaffId: staffMembers[1].id, source: 'cold_call' },
  ]
  const prospects = []
  for (const p of prospectsData) {
    const prospect = await prisma.prospect.upsert({
      where: { refNo: p.refNo },
      create: { ...p, stageChangedAt: new Date() },
      update: {},
    })
    prospects.push(prospect)
  }

  // ── Onboarding Items ──────────────────────────────────────────────────
  await prisma.onboardingItem.createMany({
    data: [
      { prospectId: prospects[0].id, docName: 'Dealer Agreement', isRequired: true, status: 'verified' },
      { prospectId: prospects[0].id, docName: 'Business License', isRequired: true, status: 'received' },
      { prospectId: prospects[1].id, docName: 'Dealer Agreement', isRequired: true, status: 'pending' },
      { prospectId: prospects[1].id, docName: 'Insurance Certificate', isRequired: false, status: 'pending' },
    ],
    skipDuplicates: true,
  })

  // ── Requests ──────────────────────────────────────────────────────────
  const requestsData = [
    { refNo: 'REQ-001', title: 'Warranty claim — engine fault', typeId: warranty.id, status: 'in_progress', priority: 1, dealerId: dealers[0].id, ownerStaffId: admin.id, dueAt: new Date('2025-09-10'), completionRequired: 3, completionDone: 1 },
    { refNo: 'REQ-002', title: 'Scheduled service — 10k km', typeId: service.id, status: 'new', priority: 3, dealerId: dealers[1].id, ownerStaffId: staffMembers[0].id, dueAt: new Date('2025-09-15'), completionRequired: 2, completionDone: 0 },
    { refNo: 'REQ-003', title: 'Parts order — brake pads x10', typeId: parts.id, status: 'waiting_dealer', priority: 2, dealerId: dealers[2].id, ownerStaffId: staffMembers[1].id, dueAt: new Date('2025-09-05'), completionRequired: 1, completionDone: 0 },
    { refNo: 'REQ-004', title: 'Warranty claim — AC compressor', typeId: warranty.id, status: 'done', priority: 2, dealerId: dealers[0].id, ownerStaffId: admin.id, dueAt: new Date('2025-08-30'), completionRequired: 2, completionDone: 2, doneAt: new Date('2025-08-28') },
    { refNo: 'REQ-005', title: 'Parts order — wiper blades x20', typeId: parts.id, status: 'new', priority: 3, dealerId: dealers[3].id, ownerStaffId: staffMembers[0].id, dueAt: new Date('2025-09-20'), completionRequired: 1, completionDone: 0 },
    { refNo: 'REQ-006', title: 'Emergency service — transmission', typeId: service.id, status: 'in_progress', priority: 1, dealerId: dealers[1].id, ownerStaffId: staffMembers[1].id, dueAt: new Date('2025-09-03'), completionRequired: 4, completionDone: 2 },
  ]
  const requests = []
  for (const r of requestsData) {
    const req = await prisma.request.upsert({
      where: { refNo: r.refNo },
      create: r,
      update: {},
    })
    requests.push(req)
  }

  // ── Request Field Values ───────────────────────────────────────────────
  await prisma.requestFieldValue.createMany({
    data: [
      { requestId: requests[0].id, key: 'vin', value: 'MBLHA51BXEM123456' },
      { requestId: requests[0].id, key: 'mileage', value: '45200' },
      { requestId: requests[0].id, key: 'fault_desc', value: 'Engine stalls at idle, check engine light on' },
      { requestId: requests[0].id, key: 'severity', value: 'Major' },
      { requestId: requests[1].id, key: 'service_type', value: 'Scheduled' },
      { requestId: requests[1].id, key: 'notes', value: 'Customer requested oil change and tyre rotation' },
      { requestId: requests[2].id, key: 'part_number', value: 'BP-4521-X' },
      { requestId: requests[2].id, key: 'quantity', value: '10' },
      { requestId: requests[2].id, key: 'urgency', value: 'Express' },
    ],
    skipDuplicates: true,
  })

  // ── Request Lines ─────────────────────────────────────────────────────
  await prisma.requestLine.createMany({
    data: [
      { requestId: requests[2].id, description: 'Brake Pad Set BP-4521-X', qty: 10, unitRate: 850, total: 8500 },
      { requestId: requests[4].id, description: 'Wiper Blade WB-220', qty: 20, unitRate: 250, total: 5000 },
    ],
    skipDuplicates: true,
  })

  // ── Visits ────────────────────────────────────────────────────────────
  const visitsData = [
    { refNo: 'VIS-001', dealerId: dealers[0].id, visitTypeId: 1, title: 'Quarterly business review', scheduledAt: new Date('2025-09-05T10:00:00Z'), status: 'scheduled', ownerStaffId: admin.id },
    { refNo: 'VIS-002', dealerId: dealers[1].id, visitTypeId: 2, title: 'Technical support — EV charging', scheduledAt: new Date('2025-09-06T14:00:00Z'), status: 'done', outcome: 'positive', outcomeNote: 'Resolved charging unit fault, dealer satisfied', nextStep: 'Follow up in 2 weeks', nextAt: new Date('2025-09-20T10:00:00Z'), ownerStaffId: staffMembers[0].id },
    { refNo: 'VIS-003', dealerId: dealers[2].id, visitTypeId: 3, title: 'Annual compliance audit', scheduledAt: new Date('2025-09-08T09:00:00Z'), status: 'scheduled', ownerStaffId: staffMembers[1].id },
    { refNo: 'VIS-004', dealerId: dealers[3].id, visitTypeId: 1, title: 'New product launch briefing', scheduledAt: new Date('2025-09-10T11:00:00Z'), status: 'in_progress', ownerStaffId: admin.id },
    { refNo: 'VIS-005', prospectId: prospects[0].id, visitTypeId: 1, title: 'Prospect demo — Gamma Dealers', scheduledAt: new Date('2025-09-07T15:00:00Z'), status: 'scheduled', ownerStaffId: staffMembers[0].id },
  ]
  const visits = []
  for (const v of visitsData) {
    const visit = await prisma.visit.upsert({
      where: { refNo: v.refNo },
      create: v,
      update: {},
    })
    visits.push(visit)
  }

  // ── Timeline Entries ──────────────────────────────────────────────────
  await prisma.timelineEntry.createMany({
    data: [
      // Requests
      { entityType: 'request', entityId: requests[0].id, eventType: 'created', summary: 'Request created', actorStaffId: admin.id },
      { entityType: 'request', entityId: requests[0].id, eventType: 'status_change', summary: 'Status changed to in_progress', actorStaffId: admin.id },
      { entityType: 'request', entityId: requests[0].id, eventType: 'note', summary: 'Contacted dealer for VIN confirmation', actorStaffId: admin.id },
      { entityType: 'request', entityId: requests[1].id, eventType: 'created', summary: 'Request created', actorStaffId: staffMembers[0].id },
      { entityType: 'request', entityId: requests[2].id, eventType: 'created', summary: 'Request created', actorStaffId: staffMembers[1].id },
      { entityType: 'request', entityId: requests[2].id, eventType: 'status_change', summary: 'Status changed to waiting_dealer', actorStaffId: staffMembers[1].id },
      { entityType: 'request', entityId: requests[3].id, eventType: 'created', summary: 'Request created', actorStaffId: admin.id },
      { entityType: 'request', entityId: requests[3].id, eventType: 'status_change', summary: 'Status changed to done', actorStaffId: admin.id },
      // Visits
      { entityType: 'visit', entityId: visits[0].id, eventType: 'created', summary: 'Visit scheduled', actorStaffId: admin.id },
      { entityType: 'visit', entityId: visits[1].id, eventType: 'created', summary: 'Visit scheduled', actorStaffId: staffMembers[0].id },
      { entityType: 'visit', entityId: visits[1].id, eventType: 'status_change', summary: 'Visit completed with positive outcome', actorStaffId: staffMembers[0].id },
      // Dealers
      { entityType: 'dealer', entityId: dealers[0].id, eventType: 'note', summary: 'Dealer onboarded successfully', actorStaffId: admin.id },
      { entityType: 'dealer', entityId: dealers[2].id, eventType: 'note', summary: 'Health score dropped — follow up required', actorStaffId: admin.id },
      // Prospects
      { entityType: 'prospect', entityId: prospects[0].id, eventType: 'stage_change', summary: 'Stage changed to contacted', actorStaffId: admin.id },
      { entityType: 'prospect', entityId: prospects[1].id, eventType: 'stage_change', summary: 'Stage changed to demo_done', actorStaffId: staffMembers[0].id },
    ],
    skipDuplicates: true,
  })

  // ── Notifications ─────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { staffId: admin.id, title: 'New Request Assigned', body: 'REQ-001 has been assigned to you', message: 'REQ-001 — Warranty claim: engine fault has been assigned to you', linkUrl: '/requests/1', isRead: false },
      { staffId: admin.id, title: 'Overdue Alert', body: 'REQ-003 is overdue', message: 'REQ-003 — Parts order: brake pads is past its due date', linkUrl: '/requests/3', isRead: false },
      { staffId: admin.id, title: 'Visit Reminder', body: 'VIS-001 is scheduled for tomorrow', message: 'Your visit to AutoPrime Motors is scheduled for tomorrow at 10:00 AM', linkUrl: '/visits/1', isRead: true },
      { staffId: staffMembers[0].id, title: 'New Request Assigned', body: 'REQ-002 has been assigned to you', message: 'REQ-002 — Scheduled service: 10k km has been assigned to you', linkUrl: '/requests/2', isRead: false },
      { staffId: staffMembers[0].id, title: 'Prospect Follow-up', body: 'PRO-002 requires follow-up', message: 'Delta Motors prospect is in demo_done stage and awaiting follow-up', linkUrl: '/prospects/2', isRead: false },
      { staffId: staffMembers[1].id, title: 'Request Waiting', body: 'REQ-003 is waiting on dealer', message: 'REQ-003 — Parts order is waiting for dealer confirmation', linkUrl: '/requests/3', isRead: false },
    ],
    skipDuplicates: true,
  })

  // ── App Config ────────────────────────────────────────────────────────
  await prisma.appConfig.upsert({
    where: { key: 'general' },
    create: { key: 'general', value: { voice_max_seconds: 120, recent_dealers_count: 10, sync_batch_max: 50, ref_block_size: 20, sla_clock: 'business_hours' } },
    update: {},
  })

  // ── Sequences ─────────────────────────────────────────────────────────
  for (const name of ['request', 'visit', 'prospect']) {
    await prisma.sequence.upsert({ where: { name }, create: { name, value: 10 }, update: {} })
  }

  console.log('Seed complete.')
  console.log('Development admin login: admin@dealer.com / ChangeMe123!')
  console.log('Development dealer portal login: portal@autoprime.com / ChangeMe123!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
