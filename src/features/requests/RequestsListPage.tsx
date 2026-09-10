import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRequests } from '../../hooks/useRequests'
import DataTable from '../../components/tables/DataTable'
import StatusBadge from '../../components/badges/StatusBadge'
import PriorityBadge from '../../components/badges/PriorityBadge'
import SearchFilterBar from '../../components/filters/SearchFilterBar'
import Pagination from '../../components/pagination/Pagination'
import Alert from '../../components/alerts/Alert'
import { formatDate } from '../../lib/formatDate'
import { Plus } from 'lucide-react'
import type { Request } from '../../api/types'

const PAGE_SIZE = 20

export default function RequestsListPage() {
  const nav = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const params: Record<string, string> = { page: String(page), limit: String(PAGE_SIZE) }
  if (search) params.q = search
  if (statusFilter) params.status = statusFilter

  const { data, isLoading, isError, refetch } = useRequests(params)
  const requests: Request[] = (data as { items?: Request[] })?.items ?? (Array.isArray(data) ? data as Request[] : [])
  const total = (data as { meta?: { total?: number } })?.meta?.total ?? requests.length
  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (isError) return <Alert type="danger" message="Failed to load requests." onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SearchFilterBar
          search={search} onSearch={(v) => { setSearch(v); setPage(1) }}
          filters={[{ key: 'status', placeholder: 'All Statuses', value: statusFilter, onChange: (v) => { setStatusFilter(v); setPage(1) }, options: [{ value: 'new', label: 'New' }, { value: 'open', label: 'Open' }, { value: 'pending', label: 'Pending' }, { value: 'done', label: 'Done' }, { value: 'cancelled', label: 'Cancelled' }] }]}
        />
        <button onClick={() => nav('/requests/new')} className="flex items-center gap-2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> New Request
        </button>
      </div>
      <DataTable
        loading={isLoading}
        rows={requests}
        onRowClick={(r) => nav(`/requests/${r.id}`)}
        columns={[
          { label: 'Ref', render: (r) => <span className="font-mono text-xs">{r.ref}</span> },
          { label: 'Priority', render: (r) => <PriorityBadge priority={r.priority} /> },
          { label: 'Title', field: 'title' },
          { label: 'Dealer', field: 'dealer_name' },
          { label: 'Type', field: 'type_name' },
          { label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { label: 'Owner', field: 'owner_name' },
          { label: 'Due', render: (r) => <span className={`text-xs ${r.is_overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>{formatDate(r.due_at ?? '')}</span> },
        ]}
      />
      <div className="flex justify-end"><Pagination current={page} total={totalPages} onChange={setPage} /></div>
    </div>
  )
}
