import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getMyRequests } from '../../api/requests'
import type { DealerRequest } from '../../api/types'
import StatusBadge from '../../components/badges/StatusBadge'
import PriorityBadge from '../../components/badges/PriorityBadge'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import { formatDate } from '../../lib/formatDate'
import { Plus } from 'lucide-react'

export default function DealerRequestsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dealer-my-requests'],
    queryFn: () => getMyRequests(),
  })

  const requests: DealerRequest[] = data?.items ?? []

  const filtered = requests.filter((r) =>
    !search ||
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.ref_no.toLowerCase().includes(search.toLowerCase())
  )

  if (isError) return <Alert type="danger" message="Failed to load requests." onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">My Requests</h2>
          <p className="text-sm text-slate-500">{requests.length} total</p>
        </div>
        <button
          onClick={() => navigate('/dealer/requests/new')}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> New Request
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by title or reference…"
        className="w-full max-w-sm border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm">No requests found.</p>
          <button onClick={() => navigate('/dealer/requests/new')} className="mt-3 text-indigo-600 text-sm hover:underline">
            Submit your first request
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Reference', 'Type', 'Title', 'Status', 'Priority', 'Created', 'Due'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/dealer/requests/${r.id}`)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.ref_no}</td>
                  <td className="px-4 py-3 text-slate-600">{r.type_name}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate">{r.title}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={r.priority} /></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{r.due_at ? formatDate(r.due_at) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
