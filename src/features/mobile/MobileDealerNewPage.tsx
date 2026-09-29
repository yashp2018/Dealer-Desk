import { useMemo, useRef, useState } from 'react'
import { ArrowLeft, ChevronDown, Upload } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useBootstrap } from '../../hooks/useBootstrap'
import { useCreateDealer, useImportCandidates, useImportDealers } from '../../hooks/useDealers'
import { useAuth } from '../../hooks/useAuth'
import { useUiStore } from '../../stores/uiStore'
import Spinner from '../../components/loaders/Spinner'
import type { CreateDealerPayload, DealerImportCandidate } from '../../api/types'

export default function MobileDealerNewPage() {
  const navigate = useNavigate()
  const { data: bootstrap, isLoading } = useBootstrap()
  const create = useCreateDealer()
  const importDealers = useImportDealers()
  const { data: candidates = [] } = useImportCandidates()
  const { isAdmin } = useAuth()
  const addToast = useUiStore((s) => s.addToast)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [tierId, setTierId] = useState('')
  const [territoryId, setTerritoryId] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [ownerStaffId, setOwnerStaffId] = useState('')
  const [matchedCandidateId, setMatchedCandidateId] = useState<string | undefined>()
  const [nameDropdownOpen, setNameDropdownOpen] = useState(false)
  const nameBlurTimer = useRef<ReturnType<typeof setTimeout>>()

  const candidateByName = useMemo(
    () => new Map(candidates.map((c) => [c.name.trim().toLowerCase(), c])),
    [candidates],
  )

  const nameMatches = useMemo(() => {
    const q = name.trim().toLowerCase()
    const list = q ? candidates.filter((c) => c.name.toLowerCase().includes(q)) : candidates
    return list.slice(0, 20)
  }, [candidates, name])

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>

  const applyCandidate = (match: DealerImportCandidate) => {
    setName(match.name)
    setMatchedCandidateId(match.id)
    if (match.city) setCity(match.city)
    if (match.phone_primary) setPhone(match.phone_primary)
    setNameDropdownOpen(false)
  }

  const handleNameChange = (value: string) => {
    setName(value)
    const match = candidateByName.get(value.trim().toLowerCase())
    setMatchedCandidateId(match ? match.id : undefined)
  }

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    importDealers.mutate(file, {
      onSuccess: (r) => addToast(`Imported ${r.imported} dealer name${r.imported === 1 ? '' : 's'}${r.skipped_duplicate ? ` (${r.skipped_duplicate} already known)` : ''}`, 'success'),
      onError: (e) => addToast(e.message ?? 'Import failed', 'error'),
    })
  }

  const save = () => {
    if (!name.trim() || !tierId || !territoryId) {
      addToast('Dealer name, tier, and territory are required', 'error')
      return
    }
    const payload: CreateDealerPayload = {
      name: name.trim(),
      display_name: displayName.trim() || undefined,
      tier_id: tierId,
      territory_id: territoryId,
      city: city.trim() || undefined,
      phone_primary: phone.trim() || undefined,
      // Only admins can pick a different owner — regular staff always end up
      // owning what they create (enforced server-side too, not just hidden here).
      owner_staff_id: isAdmin ? (ownerStaffId || undefined) : undefined,
      import_candidate_id: matchedCandidateId,
    }
    create.mutate(payload, {
      onSuccess: (d) => { addToast('Dealer created', 'success'); navigate(`/mobile/dealers/${d.id}`) },
      onError: (e) => addToast(e.message ?? 'Unable to create dealer', 'error'),
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center gap-3 bg-slate-950 px-5 py-5 text-white">
        <Link to="/mobile/dealers" className="rounded-full bg-white/10 p-2"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Directory</p>
          <h1 className="mt-1 text-lg font-bold">New Dealer</h1>
        </div>
      </header>
      <main className="space-y-5 p-5 pb-28">
        <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-600">Have a list of dealer names?</p>
            <p className="text-xs text-slate-400">
              {candidates.length > 0 ? `${candidates.length} imported name${candidates.length === 1 ? '' : 's'} ready` : 'Upload a CSV'}
            </p>
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={importDealers.isPending}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50">
            <Upload className="h-3.5 w-3.5" />
            {importDealers.isPending ? 'Uploading…' : 'Import'}
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFilePick} />
        </div>

        <div className="relative">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Dealer Name</label>
          <div className="relative">
            <input
              value={name}
              autoComplete="off"
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => { clearTimeout(nameBlurTimer.current); setNameDropdownOpen(true) }}
              onBlur={() => { nameBlurTimer.current = setTimeout(() => setNameDropdownOpen(false), 150) }}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-cyan-600"
            />
            {candidates.length > 0 && (
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            )}
          </div>
          {nameDropdownOpen && candidates.length > 0 && (
            <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {nameMatches.length === 0 ? (
                <p className="px-4 py-3 text-xs text-slate-400">No imported name matches — this will be a new dealer.</p>
              ) : (
                nameMatches.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyCandidate(c)}
                    className="flex w-full flex-col items-start px-4 py-2.5 text-left hover:bg-slate-50 active:bg-slate-100"
                  >
                    <span className="text-sm text-slate-800">{c.name}</span>
                    {(c.city || c.phone_primary) && (
                      <span className="text-xs text-slate-400">{[c.city, c.phone_primary].filter(Boolean).join(' · ')}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
          {matchedCandidateId && <p className="mt-1 text-xs text-cyan-700">Filled from imported list</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Display Name</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Defaults to Dealer Name"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Tier</label>
            <select value={tierId} onChange={(e) => setTierId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600">
              <option value="">Select…</option>
              {bootstrap?.tiers?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Territory</label>
            <select value={territoryId} onChange={(e) => setTerritoryId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600">
              <option value="">Select…</option>
              {bootstrap?.territories?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">City</label>
          <input value={city} onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600" />
        </div>
        {isAdmin && (
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Owner (optional)</label>
            <select value={ownerStaffId} onChange={(e) => setOwnerStaffId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600">
              <option value="">Assign to me</option>
              {bootstrap?.staff?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
      </main>
      <footer className="fixed bottom-0 z-40 w-full max-w-md border-t border-slate-200 bg-white p-4">
        <button type="button" disabled={create.isPending} onClick={save}
          className="w-full rounded-xl bg-cyan-700 py-3 text-sm font-semibold text-white disabled:opacity-40">
          {create.isPending ? 'Saving…' : 'Create Dealer'}
        </button>
      </footer>
    </div>
  )
}
