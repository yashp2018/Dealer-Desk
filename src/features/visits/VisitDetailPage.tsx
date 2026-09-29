import { useParams, useNavigate } from 'react-router-dom'
import { useVisit, useVisitMutations, useVisitTimeline } from '../../hooks/useVisits'
import { useDealer, useDealerContacts } from '../../hooks/useDealers'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import Breadcrumb from '../../layouts/Breadcrumb'
import SectionCard from '../../components/cards/SectionCard'
import Timeline from '../../components/timeline/Timeline'
import { formatDate, formatDateTime } from '../../lib/formatDate'
import {
  Phone, MessageCircle, MapPin, Play, ClipboardCheck,
  Building2, User, CalendarDays, Tag, ArrowRight,
} from 'lucide-react'

// Status display config — only statuses the backend actually uses
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  scheduled:   { label: 'Scheduled',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  done:        { label: 'Completed',   color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  cancelled:   { label: 'Cancelled',   color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
  no_show:     { label: 'No Show',     color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

// Outcome display labels — only values the backend supports via VisitOutcomePayload
const OUTCOME_LABELS: Record<string, string> = {
  successful:  'Successful',
  partial:     'Partial',
  rescheduled: 'Rescheduled',
  no_show:     'No Show',
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-slate-100 text-slate-600' }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value}</p>
      </div>
    </div>
  )
}

export default function VisitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const vid = Number(id)
  const nav = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const currentStaff = useAuthStore((s) => s.staff)

  const { data: visit, isLoading, isError } = useVisit(vid)
  const { data: timeline = [] } = useVisitTimeline(vid)
  const { data: dealer } = useDealer(visit?.dealer_id ?? '')
  const { data: contacts = [] } = useDealerContacts(visit?.dealer_id ?? '')
  const mutations = useVisitMutations(vid)

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError || !visit) return <Alert type="danger" message="Visit not found." />

  const v = visit
  const primaryContact = contacts.find((c) => c.is_primary) ?? contacts[0]
  const isTerminal = ['done', 'cancelled', 'no_show'].includes(v.status)
  const canStart = v.status === 'scheduled'
  const canComplete = v.status === 'in_progress'
  // Only the assigned owner or any staff can act (backend enforces real auth)
  const isOwner = currentStaff?.id === v.owner_staff_id

  const handleStart = () => {
    mutations.start.mutate(undefined, {
      onSuccess: () => addToast('Visit started', 'success'),
      onError: (e) => addToast(e.message ?? 'Failed to start visit', 'error'),
    })
  }

  const mapsQuery = dealer?.city
    ? encodeURIComponent(`${dealer.display_name ?? dealer.name}, ${dealer.city}`)
    : null

  return (
    <div className="space-y-5 max-w-3xl">
      <Breadcrumb crumbs={[{ label: 'Visits', to: '/visits' }, { label: v.ref }]} />

      {/* Header card */}
      <SectionCard>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-slate-400">{v.ref}</span>
              <StatusPill status={v.status} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{v.dealer_name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{v.visit_type}{v.title ? ` · ${v.title}` : ''}</p>
          </div>

          {/* Quick contact actions */}
          <div className="flex items-center gap-2 shrink-0">
            {dealer?.phone_primary && (
              <a href={`tel:${dealer.phone_primary}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Phone className="h-4 w-4" /> Call
              </a>
            )}
            {dealer?.whatsapp_phone && (
              <a href={`https://wa.me/${dealer.whatsapp_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
            {mapsQuery && (
              <a href={`https://maps.google.com/?q=${mapsQuery}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <MapPin className="h-4 w-4" /> Maps
              </a>
            )}
          </div>
        </div>

        {/* Primary action buttons */}
        {!isTerminal && (
          <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {canStart && (
              <button
                onClick={handleStart}
                disabled={mutations.start.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Play className="h-4 w-4" />
                {mutations.start.isPending ? 'Starting…' : 'Start Visit'}
              </button>
            )}
            {canComplete && (
              <button
                onClick={() => nav(`/visits/${vid}/outcome`)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <ClipboardCheck className="h-4 w-4" /> Record Outcome
              </button>
            )}
            {!isOwner && (
              <p className="text-xs text-slate-400 dark:text-slate-500 self-center">
                Assigned to {v.owner_name}
              </p>
            )}
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Visit Information */}
        <SectionCard title="Visit Information">
          <InfoRow icon={Building2}    label="Dealer"         value={v.dealer_name} />
          <InfoRow icon={Tag}          label="Dealer Code"    value={dealer?.code} />
          <InfoRow icon={Tag}          label="Visit Type"     value={v.visit_type} />
          <InfoRow icon={CalendarDays} label="Scheduled"      value={formatDateTime(v.scheduled_at)} />
          <InfoRow icon={User}         label="Assigned To"    value={v.owner_name} />
          {primaryContact && (
            <InfoRow icon={User} label="Contact" value={`${primaryContact.name}${primaryContact.role_label ? ` · ${primaryContact.role_label}` : ''}`} />
          )}
          {primaryContact?.phone && (
            <InfoRow icon={Phone} label="Contact Phone" value={
              <a href={`tel:${primaryContact.phone}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{primaryContact.phone}</a>
            } />
          )}
          {dealer && (
            <InfoRow icon={MapPin} label="Location" value={[dealer.city, dealer.state_normalized].filter(Boolean).join(', ')} />
          )}
        </SectionCard>

        {/* Outcome (if completed) */}
        {isTerminal && v.outcome ? (
          <SectionCard title="Outcome">
            <InfoRow icon={ClipboardCheck} label="Result"   value={OUTCOME_LABELS[v.outcome] ?? v.outcome} />
            {v.outcome_note && <InfoRow icon={Tag} label="Notes" value={v.outcome_note} />}
            {v.next_step     && <InfoRow icon={ArrowRight} label="Next Step" value={v.next_step} />}
            {v.next_at       && <InfoRow icon={CalendarDays} label="Next Date" value={formatDate(v.next_at)} />}
          </SectionCard>
        ) : (
          /* Dealer health summary while visit is active */
          dealer && (
            <SectionCard title="Dealer Overview">
              <InfoRow icon={Tag}      label="Tier"            value={dealer.tier_name} />
              <InfoRow icon={MapPin}   label="Territory"       value={dealer.territory_name} />
              <InfoRow icon={Building2} label="Open Requests"  value={String(dealer.open_requests)} />
              {dealer.overdue_requests > 0 && (
                <InfoRow icon={Building2} label="Overdue Requests" value={
                  <span className="text-red-600 dark:text-red-400 font-semibold">{dealer.overdue_requests}</span>
                } />
              )}
              <div className="pt-2">
                <button onClick={() => nav(`/dealers/${dealer.id}`)}
                  className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                  View Dealer 360 <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </SectionCard>
          )
        )}
      </div>

      {/* Activity Timeline */}
      <SectionCard title="Activity Timeline">
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 py-2">No activity recorded yet.</p>
        ) : (
          <Timeline entries={timeline} />
        )}
      </SectionCard>

      {/*
        BACKEND GAP — Notes
        The backend does not expose POST /visits/:id/notes.
        When POST /visits/:id/notes is available, add a note input here
        using the same pattern as addRequestNote in api/requests.ts.
        Expected payload: { body: string }
        Expected response: TimelineEntry

        BACKEND GAP — Attachments / Photos
        The backend does not expose POST /visits/:id/attachments.
        When available, a camera-friendly upload UI should appear here.
        Expected: multipart/form-data with file field.

        BACKEND GAP — Agenda / Checklist
        Visit.agenda_json exists on the type but there is no dedicated
        GET /visits/:id/agenda or PATCH /visits/:id/agenda endpoint.
        When available, render agenda items as a checklist here.
      */}
    </div>
  )
}
