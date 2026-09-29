import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServices } from '../../hooks/useServices'
import DataTable from '../../components/tables/DataTable'
import SearchFilterBar from '../../components/filters/SearchFilterBar'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import Breadcrumb from '../../layouts/Breadcrumb'
import type { ServiceItem } from '../../api/services'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  inactive: 'bg-amber-100 text-amber-700',
  archived: 'bg-red-100 text-red-600',
}

export default function ServicesListPage() {
  const nav = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { data: items = [], isLoading, isError, refetch } = useServices({ search: search || undefined, status: statusFilter || undefined })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError) return <Alert type="danger" message="Failed to load services." onRetry={refetch} />

  return (
    <div className="space-y-4">
      <Breadcrumb crumbs={[{ label: 'Services' }]} />
      <SearchFilterBar
        search={search} onSearch={setSearch}
        filters={[{ key: 'status', placeholder: 'All Statuses', value: statusFilter, onChange: setStatusFilter, options: [{ value: 'active', label: 'Active' }, { value: 'draft', label: 'Draft' }, { value: 'inactive', label: 'Inactive' }, { value: 'archived', label: 'Archived' }] }]}
      />
      <DataTable<ServiceItem>
        rows={items}
        onRowClick={(s) => nav(`/services/${s.id}`)}
        emptyMessage="No services found."
        columns={[
          { label: 'Service', render: (s) => <span className="font-medium text-gray-800">{s.name}</span> },
          { label: 'Code', render: (s) => <span className="font-mono text-xs text-gray-500">{s.serviceCode}</span> },
          { label: 'Provider', render: (s) => <span className="text-gray-600">{s.provider?.name ?? '—'}</span> },
          { label: 'Type', render: (s) => <span className="text-gray-600">{s.serviceType ?? '—'}</span> },
          { label: 'Status', render: (s) => <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status] ?? 'bg-gray-100 text-gray-600'}`}>{s.status}</span> },
        ]}
      />
    </div>
  )
}
