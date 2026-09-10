import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Phone, MessageCircle, MapPin, Play, ClipboardCheck, ChevronRight, Building2, User, CalendarDays } from 'lucide-react'
import { useVisit, useVisitMutations } from '../../hooks/useVisits'
import { useDealer, useDealerContacts } from '../../hooks/useDealers'
import { useUiStore } from '../../stores/uiStore'
import type { VisitOutcomePayload } from '../../api/types'
import Spinner from '../../components/loaders/Spinner'

const OUTCOMES = [
  { value: 'successful',  label: 'Successful',                emoji: '✅' },
  { value: 'partial',     label: 'Partial — follow-up needed', emoji: '🔄' },
  { value: 'rescheduled', label: 'Rescheduled',                emoji: '📅' },
  { value: 'no_show',     label: 'No Show',                    emoji: '❌' },
]

const NEXT_STEPS = [
  { value: '',             label: 'None' },
  { value: 'follow_up',   label: 'Follow-up call' },
  { value: 'next_visit',  label: 'Schedule next visit' },
  { value: 'new_request', label: 'Raise new request' },
  { value: 'escalate',    label: 'Escalate' },
]

const STATUS_LABEL: Record<string, { label: string; dot: string }> = {
  scheduled:   { label: 'Scheduled',   dot: 'bg-blue-500' },
  in_progress: { label: 'In Progress', dot: 'bg-amber-400' },
  done:        { label: 'Completed',   dot: 'bg-emerald-500' },
  cancelled:   { label: 'Cancelled',   dot: 'bg-slate-400' },
  no_show:     { label: 'No Show',     dot: 'bg-red-500' },
}

interface OutcomeForm {
  outcome: string
  outcome_note: string
  next_step: string
  next_at: string
}

