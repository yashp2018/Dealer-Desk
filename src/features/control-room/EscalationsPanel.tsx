import DataTable from '../../components/tables/DataTable'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../../components/badges/StatusBadge'

interface Request { id: number; ref: string; title: string; status: string; dealer_name: string; owner_name: string; is_overdue: boolean; priority: number }

export default function EscalationsPanel({ requests }: { requests: Request[] }) {
  const nav = useNavigate()
  const escalated = requests.filter((r) => r.is_overdue && r.priority === 1)
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">🚨 Escalations ({escalated.length})</h3>
      <DataTable
        rows={escalated}
        onRowClick={(r) => nav(`/requests/${r.id}`)}
        columns={[
          { label: 'Ref', render: (r) => <span className="font-mono text-xs">{r.ref}</span> },
          { label: 'Title', field: 'title' },
          { label: 'Dealer', field: 'dealer_name' },
          { label: 'Owner', field: 'owner_name' },
          { label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
        ]}
        emptyMessage="No escalations."
      />
    </div>
  )
}
