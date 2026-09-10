/**
 * Desktop — Dealer 360  (mirrors desktop/dealer_360.php)
 * Left col: edit form · health · contacts+add form
 * Right col: requests table · visits table · timeline
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useDealer, useDealerContacts, useDealerRequests, useDealerVisits, useDealerTimeline } from '../../hooks/useDealers'
import { useBootstrap } from '../../hooks/useBootstrap'
import Timeline from '../../components/timeline/Timeline'
import StatusBadge from '../../components/badges/StatusBadge'
import PriorityBadge from '../../components/badges/PriorityBadge'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import Breadcrumb from '../../layouts/Breadcrumb'
import { useUiStore } from '../../stores/uiStore'
import { formatDate, formatDateTime } from '../../lib/formatDate'
import { relativeTime } from '../../lib/relativeTime'
import { Plus } from 'lucide-react'

export default function DesktopDealer360Page() {
  const { id } = useParams<{ id: string }>()
  const did = Number(id)
  const nav = useNavigate()
  const { data: dealer, isLoading, isError } = useDealer(did)
  const { data: contacts = [] } = useDealerContacts(did)
  const { data: requests = [] } = useDealerRequests(did)
  const { data: dealerVisits = [] } = useDealerVisits(did)
  const { data: timeline = [] } = useDealerTimeline(did)
  const { data: bs } = useBootstrap()
  const addToast = useUiStore((s) => s.addToast)

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError || !dealer) return <Alert type="danger" message="Dealer not found." />

  const d = dealer
  const healthColor = { good: 'text-green-600', warning: 'text-amber-600', critical: 'text-red-600' }[d.health] ?? 'text-gray-500'

  return (
    <div className="space-y-4 max-w-7xl">
      <Breadcrumb crumbs={[{ label: 'Dealers', to: '/desktop/dealers' }, { label: d.display_name }]} />

      {/* Page header */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-gray-800">{d.display_name}</span>
          <span className="font-mono text-xs text-gray-400">{d.code}</span>
          {d.tier_name && (
            <span className="text-xs px-2 py-0.5 rounded font-medium"
              style={{ background: d.tier_color + '1a', color: d.tier_color }}>{d.tier_name}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => nav(`/requests/new?dealer=${d.id}`)}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> New Request
          </button>
          {d.client_id && (
            <button className="border border-gray-300 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50">
              Customer
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Left column ── */}
        <div className="space-y-4">

          {/* Edit form */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Dealer</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Name</label>
                <input defaultValue={d.display_name} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Phone</label>
                  <input defaultValue={d.phone_primary} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">WhatsApp</label>
                  <input defaultValue={d.whatsapp_phone} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">City</label>
                  <input defaultValue={d.city} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">State</label>
                  <input defaultValue={d.state_normalized} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Tier</label>
                <select defaultValue={d.tier_id} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {bs?.tiers?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Territory</label>
                <select defaultValue={d.territory_id} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">— None —</option>
                  {bs?.territories?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <label className="flex items-center gap-2 mt-2 text-xs text-gray-500 cursor-pointer">
                  <input type="checkbox" defaultChecked={d.territory_is_manual} className="rounded border-gray-300" />
                  Pin against rule sweeps
                </label>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Owner</label>
                <select defaultValue={d.owner_staff_id ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">— Unassigned —</option>
                  {bs?.staff?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <button onClick={() => addToast('Dealer updated', 'success')}
                className="w-full bg-indigo-600 text-white text-sm py-2 rounded-lg hover:bg-indigo-700">
                Save
              </button>
            </div>
          </div>

          {/* Health */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Health</h3>
            <div className="text-4xl font-bold text-gray-800 leading-none">
              {d.health_score ?? '—'}<span className="text-sm text-gray-400 font-normal">/100</span>
            </div>
            <div className={`text-sm font-medium mt-1 capitalize ${healthColor}`}>{d.health}</div>
            <table className="w-full text-xs mt-3">
              <tbody>
                <tr><td className="text-gray-400 py-0.5">Open requests</td><td className="text-right font-medium">{d.open_requests}</td></tr>
                <tr><td className="text-gray-400 py-0.5">Overdue</td><td className="text-right font-medium text-red-600">{d.overdue_requests}</td></tr>
                <tr><td className="text-gray-400 py-0.5">Last contact</td><td className="text-right">{relativeTime(d.last_contact_at ?? '')}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Contacts */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Contacts</h3>
              <span className="text-xs text-gray-400">{(contacts as unknown[]).length}</span>
            </div>
            {(contacts as { id: number; name: string; role_label: string; phone: string; is_primary: boolean }[]).map((c) => (
              <div key={c.id} className="py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-800">{c.name}</span>
                  {c.is_primary && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">1st</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{c.role_label}{c.phone && ` · ${c.phone}`}</p>
              </div>
            ))}
            {/* Add contact form */}
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Name *" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input placeholder="Role" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <input placeholder="Phone" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button onClick={() => addToast('Contact added', 'success')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-sm rounded-lg py-1.5">
                Add Contact
              </button>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Requests table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Requests</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Ref', 'Type', 'Status', 'Due'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(requests as { id: number; ref_no: string; type_name: string; title?: string; status: string; priority: number; due_at: string | null }[]).length === 0 && (
                  <tr><td colSpan={4} className="text-center text-gray-400 py-8 text-sm">No requests.</td></tr>
                )}
                {(requests as { id: number; ref_no: string; type_name: string; title?: string; status: string; priority: number; due_at: string | null }[]).map((r) => (
                  <tr key={r.id} onClick={() => nav(`/requests/${r.id}`)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3">
                      <PriorityBadge priority={r.priority} />
                      <span className="ml-2 font-mono text-xs text-gray-600">{r.ref_no}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{r.type_name}</p>
                      {r.title && <p className="text-xs text-gray-400">{r.title}</p>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.due_at ? formatDate(r.due_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Visits table */}
          {dealerVisits.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Visits</h3>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {dealerVisits.map((v) => (
                    <tr key={v.id} onClick={() => nav(`/desktop/visits/${v.id}`)} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{v.ref_no}</td>
                      <td className="px-4 py-3 text-gray-700">{v.title}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(v.scheduled_at)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{v.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Timeline</h3>
            <Timeline entries={timeline} />
          </div>
        </div>
      </div>
    </div>
  )
}
