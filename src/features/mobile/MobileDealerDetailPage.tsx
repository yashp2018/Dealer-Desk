import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, ChevronRight, ClipboardList, MapPin, MessageCircle, Phone, User } from 'lucide-react'
import { useDealer, useDealerContacts, useDealerRequests, useDealerTimeline, useDealerVisits } from '../../hooks/useDealers'
import Spinner from '../../components/loaders/Spinner'
import StatusBadge from '../../components/badges/StatusBadge'
import Timeline from '../../components/timeline/Timeline'
import { formatDate } from '../../lib/formatDate'
import { relativeTime } from '../../lib/relativeTime'

const HEALTH_DOT: Record<string, string> = { good: 'bg-emerald-500', warning: 'bg-amber-500', critical: 'bg-red-500' }

export default function MobileDealerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: dealer, isLoading, isError } = useDealer(id!)
  const { data: contacts = [] } = useDealerContacts(id!)
  const { data: requests = [] } = useDealerRequests(id!)
  const { data: visits = [] } = useDealerVisits(id!)
  const { data: timeline = [] } = useDealerTimeline(id!)

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <Spinner size="lg" />
    </div>
  )

  if (isError || !dealer) return (
    <div className="min-h-screen bg-slate-50 p-5">
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
        Dealer not found or could not be loaded.
        <button onClick={() => nav(-1)} className="mt-4 block font-semibold text-red-700 underline">Go back</button>
      </div>
    </div>
  )

  const primaryContact = contacts.find((c) => c.is_primary) ?? contacts[0]
  const mapsQuery = dealer.city ? encodeURIComponent(`${dealer.display_name}, ${dealer.city}`) : null

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Header */}
      <header className="bg-slate-950 px-5 pb-6 pt-6 text-white">
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => nav(-1)} className="rounded-xl bg-white/10 p-2.5 transition hover:bg-white/15">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">Dealer</p>
            <h1 className="truncate text-lg font-bold">{dealer.display_name}</h1>
          </div>
          {dealer.tier_name && (
            <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: `${dealer.tier_color}33`, color: dealer.tier_color }}>
              {dealer.tier_name}
            </span>
          )}
        </div>

        {/* Quick contact actions */}
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
      </header>

      <div className="space-y-3 px-4 pt-4">
        {/* Health strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-lg font-extrabold text-slate-900">{dealer.health_score ?? '—'}</p>
            <p className="mt-0.5 flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-500">
              <span className={`h-1.5 w-1.5 rounded-full ${HEALTH_DOT[dealer.health] ?? 'bg-slate-400'}`} /> Health
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-lg font-extrabold text-red-600">{dealer.overdue_requests}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-slate-500">Overdue</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-lg font-extrabold text-slate-900">{dealer.open_requests}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-slate-500">Open</p>
          </div>
        </div>

        {/* Info card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Dealer Information</p>
          </div>
          {[
            { icon: Building2, label: 'Code', value: dealer.code },
            { icon: MapPin, label: 'Location', value: [dealer.city, dealer.state_normalized].filter(Boolean).join(', ') || '—' },
            ...(primaryContact ? [{ icon: User, label: 'Contact', value: `${primaryContact.name}${primaryContact.role_label ? ` · ${primaryContact.role_label}` : ''}` }] : []),
            { icon: ClipboardList, label: 'Last contact', value: relativeTime(dealer.last_contact_at) },
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

        {/* Recent requests */}
        <Section title="Requests" empty={requests.length === 0} emptyLabel="No requests yet.">
          {requests.slice(0, 6).map((r) => (
            <Link key={r.id} to={`/mobile/request/${r.id}`} className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 last:border-0 active:bg-slate-50">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{r.title || r.type_name}</p>
                <p className="mt-0.5 font-mono text-xs text-slate-400">{r.ref_no}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={r.status} />
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            </Link>
          ))}
        </Section>

        {/* Visits */}
        <Section title="Visits" empty={visits.length === 0} emptyLabel="No visits yet.">
          {visits.slice(0, 6).map((v) => (
            <Link key={v.id} to={`/mobile/visit/${v.id}`} className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 last:border-0 active:bg-slate-50">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{v.title || v.visit_type}</p>
                <p className="mt-0.5 text-xs text-slate-400">{formatDate(v.scheduled_at)}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
            </Link>
          ))}
        </Section>

        {/* Timeline */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Timeline</p>
          <Timeline entries={timeline} />
        </div>
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

function Section({ title, empty, emptyLabel, children }: { title: string; empty: boolean; emptyLabel: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{title}</p>
      </div>
      {empty ? <p className="px-4 py-6 text-center text-sm text-slate-400">{emptyLabel}</p> : children}
    </div>
  )
}
