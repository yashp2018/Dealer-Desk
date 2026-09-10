import apiClient from './client'
import type { QueueResponse, Visit, DashboardData, QueueStats, AttentionStats, TeamMember } from './types'
import { mockVisits, mockRequests, mockDealers, mockProspects } from './mockData'

const MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const mockStats: QueueStats = {
  breached: 1,
  due_today: 2,
  open: mockRequests.length,
  waiting: 1,
  done_this_week: 0,
}

const mockAttention: AttentionStats = {
  unassigned: 0,
  unscheduled: 1,
  incomplete: 1,
  breached: 1,
}

const mockTeam: TeamMember[] = [
  { staffid: 1, name: 'Admin User', open_count: mockRequests.length, overdue_count: 1 },
]

export const getMyDay = (): Promise<Visit[]> =>
  MOCK ? Promise.resolve(mockVisits as unknown as Visit[]) : apiClient.get('/my-day')

export const getMyWeek = (): Promise<Visit[]> =>
  MOCK ? Promise.resolve(mockVisits as unknown as Visit[]) : apiClient.get('/my-week')

export const getQueue = (): Promise<QueueResponse> =>
  MOCK ? Promise.resolve({ requests: mockRequests as never, stats: mockStats, attention: mockAttention, team: mockTeam }) : apiClient.get('/queue')

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildMockDashboard(): DashboardData {
  const today = new Date()
  const todayStr = today.toDateString()
  const activeRequests = mockRequests.filter((r) => !['done', 'cancelled'].includes(r.status))
  const visitsToday = mockVisits.filter((v) => new Date(v.scheduled_at).toDateString() === todayStr)

  // Build 7-day trend from mockRequests using created_at
  const trend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (6 - i))
    const ds = d.toDateString()
    return {
      day: DAYS[d.getDay()],
      new: mockRequests.filter((r) => new Date(r.created_at).toDateString() === ds).length,
      done: mockRequests.filter((r) => r.done_at && new Date(r.done_at).toDateString() === ds).length,
    }
  })

  const p1p2 = activeRequests.filter((r) => r.priority <= 2).length
  const overdue = activeRequests.filter((r) => r.is_overdue).length
  const unassigned = activeRequests.filter((r) => !r.owner_staff_id).length
  const converted = mockProspects.filter((p) => p.stage === 'converted').length
  const convPct = mockProspects.length ? Math.round((converted / mockProspects.length) * 100) : 0

  const healthCounts = mockDealers.reduce(
    (acc, d) => { acc[d.health as 'good' | 'warning' | 'critical']++; return acc },
    { good: 0, warning: 0, critical: 0 }
  )

  // Territory performance derived from mockDealers + mockRequests
  const territoryMap: Record<string, { dealers: number; requests: number }> = {}
  mockDealers.forEach((d) => {
    const t = d.territory_name
    if (!territoryMap[t]) territoryMap[t] = { dealers: 0, requests: 0 }
    territoryMap[t].dealers++
    territoryMap[t].requests += d.open_requests
  })

  return {
    today: {
      open_requests: activeRequests.length,
      p1_p2: p1p2,
      sla_breached: mockStats.breached,
      visits_today: visitsToday.length,
      prospects_followup: mockProspects.filter((p) => ['contacted', 'negotiation'].includes(p.stage)).length,
      unassigned,
      overdue,
      pending_approvals: 0,
    },
    performance: {
      request_trend: trend,
      sla_pct: activeRequests.length ? Math.round(((activeRequests.length - mockStats.breached) / activeRequests.length) * 100) : 100,
      avg_resolution_hours: 36,
      dealer_activity: mockDealers.filter((d) => d.last_contact_at).length,
      visit_completion_pct: mockVisits.length ? Math.round((mockVisits.filter((v) => v.status === 'done').length / mockVisits.length) * 100) : 0,
      prospect_conversion_pct: convPct,
      team: mockTeam,
    },
    business_health: {
      active_dealers: mockDealers.length,
      new_dealers: 1,
      prospect_pipeline: mockProspects.filter((p) => !['converted', 'lost'].includes(p.stage)).length,
      conversion_pct: convPct,
      dealer_health: healthCounts,
      territory_performance: Object.entries(territoryMap).map(([name, v]) => ({ name, ...v })),
    },
    priority_dist: [
      { name: 'P1 Critical', value: activeRequests.filter((r) => r.priority === 1).length, color: '#ef4444' },
      { name: 'P2 High',     value: activeRequests.filter((r) => r.priority === 2).length, color: '#f59e0b' },
      { name: 'P3 Medium',   value: activeRequests.filter((r) => r.priority === 3).length, color: '#6366f1' },
      { name: 'P4 Low',      value: activeRequests.filter((r) => r.priority === 4).length, color: '#94a3b8' },
    ],
    urgent_requests: activeRequests.filter((r) => r.priority <= 2).slice(0, 5) as never,
  }
}

export const getDashboard = (): Promise<DashboardData> =>
  MOCK ? Promise.resolve(buildMockDashboard()) : apiClient.get('/dashboard')
