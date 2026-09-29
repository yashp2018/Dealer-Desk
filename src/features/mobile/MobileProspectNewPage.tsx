import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useBootstrap } from '../../hooks/useBootstrap'
import { useCreateProspect } from '../../hooks/useProspects'
import { useAuth } from '../../hooks/useAuth'
import { useUiStore } from '../../stores/uiStore'
import Spinner from '../../components/loaders/Spinner'
import type { CreateProspectPayload } from '../../api/types'

export default function MobileProspectNewPage() {
  const navigate = useNavigate()
  const { data: bootstrap, isLoading } = useBootstrap()
  const { staff } = useAuth()
  const create = useCreateProspect()
  const addToast = useUiStore((s) => s.addToast)

  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [ownerStaffId, setOwnerStaffId] = useState(() => (staff?.id ? String(staff.id) : ''))

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>

  const save = () => {
    if (!companyName.trim() || !ownerStaffId) { addToast('Company name and owner are required', 'error'); return }
    const payload: CreateProspectPayload = {
      company_name: companyName.trim(),
      contact_name: contactName.trim() || undefined,
      phone: phone.trim() || undefined,
      city: city.trim() || undefined,
      owner_staff_id: Number(ownerStaffId),
    }
    create.mutate(payload, {
      onSuccess: (p) => { addToast('Prospect created', 'success'); navigate(`/mobile/prospect/${p.id}`) },
      onError: () => addToast('Unable to create prospect', 'error'),
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center gap-3 bg-slate-950 px-5 py-5 text-white">
        <Link to="/mobile" className="rounded-full bg-white/10 p-2"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Pipeline</p>
          <h1 className="mt-1 text-lg font-bold">New Prospect</h1>
        </div>
      </header>
      <main className="space-y-5 p-5 pb-28">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Company Name</label>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Contact Name</label>
          <input value={contactName} onChange={(e) => setContactName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">City</label>
          <input value={city} onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Owner</label>
          <select value={ownerStaffId} onChange={(e) => setOwnerStaffId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600">
            <option value="">Select owner…</option>
            {bootstrap?.staff?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </main>
      <footer className="fixed bottom-0 z-40 w-full max-w-md border-t border-slate-200 bg-white p-4">
        <button type="button" disabled={create.isPending} onClick={save}
          className="w-full rounded-xl bg-cyan-700 py-3 text-sm font-semibold text-white disabled:opacity-40">
          {create.isPending ? 'Saving…' : 'Create Prospect'}
        </button>
      </footer>
    </div>
  )
}
