import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useBootstrap } from '../../hooks/useBootstrap'
import { useCreateProspect } from '../../hooks/useProspects'
import Breadcrumb from '../../layouts/Breadcrumb'
import { useUiStore } from '../../stores/uiStore'
import type { CreateProspectPayload } from '../../api/types'

type FormValues = {
  company_name: string
  contact_name?: string
  email?: string
  phone?: string
  whatsapp?: string
  city?: string
  state_normalized?: string
  owner_staff_id: string
  source?: string
}

export default function ProspectFormPage() {
  const nav = useNavigate()
  const { data: bs } = useBootstrap()
  const create = useCreateProspect()
  const addToast = useUiStore((s) => s.addToast)
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>()

  const onSubmit = (values: FormValues) => {
    const payload: CreateProspectPayload = {
      company_name: values.company_name,
      contact_name: values.contact_name || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      whatsapp: values.whatsapp || undefined,
      city: values.city || undefined,
      state_normalized: values.state_normalized || undefined,
      owner_staff_id: Number(values.owner_staff_id),
      source: values.source || undefined,
    }
    create.mutate(payload, {
      onSuccess: (p) => { addToast('Prospect created', 'success'); nav(`/prospects/${p.id}`) },
      onError: () => addToast('Failed to create prospect', 'error'),
    })
  }

  return (
    <div className="max-w-xl space-y-4">
      <Breadcrumb crumbs={[{ label: 'Prospects', to: '/prospects' }, { label: 'New Prospect' }]} />
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input {...register('company_name', { required: 'Required' })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {errors.company_name && <p className="text-xs text-red-500 mt-1">{errors.company_name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
            <input {...register('contact_name')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <input {...register('source')} placeholder="referral, website…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" {...register('email')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input {...register('phone')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
          <input {...register('whatsapp')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input {...register('city')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input {...register('state_normalized')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
          <select {...register('owner_staff_id', { required: 'Required' })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select owner…</option>
            {bs?.staff?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {errors.owner_staff_id && <p className="text-xs text-red-500 mt-1">{errors.owner_staff_id.message}</p>}
        </div>
        <button type="submit" disabled={create.isPending} className="w-full bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {create.isPending ? 'Creating…' : 'Create Prospect'}
        </button>
      </form>
    </div>
  )
}
