import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useRequest, useRequestDetails, useRequestTimeline, useRequestMutations, useRequestEscalations, useRequestLines } from '../../hooks/useRequests'
import { useBootstrap } from '../../hooks/useBootstrap'
import StatusBadge from '../../components/badges/StatusBadge'
import PriorityBadge from '../../components/badges/PriorityBadge'
import Timeline from '../../components/timeline/Timeline'
import RequestDynamicFields from './RequestDynamicFields'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import Breadcrumb from '../../layouts/Breadcrumb'
import { useUiStore } from '../../stores/uiStore'
import { AlertTriangle } from 'lucide-react'
import { formatDateTime } from '../../lib/formatDate'

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: req, isLoading, isError } = useRequest(id!)
  const { data: details } = useRequestDetails(id!)
  const { data: timeline = [] } = useRequestTimeline(id!)
  const { data: escalations = [] } = useRequestEscalations(id!)
  const { data: lines = [] } = useRequestLines(id!)
  const { data: bs } = useBootstrap()
  const mutations = useRequestMutations(id!)
  const addToast = useUiStore((s) => s.addToast)
  const [note, setNote] = useState('')

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError || !req) return <Alert type="danger" message="Request not found." />

  const currentType = bs?.types?.find((t) => t.id === req.type_id)
  const transitions: string[] = (bs?.transitions as Record<string, string[]> | undefined)?.[req.status] ?? []

  const handleStatus = (status: string) => {
    mutations.setStatus.mutate(status, { onSuccess: () => addToast('Status updated', 'success') })
  }
  const handleNote = () => {
    if (!note.trim()) return
    mutations.addNote.mutate(note, { onSuccess: () => { setNote(''); addToast('Note added', 'success') } })
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <Breadcrumb crumbs={[{ label: 'Requests', to: '/requests' }, { label: req.ref }]} />
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-wrap items-start gap-3 justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-gray-400">{req.ref}</span>
              <StatusBadge status={req.status} />
              <PriorityBadge priority={req.priority} />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">{req.title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{req.dealer_name} · {req.type_name} · {req.owner_name}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {transitions.length > 0 && (
              <select onChange={(e) => handleStatus(e.target.value)} defaultValue="" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="" disabled>Change status…</option>
                {transitions.map((t) => <option key={t} value={t}>{(bs?.statuses as Record<string, string> | undefined)?.[t] ?? t}</option>)}
              </select>
            )}
            <button onClick={() => mutations.push.mutate(undefined, { onSuccess: () => addToast('Pushed to ERP', 'success') })}
              className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Push to ERP</button>
          </div>
        </div>
      </div>
      {/* Dynamic fields — one card per repeated group (e.g. one per vehicle on a warranty claim) */}
      {currentType && details?.fields?.map((group, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Details{details.fields.length > 1 ? ` — Entry ${i + 1}` : ''}
          </h3>
          <RequestDynamicFields fields={currentType.fields} mode="read" values={group} />
        </div>
      ))}
      {/* Line items */}
      {lines.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Items Requested</h3>
          <ul className="divide-y divide-gray-100">
            {lines.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-700">{l.description}</span>
                <span className="text-gray-500 font-medium">×{l.qty}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Note</h3>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Write a note…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button onClick={handleNote} className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Add Note</button>
      </div>
      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Timeline</h3>
        <Timeline entries={timeline as Parameters<typeof Timeline>[0]['entries']} />
      </div>
      {/* Escalation history — exception info, kept small and out of the way */}
      {escalations.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
            <AlertTriangle className="h-3.5 w-3.5" /> Escalation history
          </h3>
          <ul className="space-y-1.5">
            {escalations.map((e) => (
              <li key={e.id} className="text-xs text-amber-900">
                <span className="font-medium">{e.rule_name}</span> — {e.action_taken}
                <span className="text-amber-600"> · {formatDateTime(e.fired_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
