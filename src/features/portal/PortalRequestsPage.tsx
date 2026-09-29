import { useNavigate } from 'react-router-dom'
import { Plus, FileText } from 'lucide-react'
import { useMyRequests } from '../../hooks/usePortal'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import { relativeTime } from '../../lib/relativeTime'
import { formatDateTime } from '../../lib/formatDate'

const STATUS_COLORS: Record<string, string> = {
  Received: 'bg-slate-100 text-slate-600',
  'In Progress': 'bg-amber-100 text-amber-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-600',
}

export default function PortalRequestsPage() {
  const nav = useNavigate()
  const { data: requests = [], isLoading, isError, refetch } = useMyRequests()

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError) return <Alert type="danger" message="Failed to load your requests." onRetry={refetch} />

  const sorted = [...requests].sort((a, b) => b.created_at.localeCompare(a.created_at))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">My Requests</h1>
        <button onClick={() => nav('/portal/requests/new')} className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-3 py-2 rounded-xl hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <FileText className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No requests yet.</p>
          <button onClick={() => nav('/portal/requests/new')} className="mt-3 text-indigo-600 text-sm hover:underline font-medium">
            Submit your first request
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {sorted.map((r) => (
            <button key={r.id} onClick={() => nav(`/portal/requests/${r.id}`)} className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{r.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{r.ref_no} · {r.type_name} · {relativeTime(r.created_at)}</p>
                {r.scheduled_at && <p className="text-xs text-indigo-500 mt-0.5">Requested for {formatDateTime(r.scheduled_at)}</p>}
              </div>
              <span className={`shrink-0 ml-3 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] ?? 'bg-slate-100 text-slate-600'}`}>{r.status}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
