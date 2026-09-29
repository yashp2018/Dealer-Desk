import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useRequests, useDeleteRequest } from '../../hooks/useRequests'
import { useBootstrap } from '../../hooks/useBootstrap'
import { useAuth } from '../../hooks/useAuth'
import { useUiStore } from '../../stores/uiStore'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import ConfirmModal from '../../components/modals/ConfirmModal'
import { formatDate } from '../../lib/formatDate'
import { overdueDays } from '../../lib/overdueDays'
import type { Request } from '../../api/types'

const PAGE_SIZE = 20

const STAGE_STYLES: Record<string, string> = {
  new: 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20',
  open: 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20',
  in_progress: 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  waiting_dealer: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  waiting_internal: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  done: 'bg-slate-100 text-slate-600 ring-1 ring-slate-500/10',
  cancelled: 'bg-rose-50 text-rose-600 ring-1 ring-rose-600/10',
}

const PRIORITY_LABELS: Record<string, string> = { '1': 'P1 · Critical', '2': 'P2 · High', '3': 'P3 · Normal', '4': 'P4 · Low' }

function respondByLabel(dueAt: string | null): { label: string; overdue: boolean } {
  if (!dueAt) return { label: '—', overdue: false }
  const overdue = new Date(dueAt).getTime() < Date.now()
  if (overdue) {
    const days = overdueDays(dueAt)
    return { label: days <= 1 ? '1 day overdue' : `${days} days overdue`, overdue: true }
  }
  const hours = Math.round((new Date(dueAt).getTime() - Date.now()) / 3_600_000)
  if (hours < 24) return { label: `${Math.max(hours, 1)}h left`, overdue: false }
  return { label: `${Math.round(hours / 24)}d left`, overdue: false }
}

export default function RequestsListPage() {
  const nav = useNavigate()
  const { data: bs } = useBootstrap()
  // requests.delete is admin-only server-side (see request.routes.ts) — the
  // `staff` object from /auth/login never carries raw permissions (those
  // live only inside the JWT), so this mirrors that same boundary via role,
  // matching how every other admin-gated control in this app is shown/hidden.
  const { isAdmin } = useAuth()
  const canDelete = isAdmin
  const deleteRequest = useDeleteRequest()
  const addToast = useUiStore((s) => s.addToast)
  const [pendingDelete, setPendingDelete] = useState<Request | null>(null)
  const [search, setSearch] = useState('')
  const [typeId, setTypeId] = useState('')
  const [priority, setPriority] = useState('')
  const [openOnly, setOpenOnly] = useState(true)
  const [page, setPage] = useState(1)

  const confirmDelete = () => {
    if (!pendingDelete) return
    deleteRequest.mutate(String(pendingDelete.id), {
      onSuccess: () => { addToast(`${pendingDelete.ref_no || pendingDelete.ref} deleted`, 'success'); setPendingDelete(null) },
      onError: (e) => { addToast(e.message ?? 'Failed to delete request', 'error'); setPendingDelete(null) },
    })
  }

  const params: Record<string, string> = { page: String(page), limit: String(PAGE_SIZE) }
  if (search) params.q = search
  if (typeId) params.type_id = typeId
  if (priority) params.priority = priority

  const { data, isLoading, isError, refetch } = useRequests(params)
  const requests: Request[] = (data as { items?: Request[] })?.items ?? (Array.isArray(data) ? data as Request[] : [])
  const total = (data as { meta?: { total?: number } })?.meta?.total ?? requests.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const visible = openOnly ? requests.filter((r) => !['done', 'cancelled'].includes(r.status)) : requests

  if (isError) return <Alert type="danger" message="Failed to load requests." onRetry={refetch} />

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Orders &amp; Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">Everything the desk has been asked for.</p>
        </div>
        <button
          onClick={() => nav('/requests/new')}
          className="flex items-center gap-2 bg-teal-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-teal-800 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" /> New order
        </button>
      </div>

      {/* Filter bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); setPage(1) }}
        className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-2"
      >
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search"
          className="flex-1 min-w-[180px] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/40 focus:border-teal-600"
        />
        <select
          value={typeId}
          onChange={(e) => { setTypeId(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-600/40 focus:border-teal-600"
        >
          <option value="">All types</option>
          {bs?.types?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select
          value={priority}
          onChange={(e) => { setPriority(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-600/40 focus:border-teal-600"
        >
          <option value="">Priority</option>
          {Object.entries(PRIORITY_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <select
          value={openOnly ? 'open' : 'all'}
          onChange={(e) => { setOpenOnly(e.target.value === 'open'); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-600/40 focus:border-teal-600"
        >
          <option value="open">Open only</option>
          <option value="all">All statuses</option>
        </select>
        <button
          type="submit"
          className="flex items-center gap-1.5 bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors"
        >
          <Search className="h-3.5 w-3.5" /> Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Reference', 'Dealer', 'Type', 'Stage', 'Promised for', 'Owner', 'Respond by', ...(canDelete ? [''] : [])].map((h) => (
                  <th key={h || 'actions'} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={canDelete ? 8 : 7} className="py-16"><div className="flex justify-center"><Spinner size="lg" /></div></td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan={canDelete ? 8 : 7} className="py-16 text-center text-sm text-slate-400">Nothing here.</td></tr>
              ) : (
                visible.map((r) => {
                  const respond = respondByLabel(r.due_at)
                  return (
                    <tr key={r.id} onClick={() => nav(`/requests/${r.id}`)} className="cursor-pointer hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{r.ref_no || r.ref}</td>
                      <td className="px-4 py-3 text-slate-700">{r.dealer_name || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{r.type_name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_STYLES[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {(bs?.statuses as Record<string, string> | undefined)?.[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{r.due_at ? formatDate(r.due_at) : '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{r.owner_name || <span className="text-slate-400">Unassigned</span>}</td>
                      <td className={`px-4 py-3 text-xs font-medium whitespace-nowrap ${respond.overdue ? 'text-rose-600' : 'text-slate-500'}`}>{respond.label}</td>
                      {canDelete && (
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            aria-label={`Delete ${r.ref_no || r.ref}`}
                            onClick={(e) => { e.stopPropagation(); setPendingDelete(r) }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-1 text-sm">
          <button
            disabled={page === 1} onClick={() => setPage((p) => p - 1)}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-3 text-slate-500">Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {pendingDelete && (
        <ConfirmModal
          title="Delete this request?"
          message={`${pendingDelete.ref_no || pendingDelete.ref} (${pendingDelete.dealer_name || 'no dealer'}) will be permanently deleted, including its field values, lines, and escalation history. This cannot be undone.`}
          confirmLabel="Delete"
          loading={deleteRequest.isPending}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
