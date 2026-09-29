import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getQueue } from '../../api/myDay'
import { getVisits } from '../../api/visits'
import KpiCard from '../../components/cards/KpiCard'
import SectionCard from '../../components/cards/SectionCard'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import StatusBadge from '../../components/badges/StatusBadge'
import PriorityBadge from '../../components/badges/PriorityBadge'
import { overdueDays } from '../../lib/overdueDays'
import { formatDate } from '../../lib/formatDate'
import {
  AlertTriangle, Clock, Users, CalendarDays, Plus,
  UserCheck, RefreshCw, Zap, ShieldAlert,
} from 'lucide-react'

const POLL_MS = 30_000

interface Req {
  id: string; ref: string; title: string; status: string; priority: number
  dealer_name: string; due_at: string | null; is_overdue: boolean
  owner_name: string | null; owner_staff_id: string | null; scheduled_at: string | null
}
interface Visit {
  id: number; ref: string; dealer_name: string; visit_type: string
  scheduled_at: string; status: string; owner_name: string
}
interface TeamMember { staffid: string; name: string; open_count: number; overdue_count: number }

function remainingLabel(dueAt: string | null): { label: string; urgent: boolean } {
  if (!dueAt) return { label: '—', urgent: false }
  const diff = new Date(dueAt).getTime() - Date.now()
  if (diff <= 0) return { label: `${overdueDays(dueAt)}d overdue`, urgent: true }
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return { label: `${Math.floor(diff / 60_000)}m`, urgent: true }
  if (h < 24) return { label: `${h}h`, urgent: h < 4 }
  return { label: `${Math.floor(h / 24)}d`, urgent: false }
}

