import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Camera, Check, ChevronRight, ClipboardCheck, MapPin, MessageCircle, Phone, Play, Plus, Building2, Trash2, User, CalendarDays, X } from 'lucide-react'
import { useVisit, useVisitAgenda, useVisitAttachments, useVisitMutations, useVisitTimeline } from '../../hooks/useVisits'
import { useDealer, useDealerContacts } from '../../hooks/useDealers'
import { useUiStore } from '../../stores/uiStore'
import { getVisitAttachmentBlob } from '../../api/visits'
import type { VisitAttachment, VisitOutcomePayload } from '../../api/types'
import { todayForDateInput } from '../../lib/formatDate'
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
  const { data: dealer } = useDealer(visit?.dealer_id ?? '')
  const { data: contacts = [] } = useDealerContacts(visit?.dealer_id ?? '')
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

  const handleCancel = () => {
    if (!window.confirm('Cancel this visit?')) return
    mutations.cancel.mutate(undefined, {
      onSuccess: () => addToast('Visit cancelled', 'success'),
      onError: (e) => addToast(e.message ?? 'Failed to cancel visit', 'error'),
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
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">Field Visit · {v.ref}</p>
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
          <button onClick={() => nav(`/mobile/dealers/${visit.dealer_id}`)}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-white rounded-2xl border border-slate-200 text-sm font-medium text-indigo-600 active:bg-slate-50">
            View Dealer 360
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <AgendaSection visitId={vid} />
        <NotesSection visitId={vid} />
        <PhotosSection visitId={vid} />

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
                <input type="date" {...register('next_at')} min={todayForDateInput()}
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
        <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto px-4 pb-[env(safe-area-inset-bottom)] pt-3 bg-white border-t border-slate-200">
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
          {canStart && (
            <button
              onClick={handleCancel}
              disabled={mutations.cancel.isPending}
              className="mt-2 w-full py-2.5 text-sm font-semibold text-slate-500 disabled:opacity-50"
            >
              {mutations.cancel.isPending ? 'Cancelling…' : 'Cancel Visit'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function AgendaSection({ visitId }: { visitId: number }) {
  const { data, isLoading } = useVisitAgenda(visitId)
  const mutations = useVisitMutations(visitId)
  const addToast = useUiStore((s) => s.addToast)
  const [newLabel, setNewLabel] = useState('')
  const items = data?.items ?? []

  const save = (next: typeof items) => {
    mutations.updateAgenda.mutate(next, {
      onError: (e) => addToast(e.message ?? 'Failed to update checklist', 'error'),
    })
  }

  const toggle = (index: number) => save(items.map((it, i) => (i === index ? { ...it, done: !it.done } : it)))
  const remove = (index: number) => save(items.filter((_, i) => i !== index))
  const add = () => {
    if (!newLabel.trim()) return
    save([...items, { label: newLabel.trim(), done: false }])
    setNewLabel('')
  }

  if (isLoading) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Checklist</p>
      </div>
      {items.length === 0 && <p className="px-4 py-4 text-sm text-slate-400">No checklist items yet.</p>}
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
          <button type="button" onClick={() => toggle(i)}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${item.done ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>
            {item.done && <Check className="h-3.5 w-3.5" />}
          </button>
          <span className={`flex-1 text-sm ${item.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.label}</span>
          <button type="button" onClick={() => remove(i)} aria-label="Remove item" className="shrink-0 text-slate-300">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <div className="flex gap-2 p-3">
        <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Add checklist item"
          onKeyDown={(e) => { if (e.key === 'Enter') add() }}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" />
        <button type="button" onClick={add} aria-label="Add checklist item" className="shrink-0 rounded-xl bg-slate-900 px-3 text-white">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function NotesSection({ visitId }: { visitId: number }) {
  const { data: timeline = [] } = useVisitTimeline(visitId)
  const mutations = useVisitMutations(visitId)
  const addToast = useUiStore((s) => s.addToast)
  const [note, setNote] = useState('')
  const notes = timeline.filter((t) => t.event_type === 'note')

  const handleAdd = () => {
    if (!note.trim()) return
    mutations.addNote.mutate(note.trim(), {
      onSuccess: () => { setNote(''); addToast('Note added', 'success') },
      onError: (e) => addToast(e.message ?? 'Failed to add note', 'error'),
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Notes</p>
      </div>
      <div className="p-4">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Write a note…"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-600" />
        <button type="button" onClick={handleAdd} disabled={mutations.addNote.isPending || !note.trim()}
          className="mt-2 w-full rounded-xl bg-cyan-700 py-3 text-sm font-semibold text-white disabled:opacity-40">
          {mutations.addNote.isPending ? 'Saving…' : 'Add Note'}
        </button>
      </div>
      {notes.length > 0 && (
        <div className="divide-y divide-slate-100 border-t border-slate-100">
          {notes.map((n) => (
            <div key={n.id} className="px-4 py-3">
              <p className="text-sm text-slate-700">{n.summary}</p>
              <p className="mt-1 text-xs text-slate-400">
                {n.actor_name} · {new Date(n.created_at).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PhotosSection({ visitId }: { visitId: number }) {
  const { data: attachments = [] } = useVisitAttachments(visitId)
  const mutations = useVisitMutations(visitId)
  const addToast = useUiStore((s) => s.addToast)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    mutations.uploadAttachment.mutate(file, {
      onError: (err) => addToast(err.message ?? 'Failed to upload photo', 'error'),
    })
  }

  const handleDelete = (attachmentId: number) => {
    if (!window.confirm('Remove this photo?')) return
    mutations.deleteAttachment.mutate(attachmentId, {
      onError: (err) => addToast(err.message ?? 'Failed to remove photo', 'error'),
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Photos</p>
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={mutations.uploadAttachment.isPending}
          className="flex items-center gap-1 text-xs font-semibold text-cyan-700 disabled:opacity-50">
          <Camera className="h-3.5 w-3.5" /> {mutations.uploadAttachment.isPending ? 'Uploading…' : 'Add'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      </div>
      {attachments.length === 0 ? (
        <p className="px-4 py-4 text-sm text-slate-400">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 p-3">
          {attachments.map((a) => (
            <AttachmentThumb key={a.id} attachment={a} onDelete={() => handleDelete(a.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function AttachmentThumb({ attachment, onDelete }: { attachment: VisitAttachment; onDelete: () => void }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    getVisitAttachmentBlob(attachment.url).then((blob) => {
      if (cancelled) return
      objectUrl = URL.createObjectURL(blob)
      setSrc(objectUrl)
    }).catch(() => {})
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [attachment.url])

  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100">
      {src ? (
        <img src={src} alt={attachment.file_name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center"><Spinner size="sm" /></div>
      )}
      <button type="button" onClick={onDelete} aria-label="Remove photo"
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
