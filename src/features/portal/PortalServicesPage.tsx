import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Wrench } from 'lucide-react'
import { usePortalServices } from '../../hooks/usePortal'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'

export default function PortalServicesPage() {
  const nav = useNavigate()
  const [search, setSearch] = useState('')
  const { data: services = [], isLoading, isError, refetch } = usePortalServices({ search: search || undefined })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Services</h1>
        <p className="text-sm text-slate-500">Browse what's available to request</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search services…"
          className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : isError ? (
        <Alert type="danger" message="Failed to load services." onRetry={refetch} />
      ) : services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <Wrench className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No services found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map((s) => (
            <button key={s.id} onClick={() => nav(`/portal/services/${s.id}`)} className="bg-white rounded-2xl border border-slate-200 p-4 text-left hover:border-indigo-300 transition-colors">
              <p className="text-sm font-semibold text-slate-800">{s.name}</p>
              {s.provider && <p className="text-xs text-slate-400 mt-0.5">{s.provider.name}</p>}
              {s.shortDescription && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{s.shortDescription}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
