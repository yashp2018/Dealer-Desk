import { useState } from 'react'
import { useBootstrap } from '../../hooks/useBootstrap'
import {
  useRequestTypesAdmin, useCreateRequestType,
  useTiersAdmin, useCreateTier, useUpdateTier,
  useVisitTypesAdmin, useCreateVisitType, useUpdateVisitType, useDeleteVisitType,
  useEscalationRules, useCreateEscalationRule, useUpdateEscalationRule, useRunEscalationRulesNow, useRoles,
  useStaffAdmin, useCreateStaff, useUpdateStaff,
} from '../../hooks/useSetup'
import { useUiStore } from '../../stores/uiStore'
import Spinner from '../../components/loaders/Spinner'
import PriorityBadge from '../../components/badges/PriorityBadge'
import type { RequestTypePayload, TierAdmin, TierPayload, VisitTypeAdmin, EscalationRulePayload, EscalationActionType, StaffAdmin, StaffCreatePayload, RoleAdmin } from '../../api/setup'
import { Wrench, Star, MapPin, ListOrdered, Bell, Settings2, Upload, Play, Users, CalendarClock, Trash2 } from 'lucide-react'

type Tab = 'request_types' | 'tiers' | 'territories' | 'visit_types' | 'priority_rules' | 'escalation_rules' | 'employees' | 'configuration' | 'import_dealers'

const TABS: { key: Tab; label: string; icon: typeof Wrench; group: string; ready: boolean }[] = [
  { key: 'request_types', label: 'Request types', icon: Wrench, group: 'What the desk handles', ready: true },
  { key: 'tiers', label: 'Dealer tiers', icon: Star, group: 'What the desk handles', ready: true },
  { key: 'territories', label: 'Territories & routing', icon: MapPin, group: 'What the desk handles', ready: true },
  { key: 'visit_types', label: 'Visit types', icon: CalendarClock, group: 'What the desk handles', ready: true },
  { key: 'priority_rules', label: 'Priority rules', icon: ListOrdered, group: 'How work is ranked', ready: false },
  { key: 'escalation_rules', label: 'Escalation rules', icon: Bell, group: 'How work is ranked', ready: true },
  { key: 'employees', label: 'Employees', icon: Users, group: 'People & access', ready: true },
  { key: 'configuration', label: 'Configuration', icon: Settings2, group: 'System', ready: true },
  { key: 'import_dealers', label: 'Import dealers', icon: Upload, group: 'System', ready: false },
]
const GROUPS = ['What the desk handles', 'How work is ranked', 'People & access', 'System']

function toSlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
}

function slaLabel(hours: number): string {
  if (hours % 24 === 0 && hours >= 24) return `${hours / 24}d`
  return `${hours}h`
}

const emptyForm: RequestTypePayload = {
  name: '', slug: '', icon: 'fa-circle', color: '#6366f1', default_priority: 3, sla_hours: 48, push_target: '', allows_prospect: false, goes_through_production: false,
}

