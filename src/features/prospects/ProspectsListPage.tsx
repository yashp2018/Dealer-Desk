import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useProspects } from '../../hooks/useProspects'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import { relativeTime } from '../../lib/relativeTime'

const STAGES = ['new', 'contacted', 'qualified', 'visit_planned', 'visit_completed', 'onboarding', 'approved'] as const
const CLOSED = ['converted', 'dropped'] as const
const ALL_STAGES = [...STAGES, ...CLOSED]

// Friendlier column labels where a clean mapping exists — every real backend
// stage still gets its own column (nothing is merged or hidden), just with
// wording that matches how the desk actually talks about the pipeline.
const STAGE_LABELS: Record<string, string> = {
  new: 'Enquiry received',
  contacted: 'Contacted',
  qualified: 'Qualified',
  visit_planned: 'Visit planned',
  visit_completed: 'Visited',
  onboarding: 'Onboarding',
  approved: 'Approved',
  converted: 'Appointed',
  dropped: 'Not proceeding',
}

export default function ProspectsListPage() {
  const nav = useNavigate()
  const { data = [], isLoading, isError, refetch } = useProspects()

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError) return <Alert type="danger" message="Failed to load prospects." onRetry={refetch} />

  const board = ALL_STAGES.reduce<Record<string, typeof data>>((acc, s) => {
    acc[s] = data.filter((p) => p.stage === s)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Prospect Pipeline</h1>
          <p className="text-sm text-gray-500 mt-0.5">Enquiries on their way to becoming appointed dealers.</p>
        </div>
        <button
          onClick={() => nav('/prospects/new')}
          className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-full hover:bg-gray-50 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" /> New Prospect
        </button>
      </div>

      {/* Pipeline board */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {ALL_STAGES.map((stage) => {
            const isClosed = (CLOSED as readonly string[]).includes(stage)
            return (
              <div key={stage} className={`w-56 shrink-0 rounded-xl border border-gray-200 bg-white overflow-hidden ${isClosed ? 'opacity-80' : ''}`}>
                <div className="flex items-center justify-between px-3.5 py-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-800">{STAGE_LABELS[stage] ?? stage.replace('_', ' ')}</span>
                  <span className="text-sm font-semibold text-gray-400">{board[stage].length}</span>
                </div>
                <div className="p-2.5 space-y-2 min-h-20 bg-gray-50/60">
                  {board[stage].length === 0 && <p className="text-sm text-gray-300 text-center py-5">None</p>}
                  {board[stage].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => nav(`/prospects/${p.id}`)}
                      className="w-full text-left bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg p-3 transition-colors shadow-sm"
                    >
                      <p className="text-sm font-semibold text-gray-800 truncate">{p.company_name}</p>
                      <p className="text-xs text-gray-400 truncate mt-1">{[p.city, p.state_normalized].filter(Boolean).join(', ') || '—'}</p>
                      <p className="text-xs text-gray-400 mt-1.5">{relativeTime(p.stage_changed_at)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
