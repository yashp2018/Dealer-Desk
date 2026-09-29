/**
 * Desktop — Request detail  (mirrors desktop/request_detail.php)
 * Identity header · facts strip · progress rail · run steps · context column
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRequest, useRequestDetails, useRequestTimeline, useRequestMutations, useRequestLines } from '../../hooks/useRequests'
import { useBootstrap } from '../../hooks/useBootstrap'
import RequestDynamicFields from '../requests/RequestDynamicFields'
import StatusBadge from '../../components/badges/StatusBadge'
import PriorityBadge from '../../components/badges/PriorityBadge'
import Timeline from '../../components/timeline/Timeline'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import Breadcrumb from '../../layouts/Breadcrumb'
import { useUiStore } from '../../stores/uiStore'
import { formatDateTime } from '../../lib/formatDate'
import { overdueDays } from '../../lib/overdueDays'

const STEP_STATES = ['done', 'current', 'locked', 'skipped'] as const
type StepState = typeof STEP_STATES[number]

function StepBadge({ state }: { state: StepState }) {
  const cls: Record<StepState, string> = {
    done: 'bg-green-100 text-green-700',
    current: 'bg-indigo-100 text-indigo-700',
    locked: 'bg-gray-100 text-gray-400',
    skipped: 'bg-gray-50 text-gray-300',
  }
  const labels: Record<StepState, string> = { done: 'Done', current: 'In Progress', locked: 'Locked', skipped: 'N/A' }
  return <span className={`text-xs px-2 py-0.5 rounded font-medium ${cls[state]}`}>{labels[state]}</span>
}

export default function DesktopRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: req, isLoading, isError } = useRequest(id!)
  const { data: details } = useRequestDetails(id!)
  const { data: timeline = [] } = useRequestTimeline(id!)
  const { data: lines = [] } = useRequestLines(id!)
  const { data: bs } = useBootstrap()
  const mutations = useRequestMutations(id!)
  const addToast = useUiStore((s) => s.addToast)
  const [note, setNote] = useState('')
  const [ownerStaffId, setOwnerStaffId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [handlingPriority, setHandlingPriority] = useState('')

  useEffect(() => {
    if (req) {
      setOwnerStaffId(req.owner_staff_id ? String(req.owner_staff_id) : '')
      setScheduledAt(req.scheduled_at ? req.scheduled_at.slice(0, 16) : '')
      setHandlingPriority(String(req.priority))
    }
  }, [req?.id, req?.owner_staff_id, req?.scheduled_at, req?.priority])

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError || !req) return <Alert type="danger" message="Request not found." />

  const currentType = bs?.types?.find((t) => t.id === req.type_id)
  const transitions: string[] = (bs?.transitions as Record<string, string[]> | undefined)?.[req.status] ?? []
  const isOpen = !['done', 'cancelled'].includes(req.status)
  const late = req.is_overdue && isOpen
  const days = late && req.due_at ? overdueDays(req.due_at) : 0
  const required = req.completion_required ?? 0
  const filled = req.completion_done ?? 0
  const complete = required === 0 || filled >= required

  // Derive step states from request status
  const assignState: StepState = req.owner_staff_id ? 'done' : 'current'
  const detailsState: StepState = complete ? 'done' : isOpen ? 'current' : 'locked'
  const pushState: StepState = !complete ? 'locked' : req.status === 'done' ? 'done' : 'current'
  const closeState: StepState = req.status === 'done' ? 'done' : complete ? 'current' : 'locked'

  const steps = [
    { n: 1, label: 'Capture', state: 'done' as StepState, detail: 'Request created' },
    { n: 2, label: 'Assign & Schedule', state: assignState, detail: req.owner_name ?? 'Unassigned' },
    { n: 3, label: 'Details', state: detailsState, detail: `${filled}/${required} filled` },
    { n: 4, label: 'Push to ERP', state: pushState, detail: currentType?.push_target ?? '—' },
    { n: 5, label: 'Close', state: closeState, detail: '' },
  ]

  const handleStatus = (status: string) =>
    mutations.setStatus.mutate(status, { onSuccess: () => addToast('Status updated', 'success') })

  const handleNote = () => {
    if (!note.trim()) return
    mutations.addNote.mutate(note, { onSuccess: () => { setNote(''); addToast('Note added', 'success') } })
  }

  return (
    <div className="space-y-4 max-w-7xl">
      <Breadcrumb crumbs={[{ label: 'Requests', to: '/desktop/requests' }, { label: req.ref }]} />

      {/* Identity header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PriorityBadge priority={req.priority} />
              <span className="font-mono text-sm text-gray-500">{req.ref}</span>
            </div>
            <h1 className="text-lg font-bold text-gray-800">{req.dealer_name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {req.type_name}{req.title && ` · ${req.title}`}
            </p>
          </div>
          {/* Facts strip */}
          <div className="flex flex-wrap gap-6 text-sm">
            <div><p className="text-xs text-gray-400 mb-0.5">Status</p><StatusBadge status={req.status} /></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Owner</p><p className="text-gray-700">{req.owner_name ?? <span className="text-gray-400">Unassigned</span>}</p></div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Due</p>
              <p className="text-gray-700">{req.due_at ? formatDateTime(req.due_at) : '—'}</p>
              {late && <p className="text-xs text-red-600 font-medium">{days <= 1 ? '1 day late' : `${days} days late`}</p>}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Checklist</p>
              {required === 0
                ? <span className="text-gray-400 text-xs">None</span>
                : (
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: required }).map((_, i) => (
                        <span key={i} className={`h-2 w-3 rounded-sm ${i < filled ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{filled}/{required}</span>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress rail */}
      <ol className="flex items-center gap-0 bg-white rounded-xl border border-gray-200 px-5 py-3 overflow-x-auto">
        {steps.map((step, idx) => (
          <li key={step.n} className="flex items-center gap-0 shrink-0">
            <div className="flex items-center gap-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                ${step.state === 'done' ? 'bg-green-500 text-white' : step.state === 'current' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {step.state === 'done' ? '✓' : step.n}
              </span>
              <div>
                <p className={`text-xs font-medium ${step.state === 'locked' || step.state === 'skipped' ? 'text-gray-400' : 'text-gray-700'}`}>{step.label}</p>
                {step.detail && <p className="text-xs text-gray-400">{step.detail}</p>}
              </div>
            </div>
            {idx < steps.length - 1 && <span className="mx-3 text-gray-300 text-lg">›</span>}
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Run column ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Step 2 — Assign & Schedule */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">2</span>
                <span className="text-sm font-semibold text-gray-700">Assign & Schedule</span>
              </div>
              <StepBadge state={assignState} />
            </div>
            <div className="p-5">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Owner</label>
                  <select value={ownerStaffId} onChange={(e) => setOwnerStaffId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Unassigned</option>
                    {bs?.staff?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Schedule</label>
                  <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Priority</label>
                  <select value={handlingPriority} onChange={(e) => setHandlingPriority(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value={1}>P1 — Critical</option>
                    <option value={2}>P2 — High</option>
                    <option value={3}>P3 — Normal</option>
                  </select>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => mutations.saveHandling.mutate(
                    {
                      owner_staff_id: ownerStaffId || undefined,
                      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
                      priority: handlingPriority ? Number(handlingPriority) : undefined,
                    },
                    {
                      onSuccess: () => addToast('Handling saved', 'success'),
                      onError: () => addToast('Failed to save handling', 'error'),
                    },
                  )}
                  disabled={mutations.saveHandling.isPending}
                  className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {mutations.saveHandling.isPending ? 'Saving…' : 'Save Handling'}
                </button>
              </div>
            </div>
          </div>

          {/* Line items */}
          {lines.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-700">Items Requested</span>
              </div>
              <div className="p-5">
                <ul className="divide-y divide-gray-100">
                  {lines.map((l) => (
                    <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-gray-700">{l.description}</span>
                      <span className="text-gray-500 font-medium">×{l.qty}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Step 3 — Details (one block per repeated field group) */}
          {currentType && details?.fields && details.fields.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">3</span>
                  <span className="text-sm font-semibold text-gray-700">Details</span>
                </div>
                <StepBadge state={detailsState} />
              </div>
              <div className="p-5 space-y-5">
                {details.fields.map((group, i) => (
                  <div key={i}>
                    {details.fields.length > 1 && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Entry {i + 1}</p>}
                    <RequestDynamicFields fields={currentType.fields} mode="read" values={group} />
                  </div>
                ))}
                <p className="text-xs text-gray-400">{filled}/{required} filled</p>
              </div>
            </div>
          )}

          {/* Step 4 — Push to ERP */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">4</span>
                <span className="text-sm font-semibold text-gray-700">Push to ERP</span>
              </div>
              <StepBadge state={pushState} />
            </div>
            <div className="p-5">
              {!complete && required > 0
                ? <p className="text-sm text-gray-400">Complete {required - filled} more detail(s) to unlock push.</p>
                : (
                  <button onClick={() => mutations.push.mutate(undefined, { onSuccess: () => addToast('Pushed to ERP', 'success') })}
                    className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
                    Push to {currentType?.push_target ?? 'ERP'} →
                  </button>
                )}
            </div>
          </div>

          {/* Step 5 — Close */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">5</span>
                <span className="text-sm font-semibold text-gray-700">Close</span>
              </div>
              <StepBadge state={closeState} />
            </div>
            <div className="p-5">
              {!isOpen
                ? <p className="text-sm text-gray-500">Closed as <strong>{req.status}</strong>{req.done_at && ` on ${formatDateTime(req.done_at)}`}.</p>
                : transitions.length > 0
                  ? (
                    <div className="flex gap-2 items-center">
                      <select onChange={(e) => handleStatus(e.target.value)} defaultValue=""
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="" disabled>Change status…</option>
                        {transitions.map((t) => (
                          <option key={t} value={t}>{(bs?.statuses as Record<string, string> | undefined)?.[t] ?? t}</option>
                        ))}
                      </select>
                    </div>
                  )
                  : <p className="text-sm text-gray-400">No transitions available.</p>}
            </div>
          </div>
        </div>

        {/* ── Context column ── */}
        <div className="space-y-4">

          {/* Timeline + add note */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Timeline</h3>
            <div className="flex gap-2 mb-4">
              <input value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Add note…"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button onClick={handleNote}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Save
              </button>
            </div>
            <Timeline entries={timeline as Parameters<typeof Timeline>[0]['entries']} />
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Attachments</h3>
            <p className="text-xs text-gray-400">No attachments.</p>
          </div>

          {/* Dealer health */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Dealer Health</h3>
            <table className="w-full text-xs">
              <tbody>
                <tr><td className="text-gray-400 py-0.5">Open requests</td><td className="text-right font-medium">—</td></tr>
                <tr><td className="text-gray-400 py-0.5">Overdue</td><td className="text-right font-medium text-red-600">—</td></tr>
                <tr><td className="text-gray-400 py-0.5">Tier</td><td className="text-right">—</td></tr>
              </tbody>
            </table>
            <button onClick={() => nav(`/desktop/dealers`)}
              className="mt-3 w-full border border-gray-300 text-sm py-1.5 rounded-lg hover:bg-gray-50">
              Full History
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
