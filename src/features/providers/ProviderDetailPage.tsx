import { useParams, useNavigate } from 'react-router-dom'
import { useProvider, useProviderServices } from '../../hooks/useProviders'
import DataTable from '../../components/tables/DataTable'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import Breadcrumb from '../../layouts/Breadcrumb'
import type { ServiceItem } from '../../api/services'

export default function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const providerId = Number(id)
  const { data: provider, isLoading, isError } = useProvider(providerId)
  const { data: services = [] } = useProviderServices(providerId)

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError || !provider) return <Alert type="danger" message="Provider not found." />

  return (
    <div className="space-y-4 max-w-4xl">
      <Breadcrumb crumbs={[{ label: 'Providers', to: '/providers' }, { label: provider.name }]} />

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs text-gray-400">{provider.providerCode}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-600">{provider.verificationStatus}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">{provider.status}</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-800">{provider.name}</h2>
        {provider.shortDescription && <p className="text-sm text-gray-500 mt-0.5">{provider.shortDescription}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-1.5 text-sm text-gray-600">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Contact</h3>
          <p><span className="text-gray-400">Phone:</span> {provider.contact?.phone ?? '—'}</p>
          <p><span className="text-gray-400">Email:</span> {provider.contact?.email ?? '—'}</p>
          <p><span className="text-gray-400">Website:</span> {provider.contact?.website ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-1.5 text-sm text-gray-600">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Address</h3>
          <p>{[provider.address?.address, provider.address?.city, provider.address?.state, provider.address?.country, provider.address?.postalCode].filter(Boolean).join(', ') || '—'}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Services ({services.length})</h3>
        <DataTable<ServiceItem>
          rows={services}
          onRowClick={(s) => nav(`/services/${s.id}`)}
          emptyMessage="No services from this provider."
          columns={[
            { label: 'Service', render: (s) => <span className="font-medium text-gray-800">{s.name}</span> },
            { label: 'Type', render: (s) => <span className="text-gray-600">{s.serviceType ?? '—'}</span> },
            { label: 'Status', render: (s) => <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">{s.status}</span> },
          ]}
        />
      </div>
    </div>
  )
}