function RequestTypesPanel() {
  const { data: types = [], isLoading } = useRequestTypesAdmin()
  const create = useCreateRequestType()
  const addToast = useUiStore((s) => s.addToast)
  const [form, setForm] = useState<RequestTypePayload>(emptyForm)
  const [slugTouched, setSlugTouched] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.slug.trim()) return
    create.mutate(form, {
      onSuccess: () => { addToast('Request type added', 'success'); setForm(emptyForm); setSlugTouched(false) },
      onError: () => addToast('Failed to add request type — check the slug and color format', 'error'),
    })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Request types</h2>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-900">
        Adding a type here is all it takes — no deploy. A type with no ERP document leaves <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-indigo-200">push target</span> blank and simply never produces a downstream document.
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Default priority</th>
                <th className="px-4 py-2.5">Respond within</th>
                <th className="px-4 py-2.5">Creates</th>
                <th className="px-4 py-2.5">Goes through production</th>
                <th className="px-4 py-2.5">Questions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="py-10"><div className="flex justify-center"><Spinner size="md" /></div></td></tr>
              ) : types.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-gray-400">No request types yet.</td></tr>
              ) : (
                types.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-6 w-6 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                        <div>
                          <p className="font-medium text-gray-800">{t.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{t.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={t.default_priority} /></td>
                    <td className="px-4 py-3 text-gray-600">{slaLabel(t.sla_hours)}</td>
                    <td className="px-4 py-3 text-gray-600">{t.push_target || <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">No document raised</span>}</td>
                    <td className="px-4 py-3">
                      {t.goes_through_production
                        ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">Enabled</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.question_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">New type</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <input
            placeholder="Name" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugTouched ? f.slug : toSlug(e.target.value) }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 col-span-2 sm:col-span-1"
          />
          <input
            placeholder="slug" value={form.slug}
            onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: e.target.value })) }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            placeholder="fa-circle" value={form.icon}
            onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text" placeholder="#0b6272" value={form.color}
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={form.default_priority}
            onChange={(e) => setForm((f) => ({ ...f, default_priority: Number(e.target.value) }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={1}>P1</option>
            <option value={2}>P2</option>
            <option value={3}>P3</option>
            <option value={4}>P4</option>
          </select>
          <input
            type="number" min={1} placeholder="72" value={form.sla_hours}
            onChange={(e) => setForm((f) => ({ ...f, sla_hours: Number(e.target.value) }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            placeholder="Creates (e.g. Sales Order)" value={form.push_target}
            onChange={(e) => setForm((f) => ({ ...f, push_target: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 col-span-2 sm:col-span-1"
          />
          <label className="flex items-center gap-2 text-sm text-gray-600 col-span-2 sm:col-span-2">
            <input
              type="checkbox" checked={form.goes_through_production}
              onChange={(e) => setForm((f) => ({ ...f, goes_through_production: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            Goes through production — the order stays open until the plant reports dispatch.
          </label>
          <button
            type="submit" disabled={create.isPending}
            className="col-span-2 sm:col-span-2 bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {create.isPending ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  )
}

const emptyTierForm: TierPayload = { name: '', rank: 0, priority_boost: 0, multiplier: 1, color: '#6b7280' }

function TiersPanel() {
  const { data: tiers = [], isLoading } = useTiersAdmin()
  const create = useCreateTier()
  const addToast = useUiStore((s) => s.addToast)
  const [form, setForm] = useState<TierPayload>(emptyTierForm)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    create.mutate(form, {
      onSuccess: () => { addToast('Tier added', 'success'); setForm(emptyTierForm) },
      onError: () => addToast('Failed to add tier', 'error'),
    })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Dealer tiers</h2>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-900">
        Rank sets display order in this list. Priority boost lowers a dealer's effective request priority by that many levels (0 = no boost). Response time multiplier scales SLA hours — below 1.0 responds faster, above 1.0 slower.
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-2.5">Tier</th>
                <th className="px-4 py-2.5">Rank</th>
                <th className="px-4 py-2.5">Priority boost</th>
                <th className="px-4 py-2.5">Response time multiplier</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="py-10"><div className="flex justify-center"><Spinner size="md" /></div></td></tr>
              ) : tiers.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-sm text-gray-400">No tiers yet.</td></tr>
              ) : (
                tiers.map((t) => <TierRow key={t.id} tier={t} />)
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">New tier</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <input
            placeholder="Name" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 col-span-2 sm:col-span-1"
          />
          <input
            type="number" min={0} placeholder="Rank" value={form.rank}
            onChange={(e) => setForm((f) => ({ ...f, rank: Number(e.target.value) }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="number" min={0} max={3} placeholder="Priority boost" value={form.priority_boost}
            onChange={(e) => setForm((f) => ({ ...f, priority_boost: Number(e.target.value) }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="number" min={0.1} step={0.05} placeholder="Response time multiplier" value={form.multiplier}
            onChange={(e) => setForm((f) => ({ ...f, multiplier: Number(e.target.value) }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text" placeholder="#6b7280" value={form.color}
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit" disabled={create.isPending}
            className="col-span-2 sm:col-span-3 bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {create.isPending ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  )
}

function TierRow({ tier }: { tier: TierAdmin }) {
  const update = useUpdateTier(tier.id)
  const addToast = useUiStore((s) => s.addToast)
  const [name, setName] = useState(tier.name)
  const [rank, setRank] = useState(tier.rank)
  const [priorityBoost, setPriorityBoost] = useState(tier.priority_boost)
  const [multiplier, setMultiplier] = useState(tier.multiplier)

  const handleSave = () => {
    update.mutate(
      { name, rank, priority_boost: priorityBoost, multiplier },
      { onSuccess: () => addToast('Tier updated', 'success'), onError: () => addToast('Failed to update tier', 'error') },
    )
  }

  return (
    <tr>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="h-6 w-6 rounded-full shrink-0" style={{ backgroundColor: tier.color }} />
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </td>
      <td className="px-4 py-3">
        <input
          type="number" min={0} value={rank} onChange={(e) => setRank(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="number" min={0} max={3} value={priorityBoost} onChange={(e) => setPriorityBoost(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="number" min={0.1} step={0.05} value={multiplier} onChange={(e) => setMultiplier(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleSave} disabled={update.isPending}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {update.isPending ? 'Saving…' : 'Save'}
        </button>
      </td>
    </tr>
  )
}

function VisitTypesPanel() {
  const { data: types = [], isLoading } = useVisitTypesAdmin()
  const create = useCreateVisitType()
  const addToast = useUiStore((s) => s.addToast)
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    create.mutate({ name: name.trim() }, {
      onSuccess: () => { addToast('Visit type added', 'success'); setName('') },
      onError: (err) => addToast(err.message ?? 'Failed to add visit type', 'error'),
    })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Visit types</h2>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-900">
        This is the list every "Visit Type" dropdown pulls from — on the desktop New Visit form, the mobile booking flow, and the Visits calendar filter. A type already used by a visit can't be deleted, only renamed.
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={2} className="py-10"><div className="flex justify-center"><Spinner size="md" /></div></td></tr>
              ) : types.length === 0 ? (
                <tr><td colSpan={2} className="py-10 text-center text-sm text-gray-400">No visit types yet.</td></tr>
              ) : (
                types.map((t) => <VisitTypeRow key={t.id} type={t} />)
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">New visit type</h3>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            placeholder="e.g. Delivery" value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit" disabled={create.isPending}
            className="bg-indigo-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {create.isPending ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  )
}

function VisitTypeRow({ type }: { type: VisitTypeAdmin }) {
  const update = useUpdateVisitType(type.id)
  const remove = useDeleteVisitType()
  const addToast = useUiStore((s) => s.addToast)
  const [name, setName] = useState(type.name)

  const handleSave = () => {
    if (!name.trim() || name === type.name) return
    update.mutate({ name: name.trim() }, {
      onSuccess: () => addToast('Visit type updated', 'success'),
      onError: (err) => addToast(err.message ?? 'Failed to update visit type', 'error'),
    })
  }

  const handleDelete = () => {
    if (!window.confirm(`Delete "${type.name}"? This can't be undone.`)) return
    remove.mutate(type.id, {
      onSuccess: () => addToast('Visit type deleted', 'success'),
      onError: (err) => addToast(err.message ?? 'Failed to delete — it may still be in use', 'error'),
    })
  }

  return (
    <tr>
      <td className="px-4 py-3">
        <input
          value={name} onChange={(e) => setName(e.target.value)} onBlur={handleSave}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={handleDelete} disabled={remove.isPending}
          aria-label={`Delete ${type.name}`}
          className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  )
}

const emptyStaffForm: StaffCreatePayload = { name: '', email: '', password: '', role_ids: [] }

function EmployeesPanel() {
  const { data: staff = [], isLoading } = useStaffAdmin()
  const { data: roles = [] } = useRoles()
  const create = useCreateStaff()
  const addToast = useUiStore((s) => s.addToast)
  const [form, setForm] = useState<StaffCreatePayload>(emptyStaffForm)

  const toggleFormRole = (id: number) =>
    setForm((f) => ({ ...f, role_ids: f.role_ids.includes(id) ? f.role_ids.filter((r) => r !== id) : [...f.role_ids, id] }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || form.password.length < 8 || form.role_ids.length === 0) {
      addToast('Fill in name, email, an 8+ character password, and at least one role', 'error')
      return
    }
    create.mutate(form, {
      onSuccess: () => { addToast('Employee added', 'success'); setForm(emptyStaffForm) },
      onError: () => addToast('Failed to add employee — the email may already be in use', 'error'),
    })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Employees</h2>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-900">
        This is every staff login — the same names that appear in every "Owner" and "Assign to" picker across dealers, requests, visits, and escalation rules. Deactivating someone here removes them from those pickers immediately.
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Roles</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="py-10"><div className="flex justify-center"><Spinner size="md" /></div></td></tr>
              ) : staff.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-sm text-gray-400">No employees yet.</td></tr>
              ) : (
                staff.map((s) => <StaffRow key={s.id} employee={s} roles={roles} />)
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">New employee</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Full name" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="email" placeholder="Email" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <input
            type="password" placeholder="Temporary password (8+ characters)" value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Roles</p>
            <div className="flex flex-wrap gap-1.5">
              {roles.map((r) => (
                <button
                  key={r.id} type="button" onClick={() => toggleFormRole(r.id)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
                    form.role_ids.includes(r.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:border-indigo-400'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit" disabled={create.isPending}
            className="w-full bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {create.isPending ? 'Adding…' : 'Add Employee'}
          </button>
        </form>
      </div>
    </div>
  )
}

function StaffRow({ employee, roles }: { employee: StaffAdmin; roles: RoleAdmin[] }) {
  const update = useUpdateStaff(employee.id)
  const addToast = useUiStore((s) => s.addToast)
  const [name, setName] = useState(employee.name)
  const [email, setEmail] = useState(employee.email)
  const [roleIds, setRoleIds] = useState(employee.roles.map((r) => r.id))

  const sortedEqual = (a: number[], b: number[]) => a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i])
  const dirty = name !== employee.name || email !== employee.email || !sortedEqual(roleIds, employee.roles.map((r) => r.id))

  const toggleRole = (id: number) => setRoleIds((ids) => (ids.includes(id) ? ids.filter((r) => r !== id) : [...ids, id]))

  const handleSave = () => {
    update.mutate({ name, email, role_ids: roleIds }, {
      onSuccess: () => addToast('Employee updated', 'success'),
      onError: () => addToast('Failed to update employee', 'error'),
    })
  }

  const toggleActive = () => {
    update.mutate({ is_active: !employee.is_active }, {
      onSuccess: () => addToast(employee.is_active ? 'Employee deactivated' : 'Employee activated', 'success'),
      onError: () => addToast('Failed to update employee', 'error'),
    })
  }

  return (
    <tr>
      <td className="px-4 py-3">
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </td>
      <td className="px-4 py-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {roles.map((r) => (
            <button
              key={r.id} type="button" onClick={() => toggleRole(r.id)}
              className={`text-xs px-2 py-0.5 rounded-full font-medium border transition-colors ${
                roleIds.includes(r.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-500 hover:border-indigo-400'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={toggleActive} disabled={update.isPending}
          className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
            employee.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {employee.is_active ? 'Active' : 'Inactive'}
        </button>
      </td>
      <td className="px-4 py-3">
        {dirty && (
          <button
            onClick={handleSave} disabled={update.isPending}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {update.isPending ? 'Saving…' : 'Save'}
          </button>
        )}
      </td>
    </tr>
  )
}

const ACTION_TYPE_LABELS: Record<EscalationActionType, string> = {
  notify_owner: 'Notify owner',
  notify_role: 'Notify role',
  reassign: 'Reassign to',
}

const emptyRuleForm: EscalationRulePayload = {
  name: '', trigger_priority: null, trigger_request_type_id: null, trigger_hours_overdue: 0,
  action_type: 'notify_owner', action_target_staff_id: null, action_target_role: null,
  escalation_message: '{ref_no} for {dealer_name} is {hours_overdue}h overdue.',
}

function EscalationRulesPanel() {
  const { data: bs } = useBootstrap()
  const { data: rules = [], isLoading } = useEscalationRules()
  const { data: roles = [] } = useRoles()
  const create = useCreateEscalationRule()
  const runNow = useRunEscalationRulesNow()
  const addToast = useUiStore((s) => s.addToast)
  const [form, setForm] = useState<EscalationRulePayload>(emptyRuleForm)

  const typeName = (id: number | null) => (id ? bs?.types?.find((t) => Number(t.id) === id)?.name ?? `#${id}` : 'Any type')
  const staffName = (id: number | null) => (id ? bs?.staff?.find((s) => Number(s.id) === id)?.name ?? `#${id}` : '—')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.escalation_message.trim()) return
    if (form.action_type === 'reassign' && !form.action_target_staff_id) {
      addToast('Pick a staff member to reassign to', 'error'); return
    }
    if (form.action_type === 'notify_role' && !form.action_target_role) {
      addToast('Pick a role to notify', 'error'); return
    }
    create.mutate(form, {
      onSuccess: () => { addToast('Escalation rule added', 'success'); setForm(emptyRuleForm) },
      onError: () => addToast('Failed to add escalation rule', 'error'),
    })
  }

  const handleRunNow = () => {
    runNow.mutate(undefined, {
      onSuccess: (result) => addToast(`Checked ${result.requests_checked} requests — ${result.rules_fired} rule${result.rules_fired === 1 ? '' : 's'} fired`, 'success'),
      onError: () => addToast('Escalation run failed', 'error'),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Escalation rules</h2>
        <button
          onClick={handleRunNow} disabled={runNow.isPending}
          className="flex items-center gap-1.5 text-sm text-indigo-600 border border-indigo-200 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" /> {runNow.isPending ? 'Running…' : 'Run now'}
        </button>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-900">
        Runs automatically every few minutes against every open request. "Run now" fires the same check immediately — useful for testing a new rule without waiting.
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-2.5">Rule</th>
                <th className="px-4 py-2.5">Trigger</th>
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={4} className="py-10"><div className="flex justify-center"><Spinner size="md" /></div></td></tr>
              ) : rules.length === 0 ? (
                <tr><td colSpan={4} className="py-10 text-center text-sm text-gray-400">No escalation rules yet.</td></tr>
              ) : (
                rules.map((r) => (
                  <EscalationRuleRow key={r.id} rule={r} typeName={typeName} staffName={staffName} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">New rule</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            placeholder="Rule name (e.g. P1 breach escalation)" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <select
              value={form.trigger_priority ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, trigger_priority: e.target.value ? Number(e.target.value) : null }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Any priority</option>
              <option value={1}>P1</option>
              <option value={2}>P2</option>
              <option value={3}>P3</option>
              <option value={4}>P4</option>
            </select>
            <select
              value={form.trigger_request_type_id ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, trigger_request_type_id: e.target.value ? Number(e.target.value) : null }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Any type</option>
              {bs?.types?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <label className="flex items-center gap-2">
              <input
                type="number" min={0} value={form.trigger_hours_overdue}
                onChange={(e) => setForm((f) => ({ ...f, trigger_hours_overdue: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs text-gray-500 shrink-0">hrs overdue</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.action_type}
              onChange={(e) => setForm((f) => ({ ...f, action_type: e.target.value as EscalationActionType, action_target_staff_id: null, action_target_role: null }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(ACTION_TYPE_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </select>

            {form.action_type === 'reassign' && (
              <select
                value={form.action_target_staff_id ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, action_target_staff_id: e.target.value ? Number(e.target.value) : null }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select staff…</option>
                {bs?.staff?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            {form.action_type === 'notify_role' && (
              <select
                value={form.action_target_role ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, action_target_role: e.target.value || null }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select role…</option>
                {roles.map((r) => <option key={r.id} value={r.key}>{r.name}</option>)}
              </select>
            )}
          </div>

          <div>
            <textarea
              rows={2} placeholder="Escalation message" value={form.escalation_message}
              onChange={(e) => setForm((f) => ({ ...f, escalation_message: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">Placeholders: <span className="font-mono">{'{ref_no} {dealer_name} {hours_overdue} {title}'}</span></p>
          </div>

          <button
            type="submit" disabled={create.isPending}
            className="w-full bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {create.isPending ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  )
}

function EscalationRuleRow({
  rule, typeName, staffName,
}: {
  rule: import('../../api/setup').EscalationRuleAdmin
  typeName: (id: number | null) => string
  staffName: (id: number | null) => string
}) {
  const update = useUpdateEscalationRule(rule.id)
  const addToast = useUiStore((s) => s.addToast)

  const priorityLabel = rule.trigger_priority ? `P${rule.trigger_priority}` : 'Any priority'
  const hoursLabel = rule.trigger_hours_overdue === 0 ? 'the moment it breaches' : `${rule.trigger_hours_overdue}h after due`
  const actionLabel = rule.action_type === 'reassign'
    ? `Reassign to ${staffName(rule.action_target_staff_id)}`
    : rule.action_type === 'notify_role'
      ? `Notify role "${rule.action_target_role}"`
      : 'Notify owner'

  const toggleActive = () => {
    update.mutate({ is_active: !rule.is_active }, {
      onSuccess: () => addToast(rule.is_active ? 'Rule deactivated' : 'Rule activated', 'success'),
      onError: () => addToast('Failed to update rule', 'error'),
    })
  }

  return (
    <tr>
      <td className="px-4 py-3">
        <p className="font-medium text-gray-800">{rule.name}</p>
      </td>
      <td className="px-4 py-3 text-gray-600 text-xs">
        {priorityLabel} · {typeName(rule.trigger_request_type_id)} · {hoursLabel}
      </td>
      <td className="px-4 py-3 text-gray-600 text-xs">{actionLabel}</td>
      <td className="px-4 py-3">
        <button
          onClick={toggleActive} disabled={update.isPending}
          className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
            rule.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {rule.is_active ? 'Active' : 'Inactive'}
        </button>
      </td>
    </tr>
  )
}

function ReadOnlyList({ title, rows }: { title: string; rows: { id: number | string; primary: string; secondary?: string }[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {rows.length === 0 && <p className="px-4 py-8 text-center text-sm text-gray-400">Nothing here.</p>}
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-800">{r.primary}</span>
            {r.secondary && <span className="text-xs text-gray-400">{r.secondary}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function ComingSoonPanel({ title }: { title: string }) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
        <p className="text-sm text-gray-500">Not built yet.</p>
        <p className="text-xs text-gray-400 mt-1">This section doesn't have a backing model in Dealer Desk yet — ask to have it added when you need it.</p>
      </div>
    </div>
  )
}

export default function SetupPage() {
  const { data: bs, isLoading } = useBootstrap()
  const [tab, setTab] = useState<Tab>('request_types')

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Everything the desk runs on is data. Change it here; nothing needs deploying.</p>
      </div>

      <div className="flex gap-5 items-start">
        {/* Sub-nav */}
        <div className="w-56 shrink-0 space-y-4">
          {GROUPS.map((group) => (
            <div key={group}>
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{group}</p>
              <div className="space-y-0.5">
                {TABS.filter((t) => t.group === group).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      tab === key ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Panel */}
        <div className="flex-1 min-w-0">
          {tab === 'request_types' && <RequestTypesPanel />}
          {tab === 'tiers' && <TiersPanel />}
          {tab === 'territories' && (
            <ReadOnlyList
              title="Territories & routing"
              rows={(bs?.territories ?? []).map((t) => ({ id: t.id, primary: t.name }))}
            />
          )}
          {tab === 'visit_types' && <VisitTypesPanel />}
          {tab === 'priority_rules' && <ComingSoonPanel title="Priority rules" />}
          {tab === 'escalation_rules' && <EscalationRulesPanel />}
          {tab === 'employees' && <EmployeesPanel />}
          {tab === 'configuration' && (
            <ReadOnlyList
              title="Configuration"
              rows={bs ? Object.entries(bs.config).map(([k, v]) => ({ id: k, primary: k.replace(/_/g, ' '), secondary: String(v) })) : []}
            />
          )}
          {tab === 'import_dealers' && <ComingSoonPanel title="Import dealers" />}
        </div>
      </div>
    </div>
  )
}
