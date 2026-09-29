import { useMemo, useState } from 'react'
import { ArrowLeft, Check, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useBootstrap } from '../../hooks/useBootstrap'
import { useCreateRequest } from '../../hooks/useRequests'
import { useUiStore } from '../../stores/uiStore'
import Spinner from '../../components/loaders/Spinner'
import RepeatableFieldGroups from '../../components/forms/RepeatableFieldGroups'
import { isFieldGroupComplete } from '../requests/RequestDynamicFields'
import type { RequestLineInput } from '../../api/types'

export default function MobileCapturePage() {
  const navigate = useNavigate()
  const { data: bootstrap, isLoading } = useBootstrap()
  const create = useCreateRequest()
  const addToast = useUiStore((state) => state.addToast)
  const [step, setStep] = useState(1)
  const [dealerId, setDealerId] = useState<string | null>(null)
  const [typeId, setTypeId] = useState<string | null>(null)
  const [when, setWhen] = useState('today')
  const [dealerSearch, setDealerSearch] = useState('')
  const [lines, setLines] = useState<RequestLineInput[]>([])
  const [fieldGroups, setFieldGroups] = useState<Record<string, string>[]>([{}])

  const dealer = bootstrap?.dealers.find((item) => item.id === dealerId)
  const type = bootstrap?.types.find((item) => item.id === typeId)
  const typeFields = [...(type?.fields ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const fieldsValid = fieldGroups.every((g) => isFieldGroupComplete(typeFields, g))
  const dealers = useMemo(
    () => bootstrap?.dealers.filter((item) => `${item.name} ${item.code}`.toLowerCase().includes(dealerSearch.toLowerCase())) ?? [],
    [bootstrap?.dealers, dealerSearch],
  )

  const updateLine = (i: number, patch: Partial<RequestLineInput>) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  const addLine = () => setLines((ls) => [...ls, { description: '', qty: 1 }])
  const removeLine = (i: number) => setLines((ls) => ls.filter((_, idx) => idx !== i))

  const save = () => {
    if (!dealerId || !typeId) return
    const scheduled = when === 'today' ? new Date() : new Date(Date.now() + (when === 'tomorrow' ? 86400000 : 3 * 86400000))
    const validLines = lines.filter((l) => l.description.trim() && l.qty > 0)
    const usedFieldGroups = fieldGroups.filter((g) => Object.values(g).some((v) => v.trim()))
    create.mutate({
      dealer_id: dealerId,
      type_id: typeId,
      scheduled_at: scheduled.toISOString(),
      fields: usedFieldGroups.length > 0 ? usedFieldGroups : undefined,
      lines: validLines.length > 0 ? validLines : undefined,
    }, {
      onSuccess: (request) => { addToast('Request created', 'success'); navigate(`/mobile/request/${request.id}`) },
      onError: () => addToast('Unable to create request', 'error'),
    })
  }

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>

  const totalSteps = 5
  const nextDisabled = (step === 1 && !dealerId) || (step === 2 && !typeId) || (step === 3 && !fieldsValid) || create.isPending
  const disabledHint =
    step === 1 && !dealerId ? 'Select a dealer to continue' :
    step === 2 && !typeId ? 'Choose a request type to continue' :
    step === 3 && !fieldsValid ? 'Fill in the required details to continue' :
    null

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center gap-3 bg-slate-950 px-5 py-5 text-white">
        <Link to="/mobile" className="rounded-full bg-white/10 p-2"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Quick capture</p>
          <h1 className="mt-1 text-lg font-bold">New Request</h1>
        </div>
        <span className="text-xs font-semibold text-slate-400">{step} / {totalSteps}</span>
      </header>

      <main className="p-5 pb-28">
        {step === 1 && (
          <Step title="Who needs help?">
            <input value={dealerSearch} onChange={(event) => setDealerSearch(event.target.value)} placeholder="Search dealers"
              className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600" />
            {dealers.map((item) => (
              <button type="button" key={item.id} onClick={() => { setDealerId(item.id); setStep(2) }}
                className={`mb-2 flex w-full items-center justify-between rounded-xl border bg-white px-4 py-4 text-left ${dealerId === item.id ? 'border-cyan-600' : 'border-slate-200'}`}>
                <span><strong className="block text-sm">{item.name}</strong><span className="text-xs text-slate-400">{item.code}</span></span>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </button>
            ))}
          </Step>
        )}

        {step === 2 && (
          <Step title="What is needed?">
            <div className="grid grid-cols-2 gap-3">
              {bootstrap?.types.map((item) => (
                <button type="button" key={item.id} onClick={() => { setTypeId(item.id); setFieldGroups([{}]); setStep(3) }}
                  className={`min-h-28 rounded-xl border bg-white p-4 text-left ${typeId === item.id ? 'border-cyan-600 bg-cyan-50' : 'border-slate-200'}`}>
                  <span className="block text-sm font-bold">{item.name}</span>
                  <span className="mt-2 block text-xs text-slate-400">SLA {item.sla_hours}h</span>
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 3 && (
          <Step title="Anything specific?">
            {typeFields.length === 0 ? (
              <p className="text-sm text-slate-400">No additional details needed for this request type.</p>
            ) : (
              <RepeatableFieldGroups fields={typeFields} groups={fieldGroups} onChange={setFieldGroups} noun="entry" />
            )}
          </Step>
        )}

        {step === 4 && (
          <Step title="What items? (optional)">
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="flex gap-2">
                  <input value={line.description} onChange={(event) => updateLine(i, { description: event.target.value })} placeholder="Item name"
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-600" />
                  <input type="number" min={1} value={line.qty} onChange={(event) => updateLine(i, { qty: Number(event.target.value) })}
                    className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-3 text-sm outline-none focus:border-cyan-600" />
                  <button type="button" onClick={() => removeLine(i)} aria-label="Remove item"
                    className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-slate-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addLine} className="flex items-center gap-1.5 text-sm font-semibold text-cyan-700">
                <Plus className="h-4 w-4" /> Add item
              </button>
            </div>
          </Step>
        )}

        {step === 5 && (
          <Step title="When should it be handled?">
            <div className="space-y-3">
              {[['today', 'Today'], ['tomorrow', 'Tomorrow'], ['week', 'This week']].map(([value, label]) => (
                <button type="button" key={value} onClick={() => setWhen(value)}
                  className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-4 text-left ${when === value ? 'border-cyan-600 bg-cyan-50' : 'border-slate-200'}`}>
                  <span className="text-sm font-semibold">{label}</span>
                  {when === value && <Check className="h-5 w-5 text-cyan-700" />}
                </button>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-slate-100 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Summary</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {dealer?.name} · {type?.name} · {when === 'today' ? 'Today' : when === 'tomorrow' ? 'Tomorrow' : 'This week'}
              </p>
              {lines.filter((l) => l.description.trim()).length > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  {lines.filter((l) => l.description.trim()).length} item(s): {lines.filter((l) => l.description.trim()).map((l) => `${l.description} ×${l.qty}`).join(', ')}
                </p>
              )}
            </div>
          </Step>
        )}
      </main>

      <footer className="fixed bottom-0 z-40 w-full max-w-md border-t border-slate-200 bg-white p-4">
        {disabledHint && (
          <p className="mb-2 text-center text-xs font-medium text-slate-400">{disabledHint}</p>
        )}
        <div className="flex gap-3">
          <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600">
            Back
          </button>
          <button type="button"
            disabled={nextDisabled}
            onClick={() => step === totalSteps ? save() : setStep((current) => current + 1)}
            className="flex-1 rounded-xl bg-cyan-700 py-3 text-sm font-semibold text-white disabled:opacity-40">
            {create.isPending ? 'Saving...' : step === totalSteps ? 'Save' : 'Next'}
          </button>
        </div>
      </footer>
    </div>
  )
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-slate-800">{title}</h2>
      {children}
    </section>
  )
}
