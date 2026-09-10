/**
 * Desktop — Dealers list  (mirrors desktop/dealers.php)
 * Table: code · name+city · tier pill · owner · open · overdue · last contact
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDealers } from '../../hooks/useDealers'
import { useBootstrap } from '../../hooks/useBootstrap'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import { relativeTime } from '../../lib/relativeTime'

export default function DesktopDealersPage() {
  const nav = useNavigate()
  const { data = [], isLoading, isError, refetch } = useDealers()
  const { data: bs } = useBootstrap()
  const [search, setSearch] = useState('')
  const [tierId, setTierId] = useState('')

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError) return <Alert type="danger" message="Failed to load dealers." onRetry={refetch} />

  type Dealer = typeof data[0]
  const filtered = (data as Dealer[]).filter((d) =>
    (!search || d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase())) &&
    (!tierId || String(d.tier_id) === tierId)
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-800">Dealers ({filtered.length})</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search dealer…"
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
        />
        <select value={tierId} onChange={(e) => setTierId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Tiers</option>
          {bs?.tiers?.map((t) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Code', 'Dealer', 'Tier', 'Owner', 'Open', 'Overdue', 'Last Contact'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center text-gray-400 py-10 text-sm">No dealers found.</td></tr>
            )}
            {filtered.map((d) => (
              <tr key={d.id} onClick={() => nav(`/desktop/dealers/${d.id}`)}
                className="hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.code}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{d.name}</p>
                  <p className="text-xs text-gray-400">{[d.city, d.state_normalized].filter(Boolean).join(', ')}</p>
                </td>
                <td className="px-4 py-3">
                  {d.tier_name && (
                    <span className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{ background: d.tier_color + '1a', color: d.tier_color }}>
                      {d.tier_name}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{d.owner_staff_id ? `Staff #${d.owner_staff_id}` : '—'}</td>
                <td className="px-4 py-3 text-gray-700 font-medium">{d.open_requests}</td>
                <td className="px-4 py-3">
                  {d.overdue_requests > 0
                    ? <span className="text-red-600 font-semibold">{d.overdue_requests}</span>
                    : <span className="text-gray-400">0</span>}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{relativeTime(d.last_contact_at ?? '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
