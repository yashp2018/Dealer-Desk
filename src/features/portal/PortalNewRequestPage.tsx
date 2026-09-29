import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateMyRequest, usePortalRequestTypes } from '../../hooks/usePortal'
import type { DealerCreateRequestPayload, DealerRequest, RequestLineInput } from '../../api/types'
import Spinner from '../../components/loaders/Spinner'
import RequestLineItemsEditor from '../../components/forms/RequestLineItemsEditor'
import RepeatableFieldGroups from '../../components/forms/RepeatableFieldGroups'
import { isFieldGroupComplete } from '../requests/RequestDynamicFields'
import { useUiStore } from '../../stores/uiStore'
import { CheckCircle, ArrowRight, Plus } from 'lucide-react'
import { formatDate, formatDateTime } from '../../lib/formatDate'

type Step = 'form' | 'success'

/** Local datetime-local string, floored to the next 15 minutes, used as the min attribute so a dealer can't pick a time in the past. */
function nowLocalInput(): string {
  const d = new Date(Date.now() + 15 * 60_000)
  d.setSeconds(0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function PortalNewRequestPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { data: types = [], isLoading: typesLoading } = usePortalRequestTypes()
  const [step, setStep] = useState<Step>('form')
  const [typeId, setTypeId] = useState<string | null>(null)
  const [title, setTitle] = useState(params.get('service_name') ?? '')
  const [description, setDescription] = useState(
    params.get('service_name') ? `Requesting: ${params.get('service_name')}` : '',
  )
  const [scheduledAt, setScheduledAt] = useState('')
  const [lines, setLines] = useState<RequestLineInput[]>([])
  const [fieldGroups, setFieldGroups] = useState<Record<string, string>[]>([{}])
  const [submitted, setSubmitted] = useState<DealerRequest | null>(null)

  const create = useCreateMyRequest()
  const addToast = useUiStore((s) => s.addToast)

  const selectedType = types.find((t) => t.id === typeId)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!typeId || !selectedType) return
    if (!fieldGroups.every((g) => isFieldGroupComplete(selectedType.fields, g))) {
      addToast('Fill in all required fields for every entry', 'error')
      return
    }
    const validLines = lines.filter((l) => l.description.trim() && l.qty > 0)
    const usedFieldGroups = fieldGroups.filter((g) => Object.values(g).some((v) => v.trim()))
    const payload: DealerCreateRequestPayload = {
      type_id: typeId,
      title: title || undefined,
      description: description || undefined,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      fields: usedFieldGroups.length > 0 ? usedFieldGroups : undefined,
      lines: validLines.length > 0 ? validLines : undefined,
    }
    create.mutate(payload, {
      onSuccess: (result) => { setSubmitted(result); setStep('success') },
    })
  }

  if (step === 'success' && submitted) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Request Submitted</h2>
          <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Reference</span><span className="font-mono font-semibold text-slate-800">{submitted.ref_no}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="text-slate-700">{submitted.type_name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Submitted</span><span className="text-slate-700">{formatDate(submitted.created_at)}</span></div>
            {submitted.scheduled_at && (
              <div className="flex justify-between"><span className="text-slate-500">Requested for</span><span className="text-slate-700">{formatDateTime(submitted.scheduled_at)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="text-indigo-600 font-medium">{submitted.status}</span></div>
          </div>
          <p className="text-xs text-slate-400">Our team will review your request and update you on progress.</p>
          <div className="flex gap-3 pt-2">
            <button onClick={() => navigate('/portal/requests')} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700">
              View My Requests <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setStep('form'); setTypeId(null); setTitle(''); setDescription(''); setLines([]); setFieldGroups([{}]); setSubmitted(null) }}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-200"
            >
              <Plus className="h-4 w-4" /> New Request
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-800">New Request</h2>
        <p className="text-sm text-slate-500 mt-0.5">Submit a new request to our team</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">1. Request Type</label>
          {typesLoading ? (
            <div className="flex justify-center py-6"><Spinner size="md" /></div>
          ) : types.length === 0 ? (
            <p className="text-sm text-slate-400 py-2">No request types are configured yet — contact your account manager.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {types.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setTypeId(t.id); setFieldGroups([{}]) }}
                  className={`border rounded-xl p-3 text-left text-sm transition-colors ${typeId === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <p className="font-medium text-slate-800">{t.name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedType && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">2. Details</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={selectedType.name}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe your request…"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            {selectedType.fields.length > 0 && (
              <RepeatableFieldGroups fields={selectedType.fields} groups={fieldGroups} onChange={setFieldGroups} noun="entry" />
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Items <span className="text-slate-400 font-normal">(optional — add what you need and how many)</span></label>
              <RequestLineItemsEditor lines={lines} onChange={setLines} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preferred date &amp; time <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                type="datetime-local"
                value={scheduledAt}
                min={nowLocalInput()}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-400 mt-1">When would you like this handled? Leave blank if any time works.</p>
            </div>
            {create.isError && <p className="text-sm text-red-600">Failed to submit request. Please try again.</p>}
            <button
              type="submit"
              disabled={create.isPending}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {create.isPending ? <><Spinner size="sm" /> Submitting…</> : '3. Submit Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
