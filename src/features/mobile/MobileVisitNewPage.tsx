import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useBootstrap } from '../../hooks/useBootstrap'
import { useCreateVisit } from '../../hooks/useVisits'
import { useUiStore } from '../../stores/uiStore'
import { nowForDatetimeLocal } from '../../lib/formatDate'
import Spinner from '../../components/loaders/Spinner'

export default function MobileVisitNewPage() {
  const navigate = useNavigate()
  const { data: bootstrap, isLoading } = useBootstrap()
  const create = useCreateVisit()
  const addToast = useUiStore((s) => s.addToast)

  const [dealerId, setDealerId] = useState('')
  const [visitTypeId, setVisitTypeId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>

  const save = () => {
    if (!dealerId || !visitTypeId || !scheduledAt) { addToast('Fill in dealer, type and date', 'error'); return }
    if (new Date(scheduledAt) < new Date()) { addToast('Visit time cannot be in the past', 'error'); return }
    create.mutate(
      { dealer_id: Number(dealerId), visit_type_id: Number(visitTypeId), scheduled_at: new Date(scheduledAt).toISOString() },
      {
        onSuccess: (visit) => { addToast('Visit scheduled', 'success'); navigate(`/mobile/visit/${visit.id}`) },
        onError: () => addToast('Unable to schedule visit', 'error'),
      },
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center gap-3 bg-slate-950 px-5 py-5 text-white">
        <Link to="/mobile" className="rounded-full bg-white/10 p-2"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Field ops</p>
          <h1 className="mt-1 text-lg font-bold">Plan Visit</h1>
        </div>
      </header>
      <main className="space-y-5 p-5 pb-28">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Dealer</label>
          <select value={dealerId} onChange={(e) => setDealerId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600">
            <option value="">Select dealer…</option>
            {bootstrap?.dealers.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Visit Type</label>
          <select value={visitTypeId} onChange={(e) => setVisitTypeId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600">
            <option value="">Select type…</option>
            {bootstrap?.visit_types?.map((vt) => <option key={vt.id} value={vt.id}>{vt.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Date & Time</label>
          <input type="datetime-local" value={scheduledAt} min={nowForDatetimeLocal()} onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600" />
        </div>
      </main>
      <footer className="fixed bottom-0 z-40 w-full max-w-md border-t border-slate-200 bg-white p-4">
        <button type="button" disabled={create.isPending} onClick={save}
          className="w-full rounded-xl bg-cyan-700 py-3 text-sm font-semibold text-white disabled:opacity-40">
          {create.isPending ? 'Saving…' : 'Schedule Visit'}
        </button>
      </footer>
    </div>
  )
}
