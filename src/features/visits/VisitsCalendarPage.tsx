import { useNavigate } from 'react-router-dom'
import { useVisits } from '../../hooks/useVisits'
import DataTable from '../../components/tables/DataTable'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import { formatDateTime } from '../../lib/formatDate'

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
}

export default function VisitsCalendarPage() {
  const nav = useNavigate()
  const { data = [], isLoading, isError, refetch } = useVisits()

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError) return <Alert type="danger" message="Failed to load visits." onRetry={refetch} />

  return (
    <div className="space-y-4">
      <DataTable
        rows={data as { id: number; ref: string; dealer_name: string; visit_type: string; scheduled_at: string; status: string; owner_name: string }[]}
        onRowClick={(v) => nav(`/visits/${v.id}`)}
        columns={[
          { label: 'Ref', render: (v) => <span className="font-mono text-xs">{v.ref}</span> },
          { label: 'Dealer', field: 'dealer_name' },
          { label: 'Type', field: 'visit_type' },
          { label: 'Scheduled', render: (v) => <span className="text-xs">{formatDateTime(v.scheduled_at)}</span> },
          { label: 'Status', render: (v) => <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[v.status] ?? 'bg-gray-100 text-gray-600'}`}>{v.status}</span> },
          { label: 'Owner', field: 'owner_name' },
        ]}
        emptyMessage="No visits scheduled."
      />
    </div>
  )
}
