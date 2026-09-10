import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useRequest, useRequestDetails, useRequestTimeline, useRequestMutations } from '../../hooks/useRequests'
import { useBootstrap } from '../../hooks/useBootstrap'
import StatusBadge from '../../components/badges/StatusBadge'
import PriorityBadge from '../../components/badges/PriorityBadge'
import Timeline from '../../components/timeline/Timeline'
import RequestDynamicFields from './RequestDynamicFields'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import Breadcrumb from '../../layouts/Breadcrumb'
import { useUiStore } from '../../stores/uiStore'

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const rid = Number(id)
  const { data: req, isLoading, isError } = useRequest(rid)
  const { data: details } = useRequestDetails(rid)
  const { data: timeline = [] } = useRequestTimeline(rid)
  const { data: bs } = useBootstrap()
  const mutations = useRequestMutations(rid)
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
      {/* Dynamic fields */}
      {currentType && (details as { fields?: Record<string, string> })?.fields && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Details</h3>
          <RequestDynamicFields fields={currentType.fields} mode="read" values={(details as { fields: Record<string, string> }).fields} />
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
    </div>
  )
}