export default function ControlRoomPage() {
  const nav = useNavigate()
  const queue = useQuery({ queryKey: ['queue'], queryFn: getQueue, refetchInterval: POLL_MS })
  const visits = useQuery({ queryKey: ['visits'], queryFn: () => getVisits(), refetchInterval: POLL_MS })

  if (queue.isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (queue.isError) return <Alert type="danger" message="Failed to load queue." onRetry={queue.refetch} />

  const { requests, stats, attention, team } = queue.data as {
    requests: Req[]; stats: { breached: number; due_today: number; open: number; waiting: number }
    attention: { unassigned: number; unscheduled: number; incomplete: number; breached: number }
    team: TeamMember[]
  }
  const visitList = (visits.data ?? []) as Visit[]
  const active = requests.filter((r) => !['done', 'cancelled'].includes(r.status))
  const p1 = active.filter((r) => r.priority === 1)
  const slaRisk = active.filter((r) => {
    if (!r.due_at) return false
    const h = (new Date(r.due_at).getTime() - Date.now()) / 3_600_000
    return h < 4
  })
  const unassigned = active.filter((r) => !r.owner_staff_id)
  const unscheduled = active.filter((r) => !r.scheduled_at)
  const escalations = active.filter((r) => r.is_overdue && r.priority === 1)
  const todayVisits = visitList.filter((v) => new Date(v.scheduled_at).toDateString() === new Date().toDateString())
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
  const peak = Math.max(1, ...team.map((m) => m.open_count))

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <RefreshCw className="h-3 w-3" />
          Auto-refreshes every 30s
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => nav('/calendar')} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
            <CalendarDays className="h-4 w-4" /> Calendar
          </button>
          <button onClick={() => nav('/requests/new')} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> New Request
          </button>
        </div>
      </div>

      {/* Operations Health */}
      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Operations Health</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard value={stats.open}         label="Open"        icon={Zap}           tone="info"    onClick={() => nav('/requests')} />
          <KpiCard value={slaRisk.length}     label="SLA Risk"    icon={Clock}         tone={slaRisk.length > 0 ? 'warning' : 'default'} />
          <KpiCard value={stats.breached}     label="Breached"    icon={AlertTriangle} tone={stats.breached > 0 ? 'p1' : 'default'} />
          <KpiCard value={attention.unassigned} label="Unassigned" icon={Users}        tone={attention.unassigned > 0 ? 'p2' : 'default'} />
        </div>
      </div>

      {/* Live Queue — 2/1 split */}
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Live Queue</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left — queue panels */}
        <div className="lg:col-span-2 space-y-4">

          {/* P1 Critical */}
          <SectionCard
            title={`P1 Critical (${p1.length})`}
            action={<ShieldAlert className="h-4 w-4 text-red-500" />}
          >
            {p1.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No P1 requests — all clear.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {p1.map((r) => {
                  const rem = remainingLabel(r.due_at)
                  return (
                    <button key={r.id} onClick={() => nav(`/requests/${r.id}`)}
                      className="w-full flex items-center gap-3 py-2.5 -mx-5 px-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <span className="h-2 w-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{r.ref} · {r.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.dealer_name} · {r.owner_name ?? 'Unassigned'}</p>
                      </div>
                      <div className="shrink-0 text-right space-y-0.5">
                        <StatusBadge status={r.status} />
                        <p className={`text-xs font-medium ${rem.urgent ? 'text-red-500' : 'text-slate-400'}`}>{rem.label}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </SectionCard>

          {/* SLA at Risk */}
          <SectionCard title={`SLA at Risk (${slaRisk.length})`} action={<Clock className="h-4 w-4 text-amber-500" />}>
            {slaRisk.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No requests at SLA risk.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-2 pr-4 font-medium">Request</th>
                      <th className="pb-2 pr-4 font-medium">Dealer</th>
                      <th className="pb-2 pr-4 font-medium">Owner</th>
                      <th className="pb-2 pr-4 font-medium">Due</th>
                      <th className="pb-2 font-medium">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {slaRisk.map((r) => {
                      const rem = remainingLabel(r.due_at)
                      return (
                        <tr key={r.id} onClick={() => nav(`/requests/${r.id}`)} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2.5 pr-4">
                            <p className="font-mono font-semibold text-slate-700 dark:text-slate-300">{r.ref}</p>
                            <p className="text-slate-500 dark:text-slate-400 truncate max-w-[140px]">{r.title}</p>
                          </td>
                          <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400 truncate max-w-[100px]">{r.dealer_name}</td>
                          <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">{r.owner_name ?? <span className="text-amber-500">Unassigned</span>}</td>
                          <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">{r.due_at ? formatDate(r.due_at) : '—'}</td>
                          <td className={`py-2.5 font-semibold ${rem.urgent ? 'text-red-500' : 'text-amber-500'}`}>{rem.label}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Unassigned */}
          <SectionCard title={`Unassigned (${unassigned.length})`} action={<Users className="h-4 w-4 text-indigo-500" />}>
            {unassigned.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">All requests are assigned.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {unassigned.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 py-2.5">
                    <PriorityBadge priority={r.priority} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{r.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{r.dealer_name}</p>
                    </div>
                    <button
                      onClick={() => nav(`/requests/${r.id}`)}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      <UserCheck className="h-3 w-3" /> Assign
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Unscheduled */}
          <SectionCard title={`Unscheduled (${unscheduled.length})`} action={<CalendarDays className="h-4 w-4 text-slate-400" />}>
            {unscheduled.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">All requests are scheduled.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {unscheduled.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 py-2.5">
                    <PriorityBadge priority={r.priority} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{r.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{r.dealer_name}</p>
                    </div>
                    <button
                      onClick={() => nav(`/requests/${r.id}`)}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      <CalendarDays className="h-3 w-3" /> Schedule
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Escalations */}
          <SectionCard title={`Escalations (${escalations.length})`} action={<AlertTriangle className="h-4 w-4 text-red-500" />}>
            {escalations.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No active escalations.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-2 pr-4 font-medium">Level</th>
                      <th className="pb-2 pr-4 font-medium">Request</th>
                      <th className="pb-2 pr-4 font-medium">Reason</th>
                      <th className="pb-2 pr-4 font-medium">Owner</th>
                      <th className="pb-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {escalations.map((r) => (
                      <tr key={r.id}>
                        <td className="py-2.5 pr-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">P1</span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <p className="font-mono font-semibold text-slate-700 dark:text-slate-300">{r.ref}</p>
                          <p className="text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{r.dealer_name}</p>
                        </td>
                        <td className="py-2.5 pr-4 text-red-600 dark:text-red-400 font-medium">SLA Breached</td>
                        <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">{r.owner_name ?? <span className="text-amber-500">Unassigned</span>}</td>
                        <td className="py-2.5">
                          <button onClick={() => nav(`/requests/${r.id}`)}
                            className="px-2.5 py-1 text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right — team + visits */}
        <div className="space-y-4">

          {/* Team Load */}
          <SectionCard title="Team Load">
            {team.length === 0 ? (
              <p className="text-xs text-slate-400">No data.</p>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-4 text-xs text-slate-400 dark:text-slate-500 font-medium pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="col-span-2">Employee</span>
                  <span className="text-center">Open</span>
                  <span className="text-center">P1</span>
                </div>
                {team.map((m) => {
                  const pct = Math.round((m.open_count / peak) * 100)
                  const memberP1 = p1.filter((r) => r.owner_staff_id === m.staffid).length
                  return (
                    <div key={m.staffid} className="py-2 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                      <div className="grid grid-cols-4 items-center text-xs mb-1.5">
                        <span className="col-span-2 font-medium text-slate-700 dark:text-slate-300 truncate">{m.name}</span>
                        <span className={`text-center font-semibold ${m.overdue_count > 0 ? 'text-amber-500' : 'text-slate-600 dark:text-slate-400'}`}>
                          {m.open_count}{m.overdue_count > 0 && <span className="text-red-500 ml-1">({m.overdue_count}↑)</span>}
                        </span>
                        <span className={`text-center font-semibold ${memberP1 > 0 ? 'text-red-500' : 'text-slate-400'}`}>{memberP1 || '—'}</span>
                      </div>
                      <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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

          {/* Today's Visits — timeline */}
          <SectionCard
            title={`Today's Visits (${todayVisits.length})`}
            action={
              <button onClick={() => nav('/calendar')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                Calendar
              </button>
            }
          >
            {todayVisits.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No visits scheduled today.</p>
            ) : (
              <div className="relative pl-4">
                <div className="absolute left-1.5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
                {todayVisits.map((v) => (
                  <button key={v.id} onClick={() => nav(`/visits/${v.id}`)}
                    className="relative w-full text-left mb-4 last:mb-0 pl-4 hover:opacity-80 transition-opacity">
                    <div className="absolute -left-[11px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900" />
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      {new Date(v.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{v.dealer_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{v.visit_type} · {v.owner_name}</p>
                    <StatusBadge status={v.status} />
                  </button>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Quick Capture */}
          <SectionCard title="Quick Capture">
            <div className="space-y-2">
              <button onClick={() => nav('/requests/new')}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white text-sm py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                <Plus className="h-4 w-4" /> New Request
              </button>
              <button onClick={() => nav('/calendar')}
                className="w-full flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-600 text-sm py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <CalendarDays className="h-4 w-4" /> Schedule Visit
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
