import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/tables/DataTable'
import StatusBadge from '../../components/badges/StatusBadge'
import PriorityBadge from '../../components/badges/PriorityBadge'
import { formatDate } from '../../lib/formatDate'

interface Request { id: number; ref: string; title: string; status: string; priority: number; dealer_name: string; due_at: string }

export default function UrgentRequestsPanel({ requests }: { requests: Request[] }) {
  const nav = useNavigate()
  const urgent = requests.filter((r) => r.priority === 1 && !['done', 'cancelled'].includes(r.status))
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">🔴 Urgent Requests ({urgent.length})</h3>
      <DataTable
        rows={urgent}
        onRowClick={(r) => nav(`/requests/${r.id}`)}
        columns={[
          { label: 'Ref', render: (r) => <span className="font-mono text-xs">{r.ref}</span> },
          { label: 'Title', field: 'title' },
          { label: 'Dealer', field: 'dealer_name' },
          { label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { label: 'Priority', render: (r) => <PriorityBadge priority={r.priority} /> },
          { label: 'Due', render: (r) => <span className="text-xs text-red-600">{formatDate(r.due_at)}</span> },
        ]}
        emptyMessage="No urgent requests."
      />
    </div>
  )
}
