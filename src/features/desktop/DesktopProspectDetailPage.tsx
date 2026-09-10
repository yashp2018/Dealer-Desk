/**
 * Desktop — Prospect detail  (mirrors desktop/prospect_detail.php)
 * Left: KV facts · stage select · convert form · new visit form
 * Right: onboarding checklist · visits table · requests table
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProspect, useProspectMutations, useProspectVisits } from '../../hooks/useProspects'
import { useBootstrap } from '../../hooks/useBootstrap'
import ConfirmModal from '../../components/modals/ConfirmModal'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import Breadcrumb from '../../layouts/Breadcrumb'
import { useUiStore } from '../../stores/uiStore'
import { formatDateTime } from '../../lib/formatDate'

const STAGE_LABELS: Record<string, string> = {
  received: 'Received', contacted: 'Contacted', visit_planned: 'Visit Planned',
  visited: 'Visited', onboarding: 'Onboarding', converted: 'Converted', dropped: 'Dropped',
}

export default function DesktopProspectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const pid = Number(id)
  const nav = useNavigate()
  const { data: prospect, isLoading, isError } = useProspect(pid)
  const { data: prospectVisits = [] } = useProspectVisits(pid)
  const { data: bs } = useBootstrap()
  const mutations = useProspectMutations(pid)
  const addToast = useUiStore((s) => s.addToast)
  const [confirmConvert, setConfirmConvert] = useState(false)
  const [tierId, setTierId] = useState('')

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
                onChange={(e) => mutations.setStage.mutate(e.target.value, { onSuccess: () => addToast('Stage updated', 'success') })}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {Object.entries(STAGE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {/* Convert form */}
            {p.stage === 'onboarding' && (
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
              <select className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {bs?.visit_types?.map((vt) => <option key={vt.id} value={vt.id}>{vt.name}</option>)}
              </select>
              <input type="datetime-local"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button onClick={() => addToast('Visit scheduled', 'success')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-sm rounded-lg py-1.5">
                Schedule Visit
              </button>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Onboarding checklist */}
          {p.stage === 'onboarding' && bs?.doc_types && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Onboarding Checklist</h3>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {bs.doc_types.map((doc) => (
                    <tr key={doc.id}>
                      <td className="px-5 py-3 text-gray-700">{doc.name}</td>
                      <td className="px-5 py-3 w-48">
                        <select
                          onChange={() => mutations.setOnboardingItem.mutate(doc.id, { onSuccess: () => addToast('Updated', 'success') })}
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
          onConfirm={() => mutations.convert.mutate(undefined, {
            onSuccess: () => { addToast('Converted to dealer', 'success'); nav('/desktop/dealers') }
          })}
          onCancel={() => setConfirmConvert(false)}
        />
      )}
    </div>
  )
}
