import { useParams, useNavigate } from 'react-router-dom'
import { usePortalProvider, usePortalProviderServices } from '../../hooks/usePortal'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'

export default function PortalProviderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const providerId = Number(id)
  const { data: provider, isLoading, isError } = usePortalProvider(providerId)
  const { data: services = [] } = usePortalProviderServices(providerId)

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError || !provider) return <Alert type="danger" message="Provider not found." />

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
        <h2 className="text-lg font-bold text-slate-800">{provider.name}</h2>
        {provider.shortDescription && <p className="text-sm text-slate-600">{provider.shortDescription}</p>}
        <div className="pt-2 border-t border-slate-100 text-sm text-slate-600 space-y-1">
          {provider.contact?.phone && <p>{provider.contact.phone}</p>}
          {provider.contact?.email && <p>{provider.contact.email}</p>}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Services ({services.length})</h3>
        {services.length === 0 ? (
          <p className="text-sm text-slate-400">No services listed.</p>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {services.map((s) => (
              <button key={s.id} onClick={() => nav(`/portal/services/${s.id}`)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors">
                <span className="text-sm font-medium text-slate-800">{s.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{s.status}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
