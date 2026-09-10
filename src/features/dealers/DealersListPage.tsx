import { useState } from 'react'
import { useDealers } from '../../hooks/useDealers'
import DealerCard from '../../components/cards/DealerCard'
import SearchFilterBar from '../../components/filters/SearchFilterBar'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'

export default function DealersListPage() {
  const { data = [], isLoading, isError, refetch } = useDealers()
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('')

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError) return <Alert type="danger" message="Failed to load dealers." onRetry={refetch} />

  const filtered = data.filter((d) =>
    (!search || d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase())) &&
    (!tierFilter || d.tier_name === tierFilter)
  )

  return (
    <div className="space-y-4">
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
