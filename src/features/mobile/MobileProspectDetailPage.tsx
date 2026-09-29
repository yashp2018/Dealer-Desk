import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, ChevronRight, Mail, MapPin, MessageCircle, Phone, User } from 'lucide-react'
import { useProspect, useProspectChecklist, useProspectMutations, useProspectVisits } from '../../hooks/useProspects'
import { useBootstrap } from '../../hooks/useBootstrap'
import { useUiStore } from '../../stores/uiStore'
import Spinner from '../../components/loaders/Spinner'
import { formatDate } from '../../lib/formatDate'
import { canSetProspectStage } from '../../lib/prospectStages'

const STAGES = ['new', 'contacted', 'qualified', 'visit_planned', 'visit_completed', 'onboarding', 'approved', 'converted', 'dropped']

const STAGE_LABEL: Record<string, string> = {
  new: 'New', contacted: 'Contacted', qualified: 'Qualified', visit_planned: 'Visit Planned',
  visit_completed: 'Visit Completed', onboarding: 'Onboarding', approved: 'Approved',
  converted: 'Converted', dropped: 'Dropped',
}

export default function MobileProspectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const pid = Number(id)
  const nav = useNavigate()
  const addToast = useUiStore((s) => s.addToast)

  const { data: prospect, isLoading, isError } = useProspect(pid)
  const { data: visits = [] } = useProspectVisits(pid)
  const { data: checklist = [] } = useProspectChecklist(pid)
  const { data: bs } = useBootstrap()
  const mutations = useProspectMutations(pid)

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <Spinner size="lg" />
    </div>
  )

  if (isError || !prospect) return (
    <div className="min-h-screen bg-slate-50 p-5">
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
        Prospect not found or could not be loaded.
        <button onClick={() => nav(-1)} className="mt-4 block font-semibold text-red-700 underline">Go back</button>
      </div>
    </div>
  )

  const p = prospect
  const ownerName = bs?.staff?.find((s) => s.id === p.owner_staff_id)?.name ?? `#${p.owner_staff_id}`
  const mapsQuery = p.city ? encodeURIComponent(`${p.company_name}, ${p.city}`) : null

  const handleStage = (stage: string) => {
    mutations.setStage.mutate(stage, {
      onSuccess: () => addToast('Stage updated', 'success'),
      onError: (e) => addToast(e.message ?? 'Failed to update stage', 'error'),
    })
  }

  const handleConvert = () => {
    if (!window.confirm(`Convert ${p.company_name} to a dealer? This cannot be undone.`)) return
    mutations.convert.mutate(undefined, {
      onSuccess: () => { addToast('Converted to dealer', 'success'); nav('/mobile/dealers') },
      onError: (e) => addToast(e.message ?? 'Failed to convert', 'error'),
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
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">{p.ref_no}</p>
            <h1 className="truncate text-lg font-bold">{p.company_name}</h1>
          </div>
        </div>

        <span className="mb-4 inline-flex rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-cyan-200">
          {STAGE_LABEL[p.stage] ?? p.stage}
        </span>

        {/* Quick contact actions */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {p.phone ? (
            <a href={`tel:${p.phone}`} className="flex flex-col items-center gap-1 rounded-xl bg-white/10 py-3 text-white transition hover:bg-white/15">
              <Phone className="h-5 w-5" />
              <span className="text-[11px] font-semibold">Call</span>
            </a>
          ) : (
            <DisabledAction icon={Phone} label="Call" />
          )}
          {p.whatsapp ? (
            <a href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
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
        {/* Info card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Prospect Information</p>
          </div>
          {[
            { icon: User, label: 'Contact', value: p.contact_name || '—' },
            { icon: Mail, label: 'Email', value: p.email || '—' },
            { icon: MapPin, label: 'Location', value: [p.city, p.state_normalized].filter(Boolean).join(', ') || '—' },
            { icon: Building2, label: 'Owner', value: ownerName },
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

        {/* Pipeline stage */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Pipeline Stage</p>
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            {STAGES.map((s) => {
              const allowed = canSetProspectStage(p.stage, s)
              return (
                <button key={s} type="button" onClick={() => handleStage(s)} disabled={mutations.setStage.isPending || !allowed}
                  className={`rounded-xl border px-3.5 py-2 text-sm font-semibold disabled:opacity-50 ${
                    p.stage === s ? 'border-cyan-600 bg-cyan-50 text-cyan-700' : allowed ? 'border-slate-200 bg-slate-50 text-slate-700 active:bg-slate-100' : 'border-slate-100 bg-slate-50 text-slate-300'
                  }`}>
                  {STAGE_LABEL[s]}
                </button>
              )
            })}
          </div>
          {p.stage === 'approved' && (
            <div className="border-t border-slate-100 p-4">
              <button type="button" onClick={handleConvert} disabled={mutations.convert.isPending}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white disabled:opacity-50">
                {mutations.convert.isPending ? 'Converting…' : 'Convert to Dealer'}
              </button>
            </div>
          )}
        </div>

        {/* Onboarding checklist */}
        {checklist.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Onboarding Checklist</p>
            </div>
            {checklist.map((item) => (
              <label key={item.id} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 last:border-0">
                <input type="checkbox" checked={item.status === 'received' || item.status === 'verified'}
                  onChange={(e) => mutations.setOnboardingItem.mutate(
                    { item_id: Number(item.id), status: e.target.checked ? 'received' : 'pending' },
                    { onSuccess: () => addToast('Item updated', 'success'), onError: (err) => addToast(err.message ?? 'Failed to update item', 'error') },
                  )}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-cyan-700" />
                <span className="flex-1 text-sm text-slate-800">
                  {item.doc_name}{item.is_required && <span className="ml-0.5 text-red-500">*</span>}
                </span>
                <span className="shrink-0 text-xs capitalize text-slate-400">{item.status}</span>
              </label>
            ))}
          </div>
        )}

        {/* Visits */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Visits</p>
          </div>
          {visits.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">No visits yet.</p>
          ) : (
            visits.map((v) => (
              <Link key={v.id} to={`/mobile/visit/${v.id}`} className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 last:border-0 active:bg-slate-50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{v.title || v.visit_type}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{formatDate(v.scheduled_at)}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              </Link>
            ))
          )}
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
