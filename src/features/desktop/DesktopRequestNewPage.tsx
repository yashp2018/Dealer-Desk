/**
 * Desktop — New Request  (mirrors desktop/request_new.php)
 * Step 1: dealer picker · Step 2: type grid with SLA preview
 * Step 3: title + description · Side: priority / due / owner / schedule
 */
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useBootstrap } from '../../hooks/useBootstrap'
import { useCreateRequest } from '../../hooks/useRequests'
import Breadcrumb from '../../layouts/Breadcrumb'
import RequestLineItemsEditor from '../../components/forms/RequestLineItemsEditor'
import { useUiStore } from '../../stores/uiStore'
import type { CreateRequestPayload, RequestLineInput } from '../../api/types'

export default function DesktopRequestNewPage() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { data: bs } = useBootstrap()
  const create = useCreateRequest()
  const addToast = useUiStore((s) => s.addToast)

  const [dealerId, setDealerId] = useState(params.get('dealer') ?? '')
  const [typeId, setTypeId] = useState('')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [priority, setPriority] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date(); d.setMinutes(0, 0, 0)
    return d.toISOString().slice(0, 16)
  })
  const [lines, setLines] = useState<RequestLineInput[]>([])

  const selectedType = bs?.types?.find((t) => String(t.id) === typeId)
  const duePreview = selectedType
    ? new Date(Date.now() + selectedType.sla_hours * 3600 * 1000).toLocaleString()
    : '—'

  const handleSubmit = () => {
    if (!dealerId || !typeId) { addToast('Select a dealer and type', 'error'); return }
    const validLines = lines.filter((l) => l.description.trim() && l.qty > 0)
    const payload: CreateRequestPayload = {
      dealer_id: dealerId,
      type_id: typeId,
      title: title.trim() || undefined,
      description: desc.trim() || undefined,
      priority: priority ? Number(priority) : undefined,
      owner_staff_id: ownerId || undefined,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      lines: validLines.length > 0 ? validLines : undefined,
    }
    create.mutate(payload, {
      onSuccess: (r) => { addToast('Request created', 'success'); nav(`/desktop/requests/${(r as { id: string }).id}`) },
      onError: () => addToast('Failed to create request', 'error'),
    })
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <Breadcrumb crumbs={[{ label: 'Requests', to: '/desktop/requests' }, { label: 'New Request' }]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Step 1 — Dealer */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">1</span>
              <h3 className="text-sm font-semibold text-gray-700">Pick Dealer</h3>
            </div>
            <select value={dealerId} onChange={(e) => setDealerId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Search dealer…</option>
              {bs?.dealers?.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1.5">Select the dealer this request is for.</p>
          </div>

          {/* Step 2 — Type grid */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</span>
              <h3 className="text-sm font-semibold text-gray-700">Pick Type</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {bs?.types?.map((t) => (
                <label key={t.id}
                  className={`flex flex-col gap-1 border rounded-xl p-3 cursor-pointer transition-colors ${typeId === String(t.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}>
                  <input type="radio" name="type_id" value={String(t.id)} checked={typeId === String(t.id)}
                    onChange={() => setTypeId(String(t.id))} className="sr-only" />
                  <span className="text-sm font-semibold text-gray-800">{t.name}</span>
                  <span className="text-xs text-gray-400">P{t.default_priority} · {t.sla_hours}h SLA</span>
                </label>
              ))}
            </div>
          </div>

          {/* Step 3 — Title + description */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">3</span>
              <h3 className="text-sm font-semibold text-gray-700">Anything Else?</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Title (optional)</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={191}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Items <span className="text-gray-400">(optional)</span></label>
                <RequestLineItemsEditor lines={lines} onChange={setLines} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Side panel — What's next ── */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">What's Next</h3>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-2 text-xs text-gray-500 w-24">Priority</td>
                  <td className="py-2">
                    <select value={priority} onChange={(e) => setPriority(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Auto</option>
                      <option value="1">P1 — Critical</option>
                      <option value="2">P2 — High</option>
                      <option value="3">P3 — Normal</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Auto-set from type if blank.</p>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-xs text-gray-500">Due</td>
                  <td className="py-2 text-xs text-gray-600">{duePreview}</td>
                </tr>
                <tr>
                  <td className="py-2 text-xs text-gray-500">Push Target</td>
                  <td className="py-2 text-xs text-gray-600">{selectedType?.push_target ?? '—'}</td>
                </tr>
                <tr>
                  <td className="py-2 text-xs text-gray-500">Owner</td>
                  <td className="py-2">
                    <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Auto</option>
                      {bs?.staff?.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                    </select>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-xs text-gray-500">Schedule</td>
                  <td className="py-2">
                    <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </td>
                </tr>
              </tbody>
            </table>
            <button onClick={handleSubmit} disabled={create.isPending}
              className="mt-4 w-full bg-indigo-600 text-white text-sm py-2.5 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">
              {create.isPending ? 'Creating…' : 'Create Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
