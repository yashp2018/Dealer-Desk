import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Building2, CalendarClock, MapPin, MessageCircle, Phone, User } from 'lucide-react'
import { useRequest, useRequestDetails, useRequestEscalations, useRequestLines, useRequestMutations, useRequestTimeline } from '../../hooks/useRequests'
import { useDealer } from '../../hooks/useDealers'
import { useBootstrap } from '../../hooks/useBootstrap'
import { useUiStore } from '../../stores/uiStore'
import StatusBadge from '../../components/badges/StatusBadge'
import PriorityBadge from '../../components/badges/PriorityBadge'
import Timeline from '../../components/timeline/Timeline'
import RequestDynamicFields from '../requests/RequestDynamicFields'
import Spinner from '../../components/loaders/Spinner'
import { formatDateTime } from '../../lib/formatDate'

export default function MobileRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const [note, setNote] = useState('')

  const { data: req, isLoading, isError } = useRequest(id!)
  const { data: details } = useRequestDetails(id!)
  const { data: timeline = [] } = useRequestTimeline(id!)
  const { data: escalations = [] } = useRequestEscalations(id!)
  const { data: lines = [] } = useRequestLines(id!)
  const { data: bs } = useBootstrap()
  const { data: dealer } = useDealer(req?.dealer_id ?? '')
  const mutations = useRequestMutations(id!)

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <Spinner size="lg" />
    </div>
  )

  if (isError || !req) return (
    <div className="min-h-screen bg-slate-50 p-5">
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
        Request not found or could not be loaded.
        <button onClick={() => nav(-1)} className="mt-4 block font-semibold text-red-700 underline">Go back</button>
      </div>
    </div>
  )

  const currentType = bs?.types?.find((t) => t.id === req.type_id)
  const transitions: string[] = (bs?.transitions as Record<string, string[]> | undefined)?.[req.status] ?? []
  const mapsQuery = dealer?.city ? encodeURIComponent(`${dealer.display_name ?? dealer.name}, ${dealer.city}`) : null

  const handleStatus = (status: string) => {
    mutations.setStatus.mutate(status, {
      onSuccess: () => addToast('Status updated', 'success'),
      onError: (e) => addToast(e.message ?? 'Failed to update status', 'error'),
    })
  }

  const handleNote = () => {
    if (!note.trim()) return
    mutations.addNote.mutate(note, {
      onSuccess: () => { setNote(''); addToast('Note added', 'success') },
      onError: (e) => addToast(e.message ?? 'Failed to add note', 'error'),
    })
  }

  const handlePush = () => {
    mutations.push.mutate(undefined, {
      onSuccess: () => addToast('Pushed to ERP', 'success'),
      onError: (e) => addToast(e.message ?? 'Failed to push', 'error'),
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Header */}
      <header className="bg-slate-950 px-5 pb-6 pt-6 text-white">
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => nav(-1)} className="rounded-xl bg-white/10 p-2.5 transition hover:bg-white/15">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">{req.ref}</p>
            <h1 className="truncate text-lg font-bold">{req.title || req.type_name}</h1>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <StatusBadge status={req.status} />
          <PriorityBadge priority={req.priority} />
        </div>

        {/* Quick contact actions */}
        {dealer && (
          <div className="grid grid-cols-3 gap-2">
            {dealer.phone_primary ? (
              <a href={`tel:${dealer.phone_primary}`} className="flex flex-col items-center gap-1 rounded-xl bg-white/10 py-3 text-white transition hover:bg-white/15">
                <Phone className="h-5 w-5" />
                <span className="text-[11px] font-semibold">Call</span>
              </a>
            ) : (
              <DisabledAction icon={Phone} label="Call" />
            )}
            {dealer.whatsapp_phone ? (
              <a href={`https://wa.me/${dealer.whatsapp_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                className="flex flex-col items-center gap-1 rounded-xl bg-white/10 py-3 text-white transition hover:bg-white/15">
                <MessageCircle className="h-5 w-5" />
                <span className="text-[11px] font-semibold">WhatsApp</span>
              </a>
            ) : (
              <DisabledAction icon={MessageCircle} label="WhatsApp" />
            )}
            {mapsQuery ? (
              <a href={`https://maps.google.com/?q=${mapsQuery}`} target="_blank" rel="noreferrer"
                className="flex flex-col items-center gap-1 rounded-xl bg-white/10 py-3 text-white transition hover:bg-white/15">
                <MapPin className="h-5 w-5" />
                <span className="text-[11px] font-semibold">Maps</span>
              </a>
            ) : (
              <DisabledAction icon={MapPin} label="Maps" />
            )}
          </div>
        )}
      </header>

      <div className="space-y-3 px-4 pt-4">
        {/* Info card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Request Information</p>
          </div>
          {[
            { icon: Building2, label: 'Dealer', value: req.dealer_name || '—' },
            { icon: User, label: 'Owner', value: req.owner_name || 'Unassigned' },
            { icon: CalendarClock, label: 'Due', value: req.due_at ? formatDateTime(req.due_at) : '—' },
            ...(req.dealer_city ? [{ icon: MapPin, label: 'Location', value: req.dealer_city }] : []),
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 last:border-0">
              <Icon className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-slate-400">{label}</p>
                <p className="truncate text-sm font-medium text-slate-800">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dealer link */}
        {req.dealer_id && (
          <Link to={`/mobile/dealers/${req.dealer_id}`}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-indigo-600 active:bg-slate-50">
            View Dealer 360
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Link>
        )}

        {/* Dynamic fields — one card per repeated group */}
        {currentType && details?.fields?.map((group, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Details{details.fields.length > 1 ? ` — Entry ${i + 1}` : ''}
              </p>
            </div>
            <div className="p-4">
              <RequestDynamicFields fields={currentType.fields} mode="read" values={group} />
            </div>
          </div>
        ))}

        {/* Line items */}
        {lines.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Items Requested</p>
            </div>
            <ul className="divide-y divide-slate-100">
              {lines.map((l) => (
                <li key={l.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-slate-700">{l.description}</span>
                  <span className="font-medium text-slate-500">×{l.qty}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Status change */}
        {transitions.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Change Status</p>
            </div>
            <div className="flex flex-wrap gap-2 p-4">
              {transitions.map((t) => (
                <button key={t} type="button" onClick={() => handleStatus(t)} disabled={mutations.setStatus.isPending}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-700 active:bg-slate-100 disabled:opacity-50">
                  {(bs?.statuses as Record<string, string> | undefined)?.[t] ?? t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Push to ERP */}
        <button type="button" onClick={handlePush} disabled={mutations.push.isPending}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-700 active:bg-slate-50 disabled:opacity-50">
          {mutations.push.isPending ? 'Pushing…' : 'Push to ERP'}
        </button>

        {/* Add note */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Add Note</p>
          </div>
          <div className="p-4">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Write a note…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-600" />
            <button type="button" onClick={handleNote} disabled={mutations.addNote.isPending || !note.trim()}
              className="mt-2 w-full rounded-xl bg-cyan-700 py-3 text-sm font-semibold text-white disabled:opacity-40">
              {mutations.addNote.isPending ? 'Saving…' : 'Add Note'}
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Timeline</p>
          <Timeline entries={timeline} />
        </div>

        {/* Escalation history */}
        {escalations.length > 0 && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5" /> Escalation history
            </p>
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
    </div>
  )
}

function DisabledAction({ icon: Icon, label }: { icon: typeof Phone; label: string }) {
  return (
    <div className="flex cursor-not-allowed flex-col items-center gap-1 rounded-xl bg-white/5 py-3 text-slate-600">
      <Icon className="h-5 w-5" />
      <span className="text-[11px] font-semibold">{label}</span>
    </div>
  )
}
