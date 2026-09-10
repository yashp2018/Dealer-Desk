/**
 * Desktop — Requests list  (mirrors desktop/requests.php)
 * Filters: search · type · priority · status
 * Table: ref+priority pill · dealer+city · type+title · status · owner · due/late · progress segments
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRequests } from '../../hooks/useRequests'
import { useBootstrap } from '../../hooks/useBootstrap'
import PriorityBadge from '../../components/badges/PriorityBadge'
import StatusBadge from '../../components/badges/StatusBadge'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import { formatDate } from '../../lib/formatDate'
import { overdueDays } from '../../lib/overdueDays'
import { Plus } from 'lucide-react'

export default function DesktopRequestsPage() {
  const nav = useNavigate()
  const { data = [], isLoading, isError, refetch } = useRequests()
  const { data: bs } = useBootstrap()
  const [search, setSearch] = useState('')
  const [typeId, setTypeId] = useState('')
  const [priority, setPriority] = useState('')
  const [status, setStatus] = useState('')

  if (isError) return <Alert type="danger" message="Failed to load requests." onRetry={refetch} />

  type Req = typeof data[0]
  const filtered = (data as Req[]).filter((r) =>
    (!search || r.title.toLowerCase().includes(search.toLowerCase()) || r.ref.toLowerCase().includes(search.toLowerCase())) &&
    (!typeId || String(r.type_id) === typeId) &&
    (!priority || String(r.priority) === priority) &&
    (!status || r.status === status)
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-800">Requests</h1>
        <button onClick={() => nav('/requests/new')}
          className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> New Request
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52" />
        <select value={typeId} onChange={(e) => setTypeId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Types</option>
          {bs?.types?.map((t) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Priority</option>
          <option value="1">P1 — Critical</option>
          <option value="2">P2 — High</option>
          <option value="3">P3 — Normal</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Open Only</option>
          <option value="all">All Statuses</option>
          {Object.entries(bs?.statuses ?? {}).map(([k, v]) => (
            <option key={k} value={k}>{v as string}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Ref', 'Dealer', 'Type', 'Status', 'Owner', 'Due', ''].map((h, i) => (
                  <th key={i} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-400 py-10 text-sm">No requests.</td></tr>
              )}
              {filtered.map((r) => {
                const late = r.is_overdue && !['done', 'cancelled'].includes(r.status)
                const days = late && r.due_at ? overdueDays(r.due_at) : 0
                return (
                  <tr key={r.id} onClick={() => nav(`/requests/${r.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <PriorityBadge priority={r.priority} />
                        <span className="font-mono text-xs text-gray-600">{r.ref}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{r.dealer_name}</p>
                      <p className="text-xs text-gray-400">{r.dealer_city}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{r.type_name}</p>
                      {r.title && <p className="text-xs text-gray-400">{r.title}</p>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-gray-600">{r.owner_name}</td>
                    <td className="px-4 py-3">
                      {late
                        ? <span className="text-red-600 font-medium text-xs">{days <= 1 ? '1 day late' : `${days} days late`}</span>
                        : <span className="text-gray-400 text-xs">{r.due_at ? formatDate(r.due_at) : '—'}</span>}
                    </td>
                    {/* Progress segments */}
                    <td className="px-4 py-3">
                      {r.completion_required > 0 && (
                        <div className="flex gap-0.5">
                          {Array.from({ length: r.completion_required }).map((_, i) => (
                            <span key={i} className={`h-2 w-3 rounded-sm ${i < r.completion_done ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
