import { useParams, Link } from 'react-router-dom'
import { useService } from '../../hooks/useServices'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import Breadcrumb from '../../layouts/Breadcrumb'

function formatPricing(p?: { type: string; amount?: number; minAmount?: number; maxAmount?: number; currency?: string }): string {
  if (!p) return '—'
  const cur = p.currency ?? 'INR'
  if (p.type === 'free') return 'Free'
  if (p.type === 'quote') return 'On request'
  if (p.type === 'fixed') return `${cur} ${p.amount ?? '—'}`
  if (p.type === 'range') return `${cur} ${p.minAmount ?? '—'} – ${p.maxAmount ?? '—'}`
  return '—'
}

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: service, isLoading, isError } = useService(Number(id))

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError || !service) return <Alert type="danger" message="Service not found." />

  return (
    <div className="space-y-4 max-w-4xl">
      <Breadcrumb crumbs={[{ label: 'Services', to: '/services' }, { label: service.name }]} />

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-gray-400">{service.serviceCode}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-600">{service.status}</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-800">{service.name}</h2>
            {service.shortDescription && <p className="text-sm text-gray-500 mt-0.5">{service.shortDescription}</p>}
          </div>
          {service.provider && (
            <Link to={`/providers/${service.provider.id}`} className="text-sm text-indigo-600 hover:underline shrink-0">
              {service.provider.name} →
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Pricing & Duration</h3>
          <div className="text-sm text-gray-600 space-y-1.5">
            <p><span className="text-gray-400">Pricing:</span> {formatPricing(service.pricing)}</p>
            <p><span className="text-gray-400">Duration:</span> {service.duration ? `${service.duration.value} ${service.duration.unit}` : '—'}</p>
            <p><span className="text-gray-400">Location:</span> {[service.location?.city, service.location?.state, service.location?.country].filter(Boolean).join(', ') || '—'}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Availability</h3>
          {service.availability?.enabled ? (
            <div className="text-sm text-gray-600 space-y-1.5">
              <p>{(service.availability.days ?? []).join(', ') || 'No days set'}</p>
              {service.availability.startTime && <p className="text-gray-400 text-xs">{service.availability.startTime} – {service.availability.endTime}</p>}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Not restricted.</p>
          )}
        </div>

        {service.eligibility && service.eligibility.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Eligibility</h3>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              {service.eligibility.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {service.features && service.features.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Features</h3>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              {service.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        )}
      </div>

      {service.description && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{service.description}</p>
        </div>
      )}
    </div>
  )
}
