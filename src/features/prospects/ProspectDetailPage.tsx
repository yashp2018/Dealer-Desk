import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProspect, useProspectMutations } from '../../hooks/useProspects'
import { useBootstrap } from '../../hooks/useBootstrap'
import ConfirmModal from '../../components/modals/ConfirmModal'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import Breadcrumb from '../../layouts/Breadcrumb'
import { useUiStore } from '../../stores/uiStore'

const STAGES = ['contacted', 'negotiation', 'onboarding', 'converted']

export default function ProspectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const pid = Number(id)
  const nav = useNavigate()
  const { data: prospect, isLoading, isError } = useProspect(pid)
  const { data: bs } = useBootstrap()
  const mutations = useProspectMutations(pid)
  const addToast = useUiStore((s) => s.addToast)
  const [confirmConvert, setConfirmConvert] = useState(false)

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError || !prospect) return <Alert type="danger" message="Prospect not found." />

  return (
    <div className="space-y-5 max-w-3xl">
      <Breadcrumb crumbs={[{ label: 'Prospects', to: '/prospects' }, { label: prospect.company_name }]} />
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xl font-bold text-gray-800">{prospect.company_name}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{prospect.contact_name} · {prospect.email} · {prospect.city}</p>
        {/* Stage pipeline */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {STAGES.map((s) => (
            <button key={s} onClick={() => mutations.setStage.mutate(s, { onSuccess: () => addToast('Stage updated', 'success') })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${prospect.stage === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:border-indigo-400'}`}>
              {s}
            </button>
          ))}
        </div>
        <button onClick={() => setConfirmConvert(true)} className="mt-4 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
          Convert to Dealer
        </button>
      </div>
      {/* Onboarding checklist */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Onboarding Checklist</h3>
        <div className="space-y-2">
          {bs?.doc_types?.map((doc) => (
            <label key={doc.id} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" onChange={() => mutations.setOnboardingItem.mutate(doc.id, { onSuccess: () => addToast('Item updated', 'success') })}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
              <span className="text-sm text-gray-700">{doc.name}</span>
            </label>
          ))}
        </div>
      </div>
      {confirmConvert && (
        <ConfirmModal
          title="Convert to Dealer"
          message={`Convert ${prospect.company_name} to a dealer? This cannot be undone.`}
          confirmLabel="Convert"
          loading={mutations.convert.isPending}
          onConfirm={() => mutations.convert.mutate(undefined, { onSuccess: () => { addToast('Converted to dealer', 'success'); nav('/dealers') } })}
          onCancel={() => setConfirmConvert(false)}
        />
      )}
    </div>
  )
}
