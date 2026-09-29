import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBootstrap } from '../../hooks/useBootstrap'
import { useCreateVisit } from '../../hooks/useVisits'
import { nowForDatetimeLocal } from '../../lib/formatDate'
import Breadcrumb from '../../layouts/Breadcrumb'
import { useUiStore } from '../../stores/uiStore'

export default function VisitFormPage() {
  const nav = useNavigate()
  const { data: bs } = useBootstrap()
  const create = useCreateVisit()
  const addToast = useUiStore((s) => s.addToast)

  const [dealerId, setDealerId] = useState('')
  const [visitTypeId, setVisitTypeId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [title, setTitle] = useState('')
  const [errors, setErrors] = useState<{ dealer?: string; type?: string; when?: string }>({})

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: typeof errors = {}
    if (!dealerId) nextErrors.dealer = 'Required'
    if (!visitTypeId) nextErrors.type = 'Required'
    if (!scheduledAt) nextErrors.when = 'Required'
    else if (new Date(scheduledAt) < new Date()) nextErrors.when = 'Cannot be in the past'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    create.mutate(
      {
        dealer_id: Number(dealerId),
        visit_type_id: Number(visitTypeId),
        scheduled_at: new Date(scheduledAt).toISOString(),
        title: title || undefined,
      },
      {
        onSuccess: (v) => { addToast('Visit scheduled', 'success'); nav(`/visits/${v.id}`) },
        onError: (err) => addToast(err.message ?? 'Failed to schedule visit', 'error'),
      },
    )
  }

  return (
    <div className="max-w-xl space-y-4">
      <Breadcrumb crumbs={[{ label: 'Visits', to: '/visits' }, { label: 'New Visit' }]} />
      <form onSubmit={onSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dealer</label>
          <select value={dealerId} onChange={(e) => setDealerId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select dealer…</option>
            {bs?.dealers?.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
          </select>
          {errors.dealer && <p className="text-xs text-red-500 mt-1">{errors.dealer}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
          <select value={visitTypeId} onChange={(e) => setVisitTypeId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select type…</option>
            {bs?.visit_types?.map((vt) => <option key={vt.id} value={vt.id}>{vt.name}</option>)}
          </select>
          {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date &amp; Time</label>
          <input type="datetime-local" value={scheduledAt} min={nowForDatetimeLocal()} onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {errors.when && <p className="text-xs text-red-500 mt-1">{errors.when}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Defaults to the visit type"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button type="submit" disabled={create.isPending} className="w-full bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {create.isPending ? 'Scheduling…' : 'Schedule Visit'}
        </button>
      </form>
    </div>
  )
}
