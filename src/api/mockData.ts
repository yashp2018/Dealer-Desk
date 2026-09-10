import type { AuthData, Bootstrap, Dealer, Notification, Prospect, Request, Visit, TimelineEntry } from './types'

export const MOCK_CREDENTIALS = { email: 'admin@example.com', password: 'password' }

export const mockAuth: AuthData = {
  token: 'mock-token-abc123',
  expires_in: 3600,
  ref_block: 'BLK-001',
  staff: { id: '000000000000000000000001', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
}

export const mockBootstrap: Bootstrap = {
  config: { voice_max_seconds: 120, recent_dealers_count: 5, sync_batch_max: 50, ref_block_size: 100, sla_clock: 'business' },
  statuses: { new: 'New', open: 'Open', pending: 'Pending', done: 'Done', closed: 'Closed' },
  transitions: { new: ['open'], open: ['pending', 'done'], pending: ['open', 'done'], done: ['closed'] },
  tiers: [{ id: '000000000000000000000001', name: 'Gold', multiplier: 1.5 }, { id: '000000000000000000000002', name: 'Silver', multiplier: 1.0 }],
  territories: [{ id: '000000000000000000000001', name: 'North' }, { id: '000000000000000000000002', name: 'South' }],
  types: [
    {
      id: '000000000000000000000001', name: 'Support', slug: 'support', icon: 'wrench', color: '#3B82F6',
      default_priority: 3, sla_hours: 24, push_target: null, allows_prospect: false, fields: [],
    },
  ],
  visit_types: [{ id: '000000000000000000000001', name: 'Sales Visit' }, { id: '000000000000000000000002', name: 'Support Visit' }],
  doc_types: [{ id: '000000000000000000000001', name: 'Contract' }, { id: '000000000000000000000002', name: 'Invoice' }],
  dealers: [{ id: '000000000000000000000001', code: 'DLR-001', name: 'Alpha Motors', tier_id: '000000000000000000000001', territory_id: '000000000000000000000001' }],
  staff: [{ id: '000000000000000000000001', name: 'Admin User', email: 'admin@example.com', role: 'admin' }],
}

export const mockDealers: Dealer[] = [
  {
    id: '000000000000000000000001', code: 'DLR-001', name: 'Alpha Motors', display_name: 'Alpha Motors',
    tier_id: '000000000000000000000001', tier_name: 'Gold', tier_color: '#F59E0B',
    territory_id: '000000000000000000000001', territory_name: 'North',
    city: 'Mumbai', state_normalized: 'MH',
    health: 'good', health_score: 85,
    open_requests: 3, overdue_requests: 1,
    last_contact_at: '2025-08-01T10:00:00Z',
    phone_primary: '+91-9000000001', whatsapp_phone: '+91-9000000001',
    owner_staff_id: '000000000000000000000001', client_id: null, territory_is_manual: false,
  },
  {
    id: '000000000000000000000002', code: 'DLR-002', name: 'Beta Autos', display_name: 'Beta Autos',
    tier_id: '000000000000000000000002', tier_name: 'Silver', tier_color: '#6B7280',
    territory_id: '000000000000000000000002', territory_name: 'South',
    city: 'Chennai', state_normalized: 'TN',
    health: 'warning', health_score: 60,
    open_requests: 5, overdue_requests: 2,
    last_contact_at: '2025-07-20T09:00:00Z',
    phone_primary: '+91-9000000002', whatsapp_phone: '+91-9000000002',
    owner_staff_id: '000000000000000000000001', client_id: null, territory_is_manual: false,
  },
]

export const mockRequests: Request[] = [
  {
    id: '000000000000000000000001', ref: 'REQ-001', ref_no: 'REQ-001', title: 'Spare parts request',
    type_id: '000000000000000000000001', type_name: 'Support', type_icon: 'wrench',
    status: 'open', priority: 2, priority_override: null, priority_reason: null,
    dealer_id: '000000000000000000000001', dealer_name: 'Alpha Motors', dealer_city: 'Mumbai',
    owner_staff_id: '000000000000000000000001', owner_name: 'Admin User',
    due_at: '2025-09-10T17:00:00Z', scheduled_at: null,
    created_at: '2025-09-01T08:00:00Z',
    is_overdue: false, completion_done: 0, completion_required: 1,
    closed_reason: null, done_at: null,
  },
  {
    id: '000000000000000000000002', ref: 'REQ-002', ref_no: 'REQ-002', title: 'Warranty claim',
    type_id: '000000000000000000000001', type_name: 'Support', type_icon: 'wrench',
    status: 'pending', priority: 1, priority_override: null, priority_reason: null,
    dealer_id: '000000000000000000000002', dealer_name: 'Beta Autos', dealer_city: 'Chennai',
    owner_staff_id: '000000000000000000000001', owner_name: 'Admin User',
    due_at: '2025-09-05T17:00:00Z', scheduled_at: null,
    created_at: '2025-08-28T10:00:00Z',
    is_overdue: true, completion_done: 1, completion_required: 3,
    closed_reason: null, done_at: null,
  },
]

export const mockVisits: Visit[] = [
  {
    id: '000000000000000000000001', ref: 'VIS-001', ref_no: 'VIS-001',
    dealer_id: '000000000000000000000001', dealer_name: 'Alpha Motors',
    visit_type: 'Sales Visit', title: 'Quarterly review',
    scheduled_at: '2025-09-05T10:00:00Z',
    status: 'scheduled', outcome: null, outcome_note: null,
    next_step: null, next_at: null,
    owner_name: 'Admin User', owner_staff_id: '000000000000000000000001', agenda_json: null,
  },
  {
    id: '000000000000000000000002', ref: 'VIS-002', ref_no: 'VIS-002',
    dealer_id: '000000000000000000000002', dealer_name: 'Beta Autos',
    visit_type: 'Support Visit', title: 'Issue resolution',
    scheduled_at: '2025-09-06T14:00:00Z',
    status: 'done', outcome: 'positive', outcome_note: 'Resolved all issues',
    next_step: 'Follow up in 2 weeks', next_at: '2025-09-20T10:00:00Z',
    owner_name: 'Admin User', owner_staff_id: '000000000000000000000001', agenda_json: null,
  },
]

export const mockProspects: Prospect[] = [
  {
    id: '000000000000000000000001', ref_no: 'PRO-001', company_name: 'Gamma Dealers',
    contact_name: 'Ravi Kumar', email: 'ravi@gammadealers.com',
    phone: '+91-9000000003', whatsapp: '+91-9000000003',
    city: 'Pune', state_normalized: 'MH',
    stage: 'contacted', stage_changed_at: '2025-08-15T00:00:00Z',
    owner_staff_id: '000000000000000000000001', source: 'referral', converted_dealer_id: null,
    created_at: '2025-08-01T00:00:00Z',
  },
]

export const mockNotifications: Notification[] = [
  {
    id: '000000000000000000000001', title: 'New Request', body: 'REQ-001 has been assigned to you',
    message: 'REQ-001 has been assigned to you', link_url: '/requests/000000000000000000000001',
    is_read: false, created_at: '2025-09-01T08:00:00Z',
  },
  {
    id: '000000000000000000000002', title: 'Overdue Alert', body: 'REQ-002 is overdue',
    message: 'REQ-002 is overdue', link_url: '/requests/000000000000000000000002',
    is_read: false, created_at: '2025-09-02T09:00:00Z',
  },
]

export const mockTimeline: TimelineEntry[] = [
  {
    id: '000000000000000000000001', created_at: '2025-09-01T08:00:00Z',
    actor_name: 'Admin User', actor_staff_id: '000000000000000000000001',
    event_type: 'created', summary: 'Record created',
  },
  {
    id: '000000000000000000000002', created_at: '2025-09-02T10:00:00Z',
    actor_name: 'Admin User', actor_staff_id: '000000000000000000000001',
    event_type: 'status_change', summary: 'Status changed to open',
  },
]
