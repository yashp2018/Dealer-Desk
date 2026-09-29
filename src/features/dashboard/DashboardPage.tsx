import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Building2, UserPlus, FileText, CalendarDays, AlertTriangle,
  Clock, CheckCircle2, TrendingUp, ArrowRight, RefreshCw,
  ShieldAlert, MapPin, Activity, Users,
} from 'lucide-react'
import { getDashboard } from '../../api/myDay'
import { useNotifications } from '../../hooks/useNotifications'
import { useAuth } from '../../hooks/useAuth'
import { useCalendarData } from '../../hooks/useCalendar'
import { mapCalendarEvents, calendarColors, activityTypeLabels } from '../calendar/calendarEventMapper'
import KpiCard from '../../components/cards/KpiCard'
import SectionCard from '../../components/cards/SectionCard'
import SkeletonCard from '../../components/loaders/SkeletonCard'
import EmptyState from '../../components/loaders/EmptyState'
import StatusBadge from '../../components/badges/StatusBadge'
import PriorityBadge from '../../components/badges/PriorityBadge'
import { relativeTime } from '../../lib/relativeTime'
import { formatDate } from '../../lib/formatDate'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// Local-date keys (not UTC-sliced) so "today" always means the viewer's own
// calendar day, matching the same rule the main Calendar page uses.
const toDateKey = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function TodaysScheduleWidget() {
  const nav = useNavigate()
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const { data, isLoading } = useCalendarData(toDateKey(today), toDateKey(tomorrow))

  const events = (data ? mapCalendarEvents(data) : [])
    .slice()
    .sort((a, b) => a.start.localeCompare(b.start))

  const openEvent = (e: ReturnType<typeof mapCalendarEvents>[number]) => {
    if (e.isCalendarActivity) { nav('/calendar'); return }
    nav(e.visitId ? `/visits/${e.visitId}` : `/requests/${e.requestId}`)
  }

  return (
    <SectionCard
      title="Today's Schedule"
      action={
        <button onClick={() => nav('/calendar')} className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
          Open calendar <ArrowRight className="h-3 w-3" />
        </button>
      }
    >
      {isLoading ? (
        <div className="space-y-2 py-1">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />)}
        </div>
      ) : events.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Nothing scheduled today" description="Visits, requests due, and tasks will show up here." />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {events.map((e) => (
            <button
              key={e.id}
              onClick={() => openEvent(e)}
              className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-5 px-5 transition-colors"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: calendarColors[e.type] ?? calendarColors.request_due }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{e.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{e.dealerName || activityTypeLabels[e.type] || e.type}</p>
              </div>
              <div className="shrink-0 text-right text-xs text-slate-400 dark:text-slate-500">
                {new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </button>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

export default function DashboardPage() {
  const nav = useNavigate()
  const { staff } = useAuth()
  const { data, isLoading, isError, refetch, dataUpdatedAt, isFetching } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })
  const { data: notifs = [] } = useNotifications()

  const unreadNotifs = notifs.filter((n) => !n.is_read).slice(0, 4)

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <SkeletonCard lines={6} className="lg:col-span-2" />
          <SkeletonCard lines={5} />
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <SectionCard>
        <EmptyState
          icon={AlertTriangle}
          title="Dashboard unavailable"
          description="Could not load dashboard data."
          action={{ label: 'Retry', onClick: () => refetch() }}
        />
      </SectionCard>
    )
  }

  const { today, performance, business_health, priority_dist, urgent_requests } = data
  const peak = Math.max(1, ...performance.team.map((m) => m.open_count))

  return (
    <div className="space-y-6">

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{greeting()}{staff?.name ? `, ${staff.name.split(' ')[0]}` : ''}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Here's what's happening across the desk today.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Updated {relativeTime(new Date(dataUpdatedAt).toISOString())}
        </button>
      </div>

      {/* ── TODAY ─────────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Today</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <KpiCard value={today.open_requests}     label="Open Requests"    icon={FileText}      tone="info"    onClick={() => nav('/requests')} />
          <KpiCard value={today.p1_p2}             label="P1 / P2"          icon={ShieldAlert}   tone="p1"      onClick={() => nav('/requests')} />
          <KpiCard value={today.sla_breached}      label="SLA Breached"     icon={AlertTriangle} tone="p1"      onClick={() => nav('/control-room')} />
          <KpiCard value={today.visits_today}      label="Visits Today"     icon={CalendarDays}  tone="info"    onClick={() => nav('/calendar')} />
          <KpiCard value={today.prospects_followup} label="Follow-up"       icon={UserPlus}      tone="warning" onClick={() => nav('/prospects')} />
          <KpiCard value={today.unassigned}        label="Unassigned"       icon={Users}         tone={today.unassigned > 0 ? 'p2' : 'default'} onClick={() => nav('/requests')} />
          <KpiCard value={today.overdue}           label="Overdue"          icon={Clock}         tone={today.overdue > 0 ? 'p2' : 'default'} />
          <KpiCard value={today.pending_approvals} label="Pending Approvals" icon={CheckCircle2} tone="default" />
        </div>
        <div className="mt-4">
          <TodaysScheduleWidget />
        </div>
      </div>

      {/* ── PERFORMANCE ───────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Performance</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <KpiCard value={`${performance.sla_pct}%`}                label="SLA %"               icon={TrendingUp}  tone={performance.sla_pct >= 90 ? 'ok' : 'warning'} />
          <KpiCard value={`${performance.avg_resolution_hours}h`}   label="Avg Resolution"      icon={Clock}       tone="info" />
          <KpiCard value={performance.dealer_activity}              label="Dealer Activity"     icon={Building2}   tone="info" />
          <KpiCard value={`${performance.visit_completion_pct}%`}   label="Visit Completion"    icon={CalendarDays} tone={performance.visit_completion_pct >= 80 ? 'ok' : 'warning'} />
          <KpiCard value={`${performance.prospect_conversion_pct}%`} label="Prospect Conversion" icon={UserPlus}   tone="info" />
          <KpiCard value={performance.team.reduce((s, m) => s + m.open_count, 0)} label="Team Open" icon={Users} tone="default" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Request Trend */}
          <SectionCard
            title="Request Trend"
            className="lg:col-span-2"
            action={
              <button onClick={() => refetch()} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            }
          >
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={performance.request_trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="doneGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="new"  stroke="#6366f1" strokeWidth={2} fill="url(#newGrad)"  name="New" />
                <Area type="monotone" dataKey="done" stroke="#10b981" strokeWidth={2} fill="url(#doneGrad)" name="Done" />
              </AreaChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Priority Distribution */}
          <SectionCard title="Priority Distribution">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={priority_dist} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {priority_dist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-1">
              {priority_dist.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
                    <span className="text-slate-600 dark:text-slate-400">{p.name}</span>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{p.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Team Performance */}
        <div className="mt-5">
          <SectionCard title="Team Performance">
            {performance.team.length === 0 ? (
              <EmptyState icon={UserPlus} title="No team data" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {performance.team.map((m) => {
                  const pct = Math.round((m.open_count / peak) * 100)
                  return (
                    <div key={m.staffid}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{m.name}</span>
                        <div className="flex items-center gap-2 text-xs shrink-0">
                          <span className="text-slate-500 dark:text-slate-400">{m.open_count} open</span>
                          {m.overdue_count > 0 && <span className="text-red-500 font-semibold">{m.overdue_count} late</span>}
                          {m.open_count === 0 && <span className="text-emerald-600 font-medium">free</span>}
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${m.overdue_count > 0 ? 'bg-amber-400' : 'bg-indigo-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
  
      {/* ── BUSINESS HEALTH ───────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Business Health</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <KpiCard value={business_health.active_dealers}    label="Active Dealers"     icon={Building2}  tone="info"    onClick={() => nav('/dealers')} />
          <KpiCard value={business_health.new_dealers}       label="New Dealers"        icon={UserPlus}   tone="ok" />
          <KpiCard value={business_health.prospect_pipeline} label="Prospect Pipeline"  icon={TrendingUp} tone="info"    onClick={() => nav('/prospects')} />
          <KpiCard value={`${business_health.conversion_pct}%`} label="Conversion %"   icon={CheckCircle2} tone={business_health.conversion_pct >= 20 ? 'ok' : 'warning'} />
          <KpiCard value={business_health.dealer_health.good}    label="Healthy Dealers"  icon={Activity}   tone="ok" />
          <KpiCard value={business_health.dealer_health.critical} label="Critical Dealers" icon={AlertTriangle} tone={business_health.dealer_health.critical > 0 ? 'p1' : 'default'} onClick={() => nav('/dealers')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Territory Performance */}
          <SectionCard title="Territory Performance" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={business_health.territory_performance} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="dealers"  fill="#6366f1" radius={[4, 4, 0, 0]} name="Dealers" />
                <Bar dataKey="requests" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Dealer Health Breakdown */}
          <SectionCard title="Dealer Health">
            <div className="space-y-3 pt-1">
              {[
                { label: 'Healthy',  value: business_health.dealer_health.good,     color: 'bg-emerald-500' },
                { label: 'Warning',  value: business_health.dealer_health.warning,  color: 'bg-amber-400' },
                { label: 'Critical', value: business_health.dealer_health.critical, color: 'bg-red-500' },
              ].map(({ label, value, color }) => {
                const total = business_health.active_dealers || 1
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400">{label}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{value}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.round((value / total) * 100)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => nav('/dealers')}
                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                <MapPin className="h-3 w-3" /> View all dealers <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ── BOTTOM ROW ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Urgent Requests */}
        <SectionCard
          title="Urgent Requests"
          className="lg:col-span-2"
          action={
            <button onClick={() => nav('/requests')} className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          }
        >
          {urgent_requests.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="No urgent requests" description="All caught up!" />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {urgent_requests.map((r) => (
                <button
                  key={r.id}
                  onClick={() => nav(`/requests/${r.id}`)}
                  className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-5 px-5 transition-colors"
                >
                  <PriorityBadge priority={r.priority} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{r.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.dealer_name} · {r.owner_name ?? 'Unassigned'}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge status={r.status} />
                    {r.due_at && (
                      <p className={`text-xs mt-0.5 ${r.is_overdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                        {r.is_overdue ? 'Overdue' : formatDate(r.due_at)}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Notifications + Quick Actions */}
        <div className="space-y-5">
          <SectionCard
            title="Recent Notifications"
            action={
              <button onClick={() => nav('/notifications')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                View all
              </button>
            }
          >
            {unreadNotifs.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-2">All caught up ✓</p>
            ) : (
              <div className="space-y-2.5">
                {unreadNotifs.map((n) => (
                  <div key={n.id} className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{n.title}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{relativeTime(n.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Quick Actions">
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Building2,    label: 'Dealers',   to: '/dealers' },
                { icon: UserPlus,     label: 'Prospects', to: '/prospects' },
                { icon: FileText,     label: 'Requests',  to: '/requests' },
                { icon: CalendarDays, label: 'Calendar',  to: '/calendar' },
              ].map(({ icon: Icon, label, to }) => (
                <button
                  key={to}
                  onClick={() => nav(to)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                >
                  <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
