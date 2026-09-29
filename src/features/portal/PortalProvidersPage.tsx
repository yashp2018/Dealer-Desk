import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Store } from 'lucide-react'
import { usePortalProviders } from '../../hooks/usePortal'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'

export default function PortalProvidersPage() {
  const nav = useNavigate()
  const [search, setSearch] = useState('')
  const { data: providers = [], isLoading, isError, refetch } = usePortalProviders({ search: search || undefined })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Providers</h1>
        <p className="text-sm text-slate-500">Verified service providers</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search providers…"
          className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : isError ? (
        <Alert type="danger" message="Failed to load providers." onRetry={refetch} />
      ) : providers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <Store className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No providers found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {providers.map((p) => (
            <button key={p.id} onClick={() => nav(`/portal/providers/${p.id}`)} className="bg-white rounded-2xl border border-slate-200 p-4 text-left hover:border-indigo-300 transition-colors">
              <p className="text-sm font-semibold text-slate-800">{p.name}</p>
              {p.shortDescription && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.shortDescription}</p>}
              <p className="text-xs text-slate-400 mt-2">{p.serviceCount ?? 0} services</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
