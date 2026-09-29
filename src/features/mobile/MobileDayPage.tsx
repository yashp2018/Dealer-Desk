import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Building2, CalendarClock, CheckCircle2, ChevronRight, Clock3 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getQueue } from '../../api/myDay'
import { useVisits } from '../../hooks/useVisits'
import type { Request, Visit } from '../../api/types'
import { todayForDateInput, toLocalDateKey } from '../../lib/formatDate'
import Spinner from '../../components/loaders/Spinner'

function RequestItem({ request }: { request: Request }) {
  const late = request.is_overdue
  const complete = request.completion_required > 0 && request.completion_done >= request.completion_required
  return (
    <Link to={`/mobile/request/${request.id}`} className="block border-b border-slate-100 bg-white px-4 py-4 last:border-0 active:bg-slate-50">
      <div className="flex items-start gap-3">
        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${request.priority === 1 ? 'bg-red-500' : request.priority === 2 ? 'bg-amber-400' : 'bg-cyan-600'}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold text-slate-800">{request.dealer_name || 'Unassigned dealer'}</p>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
          </div>
          <p className="mt-1 truncate text-sm text-slate-600">{request.type_name}{request.title ? ` · ${request.title}` : ''}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono">{request.ref}</span>
            {late && <span className="font-semibold text-red-600">Overdue</span>}
            {complete && <span className="font-semibold text-emerald-600">Ready to push</span>}
          </div>
        </div>
      </div>
    </Link>
  )
}

function VisitItem({ visit }: { visit: Visit }) {
  return (
    <Link to={`/mobile/visit/${visit.id}`} className="block border-b border-slate-100 bg-white px-4 py-4 last:border-0 active:bg-slate-50">
      <div className="flex items-start gap-3">
        <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold text-slate-800">{visit.dealer_name}</p>
            <span className="text-xs font-semibold text-cyan-700">{new Date(visit.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{visit.title} · {visit.visit_type}</p>
          <span className="mt-2 inline-flex text-xs text-slate-400">{visit.status.replace('_', ' ')}</span>
        </div>
      </div>
    </Link>
  )
}

export default function MobileDayPage() {
  const queue = useQuery({ queryKey: ['queue'], queryFn: getQueue })
  const visits = useVisits()
  const today = todayForDateInput()

  const { overdue, scheduled, unscheduled } = useMemo(() => {
    const requests = queue.data?.requests ?? []
    return {
      overdue: requests.filter((request) => request.is_overdue),
      scheduled: requests.filter((request) => !request.is_overdue && request.scheduled_at),
      unscheduled: requests.filter((request) => !request.is_overdue && !request.scheduled_at),
    }
  }, [queue.data])
  const todayVisits = (visits.data ?? []).filter((visit) => visit.scheduled_at && toLocalDateKey(visit.scheduled_at) === today)

  if (queue.isLoading || visits.isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  if (queue.isError || visits.isError) return <div className="p-5"><div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">Live field data is unavailable. Try again when the service is reachable.</div></div>

  return (
    <div>
      <header className="bg-slate-950 px-5 pb-5 pt-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Dealer Desk Mobile</p>
        <div className="mt-3 flex items-end justify-between">
          <div><h1 className="text-2xl font-bold">My Day</h1><p className="mt-1 text-sm text-slate-400">{new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })}</p></div>
          <Link to="/mobile/dealers" className="rounded-full bg-white/10 p-3 text-cyan-200"><SearchIcon /></Link>
        </div>
      </header>
      <div className="grid grid-cols-3 gap-px bg-slate-200">
        {[['Overdue', overdue.length, 'text-red-600'], ['Today', scheduled.length + todayVisits.length, 'text-cyan-700'], ['Waiting', unscheduled.length, 'text-amber-600']].map(([label, value, tone]) => <div key={String(label)} className="bg-white px-3 py-4 text-center"><p className={`text-2xl font-bold ${tone}`}>{value}</p><p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p></div>)}
      </div>
      <section className="mt-5">
        {overdue.length > 0 && <><SectionHeading icon={<AlertTriangle />} label="Overdue" tone="text-red-600" />{overdue.map((request) => <RequestItem key={request.id} request={request} />)}</>}
        {(scheduled.length > 0 || todayVisits.length > 0) && <><SectionHeading icon={<Clock3 />} label="Today" tone="text-cyan-700" />{[...scheduled].sort((a, b) => String(a.scheduled_at).localeCompare(String(b.scheduled_at))).map((request) => <RequestItem key={`r-${request.id}`} request={request} />)}{todayVisits.map((visit) => <VisitItem key={`v-${visit.id}`} visit={visit} />)}</>}
        {unscheduled.length > 0 && <><SectionHeading icon={<CalendarClock />} label="Unscheduled" tone="text-amber-600" />{unscheduled.map((request) => <RequestItem key={request.id} request={request} />)}</>}
        {!overdue.length && !scheduled.length && !todayVisits.length && !unscheduled.length && <div className="px-5 py-16 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" /><p className="mt-3 font-semibold text-slate-700">Nothing queued today</p></div>}
      </section>
    </div>
  )
}

function SectionHeading({ icon, label, tone }: { icon: React.ReactNode; label: string; tone: string }) {
  return <div className={`flex items-center gap-2 px-5 pb-2 pt-5 text-xs font-bold uppercase tracking-[0.16em] ${tone}`}>{icon && <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>}{label}</div>
}
function SearchIcon() { return <span className="block h-4 w-4 rounded-full border-2 border-current" /> }
