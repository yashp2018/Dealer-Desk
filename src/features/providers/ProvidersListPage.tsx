import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProviders } from '../../hooks/useProviders'
import DataTable from '../../components/tables/DataTable'
import SearchFilterBar from '../../components/filters/SearchFilterBar'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import Breadcrumb from '../../layouts/Breadcrumb'
import type { Provider } from '../../api/providers'

const VERIFICATION_COLORS: Record<string, string> = {
  verified: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-600',
  inactive: 'bg-gray-100 text-gray-600',
}

export default function ProvidersListPage() {
  const nav = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { data: items = [], isLoading, isError, refetch } = useProviders({ search: search || undefined, verificationStatus: statusFilter || undefined })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError) return <Alert type="danger" message="Failed to load providers." onRetry={refetch} />

  return (
    <div className="space-y-4">
      <Breadcrumb crumbs={[{ label: 'Providers' }]} />
      <SearchFilterBar
        search={search} onSearch={setSearch}
        filters={[{ key: 'verificationStatus', placeholder: 'All Verification', value: statusFilter, onChange: setStatusFilter, options: [{ value: 'verified', label: 'Verified' }, { value: 'pending', label: 'Pending' }, { value: 'rejected', label: 'Rejected' }, { value: 'inactive', label: 'Inactive' }] }]}
      />
      <DataTable<Provider>
        rows={items}
        onRowClick={(p) => nav(`/providers/${p.id}`)}
        emptyMessage="No providers found."
        columns={[
          { label: 'Provider', render: (p) => <span className="font-medium text-gray-800">{p.name}</span> },
          { label: 'Code', render: (p) => <span className="font-mono text-xs text-gray-500">{p.providerCode}</span> },
          { label: 'Services', render: (p) => <span className="text-gray-600">{p.serviceCount ?? 0}</span> },
          { label: 'Rating', render: (p) => <span className="text-gray-600">{p.rating ? p.rating.toFixed(1) : '—'}</span> },
          { label: 'Verification', render: (p) => <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${VERIFICATION_COLORS[p.verificationStatus] ?? 'bg-gray-100 text-gray-600'}`}>{p.verificationStatus}</span> },
        ]}
      />
    </div>
  )
}
