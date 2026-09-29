import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useVisits } from '../../hooks/useVisits'
import DataTable from '../../components/tables/DataTable'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import { formatDateTime, toLocalDateKey, todayForDateInput } from '../../lib/formatDate'

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
}

const WINDOWS = [
  { key: 'upcoming', label: 'Coming up' },
  { key: 'today', label: 'Today' },
  { key: 'past', label: 'Already run' },
] as const

type Window = (typeof WINDOWS)[number]['key']

export default function VisitsCalendarPage() {
  const nav = useNavigate()
  const { data = [], isLoading, isError, refetch } = useVisits()
  const [when, setWhen] = useState<Window>('upcoming')

  const visible = useMemo(() => {
    const today = todayForDateInput()
    return data.filter((v) => {
      const d = toLocalDateKey(v.scheduled_at)
      if (when === 'today') return d === today
      if (when === 'past') return d < today
      return d >= today // upcoming — today onward, same as the legacy app's "Coming up"
    })
  }, [data, when])

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError) return <Alert type="danger" message="Failed to load visits." onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Visits</h1>
          <p className="text-sm text-slate-500 mt-0.5">A plant tour, a dealer meeting, a delivery — anything you have agreed to turn up for.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1 text-sm">
            {WINDOWS.map((w) => (
              <button
                key={w.key}
                type="button"
                onClick={() => setWhen(w.key)}
                className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
                  when === w.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => nav('/visits/new')}
            className="flex items-center gap-2 bg-teal-800 text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-teal-900 transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" /> Book a visit
          </button>
        </div>
      </div>
      <DataTable
        rows={visible}
        onRowClick={(v) => nav(`/visits/${v.id}`)}
        columns={[
          { label: 'Ref', render: (v) => <span className="font-mono text-xs">{v.ref}</span> },
          { label: 'Dealer', field: 'dealer_name' },
          { label: 'Type', field: 'visit_type' },
          { label: 'Scheduled', render: (v) => <span className="text-xs">{formatDateTime(v.scheduled_at)}</span> },
          { label: 'Status', render: (v) => <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[v.status] ?? 'bg-gray-100 text-gray-600'}`}>{v.status}</span> },
          { label: 'Owner', field: 'owner_name' },
        ]}
        emptyMessage={when === 'today' ? 'No visits today.' : when === 'past' ? 'No past visits.' : 'Nothing coming up.'}
      />
    </div>
  )
}