export default function MobileVisitPage() {
  const { id } = useParams<{ id: string }>()
  const vid = Number(id)
  const nav = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const [showOutcomeForm, setShowOutcomeForm] = useState(false)

  const { data: visit, isLoading, isError } = useVisit(vid)
  const { data: dealer } = useDealer(visit?.dealer_id ?? 0)
  const { data: contacts = [] } = useDealerContacts(visit?.dealer_id ?? 0)
  const mutations = useVisitMutations(vid)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<OutcomeForm>({
    defaultValues: { outcome: '', outcome_note: '', next_step: '', next_at: '' },
  })
  const selectedOutcome = watch('outcome')

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  if (isError || !visit) return (
    <div className="min-h-screen bg-slate-50 p-5">
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
        Visit not found or could not be loaded.
        <button onClick={() => nav(-1)} className="mt-4 block font-semibold text-red-700 underline">Go back</button>
      </div>
    </div>
  )

  const v = visit
  const statusCfg = STATUS_LABEL[v.status] ?? { label: v.status, dot: 'bg-slate-400' }
  const primaryContact = contacts.find((c) => c.is_primary) ?? contacts[0]
  const isTerminal = ['done', 'cancelled', 'no_show'].includes(v.status)
  const canStart = v.status === 'scheduled'
  const canComplete = v.status === 'in_progress'
  const mapsQuery = dealer?.city ? encodeURIComponent(`${dealer.display_name ?? dealer.name}, ${dealer.city}`) : null

  const handleStart = () => {
    mutations.start.mutate(undefined, {
      onSuccess: () => addToast('Visit started', 'success'),
      onError: (e) => addToast(e.message ?? 'Failed to start visit', 'error'),
    })
  }

  const onOutcomeSubmit = (data: OutcomeForm) => {
    if (!data.outcome) return
    const payload: VisitOutcomePayload = {
      outcome: data.outcome,
      outcome_note: data.outcome_note || undefined,
      next_step: data.next_step || undefined,
      next_at: data.next_at || undefined,
    }
    mutations.outcome.mutate(payload, {
      onSuccess: () => { addToast('Visit completed', 'success'); setShowOutcomeForm(false) },
      onError: (e) => addToast(e.message ?? 'Failed to complete visit', 'error'),
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">

      {/* Header */}
      <header className="bg-slate-950 px-5 pb-6 pt-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => nav(-1)} className="rounded-xl bg-white/10 p-2.5 hover:bg-white/15 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">Field Visit</p>
            <h1 className="text-lg font-bold truncate">{v.dealer_name}</h1>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`h-2 w-2 rounded-full ${statusCfg.dot}`} />
            <span className="text-xs font-semibold text-slate-300">{statusCfg.label}</span>
          </div>
        </div>

        {/* Quick contact actions */}
        <div className="grid grid-cols-3 gap-2">
          {dealer?.phone_primary ? (
            <a href={`tel:${dealer.phone_primary}`}
              className="flex flex-col items-center gap-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition text-white">
              <Phone className="h-5 w-5" />
              <span className="text-[11px] font-semibold">Call</span>
            </a>
          ) : (
            <div className="flex flex-col items-center gap-1 py-3 rounded-xl bg-white/5 text-slate-600 cursor-not-allowed">
              <Phone className="h-5 w-5" />
              <span className="text-[11px] font-semibold">Call</span>
            </div>
          )}
          {dealer?.whatsapp_phone ? (
            <a href={`https://wa.me/${dealer.whatsapp_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
              className="flex flex-col items-center gap-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition text-white">
              <MessageCircle className="h-5 w-5" />
              <span className="text-[11px] font-semibold">WhatsApp</span>
            </a>
          ) : (
            <div className="flex flex-col items-center gap-1 py-3 rounded-xl bg-white/5 text-slate-600 cursor-not-allowed">
              <MessageCircle className="h-5 w-5" />
              <span className="text-[11px] font-semibold">WhatsApp</span>
            </div>
          )}
          {mapsQuery ? (
            <a href={`https://maps.google.com/?q=${mapsQuery}`} target="_blank" rel="noreferrer"
              className="flex flex-col items-center gap-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition text-white">
              <MapPin className="h-5 w-5" />
              <span className="text-[11px] font-semibold">Maps</span>
            </a>
          ) : (
            <div className="flex flex-col items-center gap-1 py-3 rounded-xl bg-white/5 text-slate-600 cursor-not-allowed">
              <MapPin className="h-5 w-5" />
              <span className="text-[11px] font-semibold">Maps</span>
            </div>
          )}
        </div>
      </header>

      <div className="px-4 pt-4 space-y-3">

        {/* Visit info card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Visit Information</p>
          </div>
          {[
            { icon: Building2,    label: 'Dealer',    value: v.dealer_name },
            { icon: CalendarDays, label: 'Scheduled', value: new Date(v.scheduled_at).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) },
            { icon: User,         label: 'Type',      value: v.visit_type },
            { icon: User,         label: 'Assigned',  value: v.owner_name },
            ...(primaryContact ? [{ icon: User, label: 'Contact', value: `${primaryContact.name}${primaryContact.role_label ? ` · ${primaryContact.role_label}` : ''}` }] : []),
            ...(dealer?.city ? [{ icon: MapPin, label: 'Location', value: [dealer.city, dealer.state_normalized].filter(Boolean).join(', ') }] : []),
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 last:border-0">
              <Icon className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-slate-400">{label}</p>
                <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dealer link */}
        {visit.dealer_id && (
          <button onClick={() => nav(`/dealers/${visit.dealer_id}`)}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-white rounded-2xl border border-slate-200 text-sm font-medium text-indigo-600 active:bg-slate-50">
            View Dealer 360
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/*
          BACKEND GAP — Agenda / Checklist
          Visit.agenda_json exists on the type but there is no
          GET /visits/:id/agenda or PATCH /visits/:id/agenda endpoint.
          When available, render a touch-friendly checklist here.
        */}

        {/*
          BACKEND GAP — Notes
          POST /visits/:id/notes is not available.
          When it is, add a large textarea + Save button here.
          Expected payload: { body: string }
          Expected response: TimelineEntry
        */}

        {/*
          BACKEND GAP — Photos / Attachments
          POST /visits/:id/attachments is not available.
          When it is, add a camera/file picker with preview here.
          Expected: multipart/form-data, file field.
          Never expose unprotected file URLs.
        */}

        {/* Outcome section (if already completed) */}
        {isTerminal && v.outcome && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Outcome</p>
            </div>
            <div className="px-4 py-4 space-y-2">
              <p className="text-sm font-semibold text-slate-800">
                {OUTCOMES.find((o) => o.value === v.outcome)?.emoji} {OUTCOMES.find((o) => o.value === v.outcome)?.label ?? v.outcome}
              </p>
              {v.outcome_note && <p className="text-sm text-slate-600">{v.outcome_note}</p>}
              {v.next_step && <p className="text-xs text-slate-400">Next: {NEXT_STEPS.find((s) => s.value === v.next_step)?.label ?? v.next_step}</p>}
              {v.next_at && <p className="text-xs text-slate-400">Date: {new Date(v.next_at).toLocaleDateString()}</p>}
            </div>
          </div>
        )}

        {/* Outcome form (inline on mobile) */}
        {canComplete && showOutcomeForm && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Finish Visit</p>
            </div>
            <form onSubmit={handleSubmit(onOutcomeSubmit)} className="px-4 py-4 space-y-4">

              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Outcome <span className="text-red-500">*</span></p>
                <div className="space-y-2">
                  {OUTCOMES.map(({ value, label, emoji }) => (
                    <label key={value} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${selectedOutcome === value ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                      <input type="radio" value={value} {...register('outcome', { required: true })} className="accent-indigo-600" />
                      <span className="text-sm">{emoji} {label}</span>
                    </label>
                  ))}
                </div>
                {errors.outcome && <p className="text-xs text-red-500 mt-1">Please select an outcome</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <textarea
                  {...register('outcome_note')}
                  rows={3}
                  placeholder="Summary of the visit…"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Next Action</label>
                <select {...register('next_step')} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  {NEXT_STEPS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Next Date</label>
                <input type="date" {...register('next_at')} min={new Date().toISOString().slice(0, 10)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowOutcomeForm(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600">
                  Cancel
                </button>
                <button type="submit" disabled={mutations.outcome.isPending}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                  {mutations.outcome.isPending ? 'Saving…' : 'Complete Visit'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Sticky bottom action */}
      {!isTerminal && !showOutcomeForm && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 pb-[env(safe-area-inset-bottom)] pt-3 bg-white border-t border-slate-200">
          {canStart && (
            <button
              onClick={handleStart}
              disabled={mutations.start.isPending}
              className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl text-base font-bold disabled:opacity-50 active:bg-indigo-700 transition-colors"
            >
              <Play className="h-5 w-5" />
              {mutations.start.isPending ? 'Starting…' : 'Start Visit'}
            </button>
          )}
          {canComplete && (
            <button
              onClick={() => setShowOutcomeForm(true)}
              className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl text-base font-bold active:bg-emerald-700 transition-colors"
            >
              <ClipboardCheck className="h-5 w-5" /> Finish Visit
            </button>
          )}
        </div>
      )}
    </div>
  )
}
