/**
 * Desktop — Visit detail  (mirrors desktop/visit_detail.php)
 * Identity header · facts strip · agenda · outcome · open requests · timeline
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useVisit } from '../../hooks/useVisits'
import Timeline from '../../components/timeline/Timeline'
import StatusBadge from '../../components/badges/StatusBadge'
import PriorityBadge from '../../components/badges/PriorityBadge'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import Breadcrumb from '../../layouts/Breadcrumb'
import { useVisitTimeline } from '../../hooks/useVisits'
import { useDealerRequests } from '../../hooks/useDealers'
import { formatDateTime, formatDate } from '../../lib/formatDate'

const STATUS_LABELS: Record<string, string> = {
  planned: 'Planned', in_progress: 'In Progress', done: 'Done', cancelled: 'Cancelled', scheduled: 'Scheduled',
}

export default function DesktopVisitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const vid = Number(id)
  const nav = useNavigate()
  const { data: visit, isLoading, isError } = useVisit(vid)
  const { data: timeline = [] } = useVisitTimeline(vid)
  const { data: allDealerRequests = [] } = useDealerRequests(visit?.dealer_id ?? '')

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError || !visit) return <Alert type="danger" message="Visit not found." />

  const v = visit
  const dealerRequests = allDealerRequests.filter((r) => !['done', 'cancelled'].includes(r.status))

  return (
    <div className="space-y-4 max-w-7xl">
      <Breadcrumb crumbs={[{ label: 'Visits', to: '/visits' }, { label: v.ref }]} />

      {/* Identity header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Visit</span>
              <span className="font-mono text-sm text-gray-500">{v.ref}</span>
            </div>
            <h1 className="text-lg font-bold text-gray-800">{v.dealer_name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{v.title}</p>
          </div>
          {/* Facts strip */}
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Status</p>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {STATUS_LABELS[v.status] ?? v.status}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Scheduled</p>
              <p className="text-gray-700">{v.scheduled_at ? formatDateTime(v.scheduled_at) : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Owner</p>
              <p className="text-gray-700">{v.owner_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Outcome</p>
              <p className="text-gray-700">{v.outcome ?? <span className="text-gray-400">—</span>}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Run column ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Agenda */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Agenda</h3>
            <p className="text-sm text-gray-400">No agenda items.</p>
          </div>

          {/* Outcome */}
          {v.outcome && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Outcome</h3>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-1.5 text-xs text-gray-400 w-28">Outcome</td>
                    <td className="py-1.5 text-gray-700 capitalize">{v.outcome}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Open requests */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Open Requests</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Ref', 'Type', 'Status', 'Due'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dealerRequests.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-gray-400 py-8 text-sm">No open requests.</td></tr>
                )}
                {dealerRequests.map((r) => (
                  <tr key={r.id} onClick={() => nav(`/requests/${r.id}`)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3">
                      <PriorityBadge priority={r.priority} />
                      <span className="ml-2 font-mono text-xs text-gray-600">{r.ref_no}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.type_name}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.due_at ? formatDate(r.due_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Context column ── */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Timeline</h3>
            <Timeline entries={timeline} />
          </div>
        </div>
      </div>
    </div>
  )
}
