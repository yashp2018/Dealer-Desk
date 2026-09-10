import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/tables/DataTable'
import StatusBadge from '../../components/badges/StatusBadge'
import { overdueDays } from '../../lib/overdueDays'

interface Request { id: number; ref: string; title: string; status: string; dealer_name: string; due_at: string; is_overdue: boolean }

export default function SlaAlertsPanel({ requests }: { requests: Request[] }) {
  const nav = useNavigate()
  const overdue = requests.filter((r) => r.is_overdue && !['done', 'cancelled'].includes(r.status))
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">⏰ SLA Breaches ({overdue.length})</h3>
      <DataTable
        rows={overdue}
        onRowClick={(r) => nav(`/requests/${r.id}`)}
        columns={[
          { label: 'Ref', render: (r) => <span className="font-mono text-xs">{r.ref}</span> },
          { label: 'Title', field: 'title' },
          { label: 'Dealer', field: 'dealer_name' },
          { label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { label: 'Overdue', render: (r) => <span className="text-xs text-red-600 font-medium">{overdueDays(r.due_at)}d</span> },
        ]}
        emptyMessage="No SLA breaches."
      />
    </div>
  )
}
