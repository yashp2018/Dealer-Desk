import { useRequests } from '../../hooks/useRequests'
import { useDealers } from '../../hooks/useDealers'
import KpiCard from '../../components/cards/KpiCard'
import DataTable from '../../components/tables/DataTable'
import Spinner from '../../components/loaders/Spinner'
import type { Request } from '../../api/types'

export default function ReportsPage() {
  const { data: requests = [] as Request[], isLoading: rLoading } = useRequests()
  const { data: dealers = [], isLoading: dLoading } = useDealers()

  if (rLoading || dLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const byStatus = Object.entries(
    requests.reduce<Record<string, number>>((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc }, {})
  ).map(([status, count]) => ({ id: status, status, count }))

  const byDealer = dealers.map((d) => ({
    id: d.id,
    name: d.name,
    open: requests.filter((r) => r.dealer_id === d.id && !['done', 'cancelled'].includes(r.status)).length,
    done: requests.filter((r) => r.dealer_id === d.id && r.status === 'done').length,
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard value={requests.length} label="Total Requests" />
        <KpiCard value={requests.filter((r) => r.is_overdue).length} label="Overdue" tone="p1" />
        <KpiCard value={requests.filter((r) => r.status === 'done').length} label="Completed" tone="ok" />
        <KpiCard value={dealers.length} label="Active Dealers" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Requests by Status</h3>
        <DataTable rows={byStatus} columns={[{ label: 'Status', field: 'status' }, { label: 'Count', field: 'count' }]} />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Requests by Dealer</h3>
        <DataTable rows={byDealer} columns={[{ label: 'Dealer', field: 'name' }, { label: 'Open', field: 'open' }, { label: 'Done', field: 'done' }]} />
      </div>
    </div>
  )
}
