/**
 * Desktop — Prospect detail  (mirrors desktop/prospect_detail.php)
 * Left: KV facts · stage select · convert form · new visit form
 * Right: onboarding checklist · visits table · requests table
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProspect, useProspectMutations, useProspectVisits, useProspectChecklist } from '../../hooks/useProspects'
import { useCreateVisit } from '../../hooks/useVisits'
import { useBootstrap } from '../../hooks/useBootstrap'
import ConfirmModal from '../../components/modals/ConfirmModal'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import Breadcrumb from '../../layouts/Breadcrumb'
import { useUiStore } from '../../stores/uiStore'
import { formatDateTime, nowForDatetimeLocal } from '../../lib/formatDate'
import { canSetProspectStage } from '../../lib/prospectStages'

const STAGE_LABELS: Record<string, string> = {
  new: 'New', contacted: 'Contacted', qualified: 'Qualified', visit_planned: 'Visit Planned',
  visit_completed: 'Visit Completed', onboarding: 'Onboarding', approved: 'Approved',
  converted: 'Converted', dropped: 'Dropped',
}

export default function DesktopProspectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const pid = Number(id)
  const nav = useNavigate()
  const { data: prospect, isLoading, isError } = useProspect(pid)
  const { data: prospectVisits = [] } = useProspectVisits(pid)
  const { data: checklist = [] } = useProspectChecklist(pid)
  const { data: bs } = useBootstrap()
  const mutations = useProspectMutations(pid)
  const createVisit = useCreateVisit()
  const addToast = useUiStore((s) => s.addToast)
  const [confirmConvert, setConfirmConvert] = useState(false)
  const [tierId, setTierId] = useState('')
  const [visitTypeId, setVisitTypeId] = useState('')
  const [visitAt, setVisitAt] = useState('')

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError || !prospect) return <Alert type="danger" message="Prospect not found." />

  const p = prospect

  return (
    <div className="space-y-4 max-w-6xl">
      <Breadcrumb crumbs={[{ label: 'Pipeline', to: '/desktop/prospects' }, { label: p.company_name }]} />

      {/* Page header */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex items-center gap-3">
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Prospect</span>
        <span className="text-base font-bold text-gray-800">{p.company_name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Left column ── */}
        <div className="space-y-4">

          {/* KV facts */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Prospect</h3>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {[
                  ['Contact', p.contact_name],
                  ['Phone', p.phone],
                  ['City', [p.city, p.state_normalized].filter(Boolean).join(', ')],
                  ['Owner', bs?.staff?.find((s) => s.id === p.owner_staff_id)?.name ?? `#${p.owner_staff_id}`],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td className="py-1.5 text-xs text-gray-400 w-20">{k}</td>
                    <td className="py-1.5 text-gray-700">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Stage select */}
            <div className="mt-4">
              <label className="block text-xs text-gray-500 mb-1">Pipeline Stage</label>
              <select defaultValue={p.stage}
                onChange={(e) => mutations.setStage.mutate(e.target.value, {
                  onSuccess: () => addToast('Stage updated', 'success'),
                  onError: (err) => addToast(err.message ?? 'Failed to update stage', 'error'),
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {Object.entries(STAGE_LABELS)
                  .filter(([k]) => canSetProspectStage(p.stage, k))
                  .map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
              </select>
            </div>

            {/* Convert form */}
            {p.stage === 'approved' && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="block text-xs text-gray-500 mb-1">Tier</label>
                <select value={tierId} onChange={(e) => setTierId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {bs?.tiers?.map((t) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
                </select>
                <button onClick={() => setConfirmConvert(true)}
                  className="mt-2 w-full bg-green-600 text-white text-sm py-2 rounded-lg hover:bg-green-700">
                  Convert to Dealer
                </button>
              </div>
            )}
          </div>

          {/* New visit form */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">New Visit</h3>
            <div className="space-y-2">
              <select value={visitTypeId} onChange={(e) => setVisitTypeId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select visit type…</option>
                {bs?.visit_types?.map((vt) => <option key={vt.id} value={vt.id}>{vt.name}</option>)}
              </select>
              <input type="datetime-local" value={visitAt} min={nowForDatetimeLocal()} onChange={(e) => setVisitAt(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button
                onClick={() => {
                  if (!visitTypeId || !visitAt) { addToast('Pick a visit type and date', 'error'); return }
                  if (new Date(visitAt) < new Date()) { addToast('Visit time cannot be in the past', 'error'); return }
                  createVisit.mutate(
                    { prospect_id: pid, visit_type_id: Number(visitTypeId), scheduled_at: new Date(visitAt).toISOString() },
                    {
                      onSuccess: () => { addToast('Visit scheduled', 'success'); setVisitTypeId(''); setVisitAt('') },
                      onError: (err) => addToast(err.message ?? 'Failed to schedule visit', 'error'),
                    },
                  )
                }}
                disabled={createVisit.isPending}
                className="w-full bg-gray-100 hover:bg-gray-200 text-sm rounded-lg py-1.5 disabled:opacity-50">
                {createVisit.isPending ? 'Scheduling…' : 'Schedule Visit'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Onboarding checklist */}
          {checklist.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Onboarding Checklist</h3>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {checklist.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-3 text-gray-700">{item.doc_name}{item.is_required && <span className="text-red-500 ml-0.5">*</span>}</td>
                      <td className="px-5 py-3 w-48">
                        <select defaultValue={item.status}
                          onChange={(e) => mutations.setOnboardingItem.mutate(
                            { item_id: Number(item.id), status: e.target.value },
                            { onSuccess: () => addToast('Updated', 'success'), onError: (err) => addToast(err.message ?? 'Failed to update item', 'error') },
                          )}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          {['pending', 'received', 'verified', 'rejected'].map((s) => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Visits */}
          {prospectVisits.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Visits</h3>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {prospectVisits.map((v) => (
                    <tr key={v.id} onClick={() => nav(`/desktop/visits/${v.id}`)} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">{v.ref_no}</td>
                      <td className="px-5 py-3 text-gray-700">{v.title}</td>
                      <td className="px-5 py-3 text-xs text-gray-400">{formatDateTime(v.scheduled_at)}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{v.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {confirmConvert && (
        <ConfirmModal
          title="Convert to Dealer"
          message={`Convert ${p.company_name} to a dealer? This cannot be undone.`}
          confirmLabel="Convert"
          loading={mutations.convert.isPending}
          onConfirm={() => mutations.convert.mutate(tierId ? Number(tierId) : undefined, {
            onSuccess: () => { addToast('Converted to dealer', 'success'); nav('/desktop/dealers') },
            onError: (e) => addToast(e.message ?? 'Failed to convert', 'error'),
          })}
          onCancel={() => setConfirmConvert(false)}
        />
      )}
    </div>
  )
}
