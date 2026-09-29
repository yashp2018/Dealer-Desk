import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePortalService } from '../../hooks/usePortal'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'

function formatPricing(p?: { type: string; amount?: number; minAmount?: number; maxAmount?: number; currency?: string }): string {
  if (!p) return 'Contact for pricing'
  const cur = p.currency ?? 'INR'
  if (p.type === 'free') return 'Free'
  if (p.type === 'quote') return 'On request'
  if (p.type === 'fixed') return `${cur} ${p.amount ?? '—'}`
  if (p.type === 'range') return `${cur} ${p.minAmount ?? '—'} – ${p.maxAmount ?? '—'}`
  return 'Contact for pricing'
}

export default function PortalServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: service, isLoading, isError } = usePortalService(Number(id))

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError || !service) return <Alert type="danger" message="Service not found." />

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{service.name}</h2>
          {service.provider && (
            <Link to={`/portal/providers/${service.provider.id}`} className="text-sm text-indigo-600 hover:underline">
              {service.provider.name}
            </Link>
          )}
        </div>
        {service.shortDescription && <p className="text-sm text-slate-600">{service.shortDescription}</p>}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-100 text-sm">
          <div>
            <p className="text-xs text-slate-400">Pricing</p>
            <p className="text-slate-700 font-medium">{formatPricing(service.pricing)}</p>
          </div>
          {service.duration && (
            <div>
              <p className="text-xs text-slate-400">Duration</p>
              <p className="text-slate-700 font-medium">{service.duration.value} {service.duration.unit}</p>
            </div>
          )}
        </div>
        {service.description && <p className="text-sm text-slate-600 whitespace-pre-wrap pt-2 border-t border-slate-100">{service.description}</p>}
        {service.features && service.features.length > 0 && (
          <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
            {service.features.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        )}
      </div>

      <button
        onClick={() => nav(`/portal/requests/new?service_name=${encodeURIComponent(service.name)}`)}
        className="w-full bg-indigo-600 text-white text-sm font-semibold py-3 rounded-2xl hover:bg-indigo-700 transition-colors"
      >
        Request This Service
      </button>
    </div>
  )
}
