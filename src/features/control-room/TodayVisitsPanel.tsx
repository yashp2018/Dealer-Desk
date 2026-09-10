import DataTable from '../../components/tables/DataTable'
import { useNavigate } from 'react-router-dom'
import { formatDateTime } from '../../lib/formatDate'

interface Visit { id: number; ref: string; dealer_name: string; visit_type: string; scheduled_at: string; status: string; owner_name: string }

export default function TodayVisitsPanel({ visits }: { visits: Visit[] }) {
  const nav = useNavigate()
  const today = new Date().toDateString()
  const todayVisits = visits.filter((v) => new Date(v.scheduled_at).toDateString() === today)
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">📍 Today's Visits ({todayVisits.length})</h3>
      <DataTable
        rows={todayVisits}
        onRowClick={(v) => nav(`/visits/${v.id}`)}
        columns={[
          { label: 'Ref', render: (v) => <span className="font-mono text-xs">{v.ref}</span> },
          { label: 'Dealer', field: 'dealer_name' },
          { label: 'Type', field: 'visit_type' },
          { label: 'Time', render: (v) => <span className="text-xs">{formatDateTime(v.scheduled_at)}</span> },
          { label: 'Owner', field: 'owner_name' },
        ]}
        emptyMessage="No visits today."
      />
    </div>
  )
}
