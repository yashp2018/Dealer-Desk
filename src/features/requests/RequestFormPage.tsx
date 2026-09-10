import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useBootstrap } from '../../hooks/useBootstrap'
import { useCreateRequest } from '../../hooks/useRequests'
import RequestDynamicFields from './RequestDynamicFields'
import Breadcrumb from '../../layouts/Breadcrumb'
import { useUiStore } from '../../stores/uiStore'
import { useAuth } from '../../hooks/useAuth'
import type { CreateRequestPayload } from '../../api/types'

export default function RequestFormPage() {
  const nav = useNavigate()
  const { data: bs } = useBootstrap()
  const create = useCreateRequest()
  const addToast = useUiStore((s) => s.addToast)
  const { isDealer } = useAuth()
  const [typeId, setTypeId] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors } } = useForm()

  // Dealers should not access this page — they use /dealer/requests/new
  if (isDealer) {
    nav('/dealer/requests/new', { replace: true })
    return null
  }

  const selectedType = bs?.types?.find((t) => t.id === typeId)

  const onSubmit = (values: Record<string, unknown>) => {
    if (typeId === null) return
    const payload: CreateRequestPayload = {
      dealer_id: String(values.dealer_id),
      type_id: typeId,
      title: typeof values.title === 'string' ? values.title : undefined,
      description: typeof values.description === 'string' ? values.description : undefined,
      fields: values.fields as Record<string, string> | undefined,
    }
    create.mutate(payload, {
      onSuccess: (r) => { addToast('Request created', 'success'); nav(`/requests/${(r as { id: string }).id}`) },
      onError: () => addToast('Failed to create request', 'error'),
    })
  }

  return (
    <div className="max-w-2xl space-y-5">
      <Breadcrumb crumbs={[{ label: 'Requests', to: '/requests' }, { label: 'New Request' }]} />
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-800">New Request</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Request Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {bs?.types?.map((t) => (
              <button key={t.id} type="button" onClick={() => setTypeId(t.id)}
                className={`border rounded-xl p-3 text-left text-sm transition-colors ${typeId === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <p className="font-medium text-gray-800">{t.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">SLA {t.sla_hours}h</p>
              </button>
            ))}
          </div>
        </div>
        {selectedType && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dealer</label>
              <select {...register('dealer_id', { required: 'Required' })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select dealer…</option>
                {bs?.dealers?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {errors.dealer_id && <p className="text-xs text-red-500 mt-1">{String(errors.dealer_id.message)}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input {...register('title', { required: 'Required' })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {errors.title && <p className="text-xs text-red-500 mt-1">{String(errors.title.message)}</p>}
            </div>
            <RequestDynamicFields fields={selectedType.fields} mode="edit" register={(key) => register(key, { required: selectedType.fields.find((f) => f.key === key)?.is_required ? 'Required' : false })} errors={errors as Record<string, { message?: string }>} />
            <button type="submit" disabled={create.isPending} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {create.isPending ? 'Creating…' : 'Create Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
