import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Search, Upload } from 'lucide-react'
import { useDealers, useImportCandidates, useImportDealers } from '../../hooks/useDealers'
import { useUiStore } from '../../stores/uiStore'
import Spinner from '../../components/loaders/Spinner'

export default function MobileDealersPage() {
  const [search, setSearch] = useState('')
  const { data = [], isLoading, isError } = useDealers()
  const { data: candidates = [] } = useImportCandidates()
  const importDealers = useImportDealers()
  const addToast = useUiStore((s) => s.addToast)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const filtered = useMemo(
    () => data.filter((dealer) => `${dealer.display_name} ${dealer.city} ${dealer.code}`.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  )

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    importDealers.mutate(file, {
      onSuccess: (r) => addToast(`Imported ${r.imported} dealer name${r.imported === 1 ? '' : 's'}${r.skipped_duplicate ? ` (${r.skipped_duplicate} already known)` : ''}`, 'success'),
      onError: (e) => addToast(e.message ?? 'Import failed', 'error'),
    })
  }

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  if (isError) return <div className="p-5"><div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">Live dealer data is unavailable.</div></div>

  return (
    <div>
      <header className="bg-slate-950 px-5 pb-5 pt-6 text-white">
        <div className="flex items-center gap-3">
          <Link to="/mobile" className="rounded-full bg-white/10 p-2"><ArrowLeft className="h-5 w-5" /></Link>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Directory</p>
            <h1 className="mt-1 text-xl font-bold">Dealers</h1>
          </div>
          <button
            type="button"
            aria-label="Import dealers"
            onClick={() => fileInputRef.current?.click()}
            disabled={importDealers.isPending}
            className="rounded-full bg-white/10 p-2.5 disabled:opacity-50"
          >
            <Upload className="h-5 w-5" />
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFilePick} />
          <Link to="/mobile/dealers/new" aria-label="New dealer" className="rounded-full bg-cyan-600 p-2.5">
            <Plus className="h-5 w-5" />
          </Link>
        </div>
        <label className="mt-5 flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-slate-500">
          <Search className="h-5 w-5" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search dealers"
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none"
          />
        </label>
      </header>

      {candidates.length > 0 && (
        <Link to="/mobile/dealers/new" className="flex items-center justify-between gap-3 border-b border-cyan-100 bg-cyan-50 px-5 py-3 text-sm active:bg-cyan-100">
          <span className="text-cyan-800">{candidates.length} imported name{candidates.length === 1 ? '' : 's'} ready to become dealers</span>
          <span className="shrink-0 font-medium text-cyan-700">Create →</span>
        </Link>
      )}

      <div className="divide-y divide-slate-100 bg-white">
        {filtered.map((dealer) => (
          <Link key={dealer.id} to={`/mobile/dealers/${dealer.id}`} className="flex items-center justify-between px-5 py-4 active:bg-slate-50">
            <span className="min-w-0">
              <strong className="block truncate text-sm text-slate-800">{dealer.display_name}</strong>
              <span className="mt-1 block text-xs text-slate-400">{dealer.city} · {dealer.code}</span>
            </span>
            {dealer.overdue_requests > 0 ? (
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">{dealer.overdue_requests}</span>
            ) : dealer.open_requests > 0 ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{dealer.open_requests}</span>
            ) : null}
          </Link>
        ))}
        {filtered.length === 0 && <p className="px-5 py-16 text-center text-sm text-slate-400">No dealers found.</p>}
      </div>
    </div>
  )
}
