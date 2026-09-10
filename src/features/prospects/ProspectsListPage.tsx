import { useNavigate } from 'react-router-dom'
import { useProspects } from '../../hooks/useProspects'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import { relativeTime } from '../../lib/relativeTime'

const STAGES = ['received', 'contacted', 'visit_planned', 'visited', 'onboarding'] as const
const CLOSED = ['converted', 'dropped'] as const
const ALL_STAGES = [...STAGES, ...CLOSED]

const stageColors: Record<string, string> = {
  received: 'bg-gray-100 text-gray-600',
  contacted: 'bg-blue-100 text-blue-700',
  visit_planned: 'bg-purple-100 text-purple-700',
  visited: 'bg-indigo-100 text-indigo-700',
  onboarding: 'bg-amber-100 text-amber-700',
  converted: 'bg-green-100 text-green-700',
  dropped: 'bg-red-100 text-red-600',
}

export default function ProspectsListPage() {
  const nav = useNavigate()
  const { data = [], isLoading, isError, refetch } = useProspects()

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError) return <Alert type="danger" message="Failed to load prospects." onRetry={refetch} />

  const board = ALL_STAGES.reduce<Record<string, typeof data>>((acc, s) => {
    acc[s] = data.filter(p => p.stage === s)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Pipeline board — matches PHP dd-pipeline kanban */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {ALL_STAGES.map((stage) => {
            const isClosed = (CLOSED as readonly string[]).includes(stage)
            return (
              <div key={stage} className={`w-52 shrink-0 rounded-xl border ${isClosed ? 'border-gray-100 opacity-60' : 'border-gray-200'} bg-white`}>
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stageColors[stage]}`}>{stage.replace('_', ' ')}</span>
                  <span className="text-xs text-gray-400 font-medium">{board[stage].length}</span>
                </div>
                <div className="p-2 space-y-2 min-h-16">
                  {board[stage].length === 0 && <p className="text-xs text-gray-300 text-center py-3">—</p>}
                  {board[stage].map((p) => (
                    <button key={p.id} onClick={() => nav(`/prospects/${p.id}`)}
                      className="w-full text-left bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-lg p-2.5 transition-colors">
                      <p className="text-xs font-semibold text-gray-800 truncate">{p.company_name}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{[p.city, p.state_normalized].filter(Boolean).join(', ')}</p>
                      <p className="text-xs text-gray-400 mt-1">{relativeTime(p.stage_changed_at)}</p>
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
