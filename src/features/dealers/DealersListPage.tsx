import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Upload } from 'lucide-react'
import { useDealers, useImportCandidates, useImportDealers } from '../../hooks/useDealers'
import { useUiStore } from '../../stores/uiStore'
import DealerCard from '../../components/cards/DealerCard'
import SearchFilterBar from '../../components/filters/SearchFilterBar'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'

export default function DealersListPage() {
  const nav = useNavigate()
  const { data = [], isLoading, isError, refetch } = useDealers()
  const { data: candidates = [] } = useImportCandidates()
  const importDealers = useImportDealers()
  const addToast = useUiStore((s) => s.addToast)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('')

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError) return <Alert type="danger" message="Failed to load dealers." onRetry={refetch} />

  const filtered = data.filter((d) =>
    (!search || d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase())) &&
    (!tierFilter || d.tier_name === tierFilter)
  )

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    importDealers.mutate(file, {
      onSuccess: (r) => addToast(
        `Imported ${r.imported} dealer name${r.imported === 1 ? '' : 's'}${r.skipped_duplicate ? ` (${r.skipped_duplicate} already known, skipped)` : ''} — pick them from the Dealer Name dropdown on New Dealer`,
        'success',
      ),
      onError: (e) => addToast(e.message ?? 'Import failed', 'error'),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Dealers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Every dealer in the network.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importDealers.isPending}
            className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Upload className="h-4 w-4" /> {importDealers.isPending ? 'Uploading…' : 'Import Dealers'}
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFilePick} />
          <button
            onClick={() => nav('/dealers/new')}
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> New Dealer
          </button>
        </div>
      </div>

      {candidates.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm">
          <span className="text-indigo-800">
            {candidates.length} imported name{candidates.length === 1 ? '' : 's'} ready to become dealers
          </span>
          <button onClick={() => nav('/dealers/new')} className="font-medium text-indigo-700 hover:underline shrink-0">
            Create from list →
          </button>
        </div>
      )}

      <SearchFilterBar
        search={search} onSearch={setSearch}
        filters={[{ key: 'tier', placeholder: 'All Tiers', value: tierFilter, onChange: setTierFilter, options: [{ value: 'Gold', label: 'Gold' }, { value: 'Silver', label: 'Silver' }, { value: 'Bronze', label: 'Bronze' }] }]}
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No dealers found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => <DealerCard key={d.id} dealer={d} />)}
        </div>
      )}
    </div>
  )
}
