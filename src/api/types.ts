/**
 * src/api/types.ts
 * Shared domain types used across all API modules.
 * All MongoDB entity IDs are strings.
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface Staff {
  id: string
  name: string
  email: string
  role: string
  dealerId?: string
  permissions?: string[]
}

export interface AuthData {
  token: string
  expires_in: number
  staff: Staff
  ref_block: string
}

export interface LoginPayload {
  email: string
  password: string
  device_id: string
  platform: string
  app_version: string
  os_version: string
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

export interface RequestTypeField {
  key: string
  label: string
  input_type: 'text' | 'number' | 'textarea' | 'select' | 'date' | 'toggle' | 'photo' | 'item_ref'
  source: string | null
  options: string[]
  filter: string | null
  is_required: boolean
  sort_order: number
  help_text: string
}

export interface RequestType {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  default_priority: number
  sla_hours: number
  push_target: string | null
  allows_prospect: boolean
  fields: RequestTypeField[]
}

export interface Tier {
  id: string
  name: string
  multiplier: number
}

export interface Territory {
  id: string
  name: string
}

export interface VisitType {
  id: string
  name: string
}

export interface DocType {
  id: string
  name: string
}

export interface DealerPickerItem {
  id: string
  code: string
  name: string
  tier_id: string
  territory_id: string
}

export interface BootstrapConfig {
  voice_max_seconds: number
  recent_dealers_count: number
  sync_batch_max: number
  ref_block_size: number
  sla_clock: string
}

export interface Bootstrap {
  config: BootstrapConfig
  statuses: Record<string, string>
  transitions: Record<string, string[]>
  tiers: Tier[]
  territories: Territory[]
  types: RequestType[]
  visit_types: VisitType[]
  doc_types: DocType[]
  dealers: DealerPickerItem[]
  staff: Staff[]
}

// ─── Dealer ───────────────────────────────────────────────────────────────────

export interface Dealer {
  id: string
  code: string
  name: string
  display_name: string
  tier_id: string
  tier_name: string
  tier_color: string
  territory_id: string
  territory_name: string
  city: string
  state_normalized: string
  health: 'good' | 'warning' | 'critical'
  health_score: number | null
  open_requests: number
  overdue_requests: number
  last_contact_at: string | null
  phone_primary: string
  whatsapp_phone: string
  owner_staff_id: string | null
  client_id: number | null
  territory_is_manual: boolean
}

/** Safe dealer info returned to dealer portal users */
export interface DealerPortal {
  id: string
  code: string
  name: string
  display_name: string
  city: string
  state_normalized: string
  phone_primary: string
  whatsapp_phone: string
  tier_name: string
  territory_name: string
}

export interface DealerContact {
  id: string
  name: string
  role_label: string
  phone: string
  email: string
  is_primary: boolean
}

export interface DealerUpdatePayload {
  display_name?: string
  phone_primary?: string
  whatsapp_phone?: string
  city?: string
  state_normalized?: string
  tier_id?: string
  territory_id?: string | null
  territory_is_manual?: boolean
  owner_staff_id?: string | null
}

// ─── Prospect ─────────────────────────────────────────────────────────────────

export interface Prospect {
  id: string
  ref_no: string
  company_name: string
  contact_name: string
  email: string
  phone: string
  whatsapp: string
  city: string
  state_normalized: string
  stage: string
  stage_changed_at: string
  owner_staff_id: string
  source: string
  converted_dealer_id: string | null
  created_at: string
}

export interface OnboardingItem {
  id: string
  doc_name: string
  is_required: boolean
  status: 'pending' | 'received' | 'verified' | 'rejected'
}

// ─── Request ──────────────────────────────────────────────────────────────────

export interface Request {
  id: string
  ref: string
  ref_no: string
  title: string
  type_id: string
  type_name: string
  type_icon: string
  status: string
  priority: number
  priority_override: number | null
  priority_reason: string | null
  dealer_id: string | null
  dealer_name: string
  dealer_city: string
  owner_staff_id: string | null
  owner_name: string | null
  due_at: string | null
  scheduled_at: string | null
  created_at: string
  is_overdue: boolean
  completion_done: number
  completion_required: number
  closed_reason: string | null
  done_at: string | null
}

/** Safe request DTO for dealer portal */
export interface DealerRequest {
  id: string
  ref_no: string
  type_name: string
  title: string
  description: string | null
  status: string
  priority: number
  due_at: string | null
  created_at: string
  updated_at: string
}

export interface RequestDetails {
  request_id: string
  fields: Record<string, string>
}

export interface RequestLine {
  id: string
  request_id: string
  description: string
  qty: number
  unit_rate: number | null
  total: number | null
}

export interface TimelineEntry {
  id: string
  created_at: string
  actor_name: string
  actor_staff_id: string | null
  event_type: string
  summary: string
}

export interface CreateRequestPayload {
  dealer_id: string
  type_id: string
  title?: string
  description?: string
  priority?: number
  owner_staff_id?: string
  scheduled_at?: string
  fields?: Record<string, string>
  client_uuid?: string
}

/** Dealer portal request creation — no dealer_id */
export interface DealerCreateRequestPayload {
  type_id: string
  title?: string
  description?: string
  priority?: number
  scheduled_at?: string
  fields?: Record<string, string>
  client_uuid?: string
}

// ─── Visit ────────────────────────────────────────────────────────────────────

export interface Visit {
  id: string
  ref: string
  ref_no: string
  dealer_id: string | null
  dealer_name: string
  visit_type: string
  title: string
  scheduled_at: string
  status: string
  outcome: string | null
  outcome_note: string | null
  next_step: string | null
  next_at: string | null
  owner_name: string
  owner_staff_id: string
  agenda_json: string | null
}

export interface VisitOutcomePayload {
  outcome: string
  outcome_note?: string
  next_step?: string
  next_at?: string
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  title: string
  body: string
  message: string
  link_url: string | null
  is_read: boolean
  created_at: string
}

// ─── Queue / Dashboard ────────────────────────────────────────────────────────

export interface QueueStats {
  breached: number
  due_today: number
  open: number
  waiting: number
  done_this_week: number
}

export interface AttentionStats {
  unassigned: number
  unscheduled: number
  incomplete: number
  breached: number
}

export interface TeamMember {
  staffid: string
  name: string
  open_count: number
  overdue_count: number
}

export interface QueueResponse {
  requests: Request[]
  stats: QueueStats
  attention: AttentionStats
  team: TeamMember[]
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface TodayMetrics {
  open_requests: number
  p1_p2: number
  sla_breached: number
  visits_today: number
  prospects_followup: number
  unassigned: number
  overdue: number
  pending_approvals: number
}

export interface TrendPoint {
  day: string
  new: number
  done: number
}

export interface PerformanceMetrics {
  request_trend: TrendPoint[]
  sla_pct: number
  avg_resolution_hours: number
  dealer_activity: number
  visit_completion_pct: number
  prospect_conversion_pct: number
  team: TeamMember[]
}

export interface TerritoryPoint {
  name: string
  dealers: number
  requests: number
}

export interface BusinessHealth {
  active_dealers: number
  new_dealers: number
  prospect_pipeline: number
  conversion_pct: number
  dealer_health: { good: number; warning: number; critical: number }
  territory_performance: TerritoryPoint[]
}

export interface PriorityPoint {
  name: string
  value: number
  color: string
}

export interface DashboardData {
  today: TodayMetrics
  performance: PerformanceMetrics
  business_health: BusinessHealth
  priority_dist: PriorityPoint[]
  urgent_requests: Request[]
}
