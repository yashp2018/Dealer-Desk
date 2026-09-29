import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, FilePlus } from 'lucide-react'
import { useMyRequest, useMyRequestTimeline, useMyRequestLines, useMyRequestDetails, usePortalRequestTypes } from '../../hooks/usePortal'
import RequestDynamicFields from '../requests/RequestDynamicFields'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import { formatDate, formatDateTime } from '../../lib/formatDate'

const STATUS_COLORS: Record<string, string> = {
  Received: 'bg-slate-100 text-slate-600',
  'In Progress': 'bg-amber-100 text-amber-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-600',
}

export default function PortalRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: request, isLoading, isError } = useMyRequest(id)
  const { data: timeline = [] } = useMyRequestTimeline(id)
  const { data: lines = [] } = useMyRequestLines(id)
  const { data: details } = useMyRequestDetails(id)
  const { data: types = [] } = usePortalRequestTypes()
  const currentType = types.find((t) => t.name === request?.type_name)

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError || !request) return <Alert type="danger" message="Request not found." />

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/portal/requests')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to My Requests
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-slate-400">{request.ref_no}</p>
            <h2 className="text-lg font-bold text-slate-800 mt-0.5">{request.title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{request.type_name}</p>
          </div>
          <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[request.status] ?? 'bg-slate-100 text-slate-600'}`}>{request.status}</span>
        </div>

        {request.description && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{request.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-sm">
          <div>
            <p className="text-xs text-slate-400">Submitted</p>
            <p className="text-slate-700 mt-0.5">{formatDate(request.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Last Updated</p>
            <p className="text-slate-700 mt-0.5">{formatDate(request.updated_at)}</p>
          </div>
          {request.scheduled_at && (
            <div className="col-span-2">
              <p className="text-xs text-slate-400">Requested for</p>
              <p className="text-slate-700 mt-0.5 font-medium">{formatDateTime(request.scheduled_at)}</p>
            </div>
          )}
        </div>
      </div>

      {currentType && details?.fields?.map((group, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Details{details.fields.length > 1 ? ` — Entry ${i + 1}` : ''}
          </h3>
          <RequestDynamicFields fields={currentType.fields} mode="read" values={group} />
        </div>
      ))}

      {lines.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Items Requested</h3>
          <ul className="divide-y divide-slate-100">
            {lines.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">{l.description}</span>
                <span className="text-slate-500 font-medium">×{l.qty}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">History</h3>
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-400">No activity yet.</p>
        ) : (
          <ol className="space-y-3">
            {timeline.map((e) => (
              <li key={e.id} className="flex items-start gap-3">
                {e.event_type === 'created' ? (
                  <FilePlus className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-sm text-slate-700">{e.summary}</p>
                  <p className="text-xs text-slate-400">{formatDate(e.created_at)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
