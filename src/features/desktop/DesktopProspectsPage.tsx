/**
 * Desktop — Prospects pipeline  (mirrors desktop/prospects.php)
 * Kanban board: stage columns · prospect cards (company · city · owner · relative time)
 */
import { useNavigate } from 'react-router-dom'
import { useProspects } from '../../hooks/useProspects'
import { useBootstrap } from '../../hooks/useBootstrap'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import { relativeTime } from '../../lib/relativeTime'
import { Plus } from 'lucide-react'

const STAGES = ['received', 'contacted', 'visit_planned', 'visited', 'onboarding'] as const
const CLOSED = ['converted', 'dropped'] as const
const ALL_STAGES = [...STAGES, ...CLOSED]

const stageLabel: Record<string, string> = {
  received: 'Received', contacted: 'Contacted', visit_planned: 'Visit Planned',
  visited: 'Visited', onboarding: 'Onboarding', converted: 'Converted', dropped: 'Dropped',
}

const stageColors: Record<string, string> = {
  received: 'bg-gray-100 text-gray-600',
  contacted: 'bg-blue-100 text-blue-700',
  visit_planned: 'bg-purple-100 text-purple-700',
  visited: 'bg-indigo-100 text-indigo-700',
  onboarding: 'bg-amber-100 text-amber-700',
  converted: 'bg-green-100 text-green-700',
  dropped: 'bg-red-100 text-red-600',
}

export default function DesktopProspectsPage() {
  const nav = useNavigate()
  const { data = [], isLoading, isError, refetch } = useProspects()
  const { data: bs } = useBootstrap()

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError) return <Alert type="danger" message="Failed to load prospects." onRetry={refetch} />

  type Prospect = typeof data[0]
  const board = ALL_STAGES.reduce<Record<string, Prospect[]>>((acc, s) => {
    acc[s] = (data as Prospect[]).filter((p) => p.stage === s)
    return acc
  }, {})

  const staffName = (id: number) => bs?.staff?.find((s) => s.id === id)?.name ?? `#${id}`

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-800">Pipeline</h1>
        <button onClick={() => nav('/prospects/new')}
          className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> New Prospect
        </button>
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {ALL_STAGES.map((stage) => {
            const isClosed = (CLOSED as readonly string[]).includes(stage)
            return (
              <div key={stage}
                className={`w-52 shrink-0 rounded-xl border bg-white ${isClosed ? 'border-gray-100 opacity-60' : 'border-gray-200'}`}>
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stageColors[stage]}`}>
                    {stageLabel[stage]}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">{board[stage].length}</span>
                </div>
                {/* Cards */}
                <div className="p-2 space-y-2 min-h-16">
                  {board[stage].length === 0 && (
                    <p className="text-xs text-gray-300 text-center py-3">—</p>
                  )}
                  {board[stage].map((p) => (
                    <button key={p.id} onClick={() => nav(`/desktop/prospects/${p.id}`)}
                      className="w-full text-left bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-lg p-2.5 transition-colors">
                      <p className="text-xs font-semibold text-gray-800 truncate">{p.company_name}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {[p.city, p.state_normalized].filter(Boolean).join(', ')}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {staffName(p.owner_staff_id)} · {relativeTime(p.stage_changed_at)}
                      </p>
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
