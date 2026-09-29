import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDealer, useDealerContacts, useDealerRequests, useDealerVisits, useDealerTimeline, useUpdateDealer, useAddDealerContact } from '../../hooks/useDealers'
import { useBootstrap } from '../../hooks/useBootstrap'
import DataTable from '../../components/tables/DataTable'
import StatusBadge from '../../components/badges/StatusBadge'
import PriorityBadge from '../../components/badges/PriorityBadge'
import Timeline from '../../components/timeline/Timeline'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import Breadcrumb from '../../layouts/Breadcrumb'
import { useUiStore } from '../../stores/uiStore'
import { formatDate } from '../../lib/formatDate'
import { relativeTime } from '../../lib/relativeTime'
import { Plus } from 'lucide-react'
import type { Dealer, Request, Visit, TimelineEntry } from '../../api/types'

const TABS = ['Overview', 'Contacts', 'Requests', 'Visits', 'Timeline'] as const

export default function DealerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const [tab, setTab] = useState<typeof TABS[number]>('Overview')
  const { data: dealer, isLoading, isError } = useDealer(id!)
  const { data: contacts = [] } = useDealerContacts(id!)
  const { data: requests = [] } = useDealerRequests(id!)
  const { data: visits = [] } = useDealerVisits(id!)
  const { data: timeline = [] } = useDealerTimeline(id!)
  const { data: bs } = useBootstrap()
  const addToast = useUiStore((s) => s.addToast)
  const updateDealer = useUpdateDealer(id!)
  const addContact = useAddDealerContact(id!)

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError || !dealer) return <Alert type="danger" message="Dealer not found." />

  const d = dealer as Dealer
  const healthColor = { good: 'text-green-600', warning: 'text-amber-600', critical: 'text-red-600' }[d.health] ?? 'text-gray-500'

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const territoryId = String(fd.get('territory_id') || '')
    const ownerId = String(fd.get('owner_staff_id') || '')
    updateDealer.mutate({
      display_name: String(fd.get('display_name') || ''),
      phone_primary: String(fd.get('phone_primary') || ''),
      whatsapp_phone: String(fd.get('whatsapp_phone') || ''),
      city: String(fd.get('city') || ''),
      state_normalized: String(fd.get('state_normalized') || ''),
      tier_id: String(fd.get('tier_id') || ''),
      territory_id: territoryId || null,
      owner_staff_id: ownerId || null,
    }, {
      onSuccess: () => addToast('Dealer updated', 'success'),
      onError: () => addToast('Failed to update dealer', 'error'),
    })
  }

  const handleAddContact = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const name = String(fd.get('name') || '').trim()
    if (!name) { addToast('Contact name is required', 'error'); return }
    addContact.mutate({
      name,
      role_label: String(fd.get('role_label') || '') || undefined,
      phone: String(fd.get('phone') || '') || undefined,
    }, {
      onSuccess: () => { addToast('Contact added', 'success'); form.reset() },
      onError: () => addToast('Failed to add contact', 'error'),
    })
  }

  return (
    <div className="space-y-4 max-w-6xl">
      <Breadcrumb crumbs={[{ label: 'Dealers', to: '/dealers' }, { label: d.display_name }]} />

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-gray-400">{d.code}</span>
          <span className="text-sm font-bold text-gray-800">{d.display_name}</span>
          {d.tier_name && <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: d.tier_color + '1a', color: d.tier_color }}>{d.tier_name}</span>}
        </div>
        <button onClick={() => nav(`/requests/new?dealer=${d.id}`)} className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> New Request
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Dealer Details</h3>
              <form onSubmit={handleSave} className="space-y-3">
                {([['display_name', 'Name', d.display_name], ['phone_primary', 'Phone', d.phone_primary], ['whatsapp_phone', 'WhatsApp', d.whatsapp_phone], ['city', 'City', d.city], ['state_normalized', 'State', d.state_normalized]] as [string, string, string][]).map(([key, label, val]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
                    <input name={key} defaultValue={val} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Tier</label>
                  <select name="tier_id" defaultValue={d.tier_id} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {bs?.tiers?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Territory</label>
                  <select name="territory_id" defaultValue={d.territory_id ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">— None —</option>
                    {bs?.territories?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Owner</label>
                  <select name="owner_staff_id" defaultValue={d.owner_staff_id ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">— Unassigned —</option>
                    {bs?.staff?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <button type="submit" disabled={updateDealer.isPending} className="w-full bg-indigo-600 text-white text-sm py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {updateDealer.isPending ? 'Saving…' : 'Save'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Health</h3>
              <div className="text-4xl font-bold text-gray-800 leading-none">{d.health_score ?? '—'}<span className="text-sm text-gray-400 font-normal">/100</span></div>
              <div className={`text-sm font-medium mt-1 ${healthColor}`}>{d.health}</div>
              <table className="w-full text-xs mt-3 space-y-1">
                <tbody>
                  <tr><td className="text-gray-400 py-0.5">Open requests</td><td className="text-right font-medium">{d.open_requests}</td></tr>
                  <tr><td className="text-gray-400 py-0.5">Overdue</td><td className="text-right font-medium text-red-600">{d.overdue_requests}</td></tr>
                  <tr><td className="text-gray-400 py-0.5">Last contact</td><td className="text-right">{relativeTime(d.last_contact_at)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Requests</h3>
              <DataTable
                rows={(requests as Request[]).slice(0, 5)}
                onRowClick={(r) => nav(`/requests/${r.id}`)}
                columns={[
                  { label: 'Ref', render: (r) => <span className="font-mono text-xs">{r.ref_no}</span> },
                  { label: 'Type', field: 'type_name' },
                  { label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                  { label: 'Due', render: (r) => <span className="text-xs text-gray-500">{r.due_at ? formatDate(r.due_at) : '—'}</span> },
                ]}
                emptyMessage="No requests."
              />
            </div>
            {(visits as Visit[]).length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Visits</h3>
                <DataTable
                  rows={visits as Visit[]}
                  onRowClick={(v) => nav(`/visits/${v.id}`)}
                  columns={[
                    { label: 'Ref', render: (v) => <span className="font-mono text-xs">{v.ref_no}</span> },
                    { label: 'Title', field: 'title' },
                    { label: 'Scheduled', render: (v) => <span className="text-xs">{formatDate(v.scheduled_at)}</span> },
                    { label: 'Status', render: (v) => <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{v.status}</span> },
                  ]}
                  emptyMessage="No visits."
                />
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'Contacts' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-2xl">
          <DataTable
            rows={contacts}
            columns={[
              { label: 'Name', render: (c) => <span className="font-medium">{c.name}{c.is_primary && <span className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">1st</span>}</span> },
              { label: 'Role', field: 'role_label' },
              { label: 'Phone', field: 'phone' },
              { label: 'Email', field: 'email' },
            ]}
            emptyMessage="No contacts."
          />
          <form onSubmit={handleAddContact} className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-3">Add Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <input name="name" placeholder="Name *" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input name="role_label" placeholder="Role" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input name="phone" placeholder="Phone" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button type="submit" disabled={addContact.isPending} className="bg-gray-100 hover:bg-gray-200 text-sm rounded-lg px-3 py-2 disabled:opacity-50">
                {addContact.isPending ? 'Adding…' : 'Add Contact'}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === 'Requests' && (
        <DataTable
          rows={requests as Request[]}
          onRowClick={(r) => nav(`/requests/${r.id}`)}
          columns={[
            { label: 'Ref', render: (r) => <span className="font-mono text-xs">{r.ref_no}</span> },
            { label: 'Priority', render: (r) => <PriorityBadge priority={r.priority} /> },
            { label: 'Title', field: 'title' },
            { label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { label: 'Due', render: (r) => <span className={`text-xs ${r.is_overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>{r.due_at ? formatDate(r.due_at) : '—'}</span> },
          ]}
          emptyMessage="No requests."
        />
      )}

      {tab === 'Visits' && (
        <DataTable
          rows={visits as Visit[]}
          onRowClick={(v) => nav(`/visits/${v.id}`)}
          columns={[
            { label: 'Ref', render: (v) => <span className="font-mono text-xs">{v.ref_no}</span> },
            { label: 'Title', field: 'title' },
            { label: 'Type', field: 'visit_type' },
            { label: 'Scheduled', render: (v) => <span className="text-xs">{formatDate(v.scheduled_at)}</span> },
            { label: 'Status', render: (v) => <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{v.status}</span> },
          ]}
          emptyMessage="No visits."
        />
      )}

      {tab === 'Timeline' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-2xl">
          <Timeline entries={timeline as TimelineEntry[]} />
        </div>
      )}
    </div>
  )
}
