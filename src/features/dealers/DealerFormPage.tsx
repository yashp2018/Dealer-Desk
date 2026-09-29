import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Upload } from 'lucide-react'
import { useBootstrap } from '../../hooks/useBootstrap'
import { useCreateDealer, useImportCandidates, useImportDealers } from '../../hooks/useDealers'
import { useAuth } from '../../hooks/useAuth'
import Breadcrumb from '../../layouts/Breadcrumb'
import { useUiStore } from '../../stores/uiStore'
import type { CreateDealerPayload } from '../../api/types'

type FormValues = {
  name: string
  display_name?: string
  tier_id: string
  territory_id: string
  city?: string
  state_normalized?: string
  phone_primary?: string
  whatsapp_phone?: string
  owner_staff_id?: string
}

const DATALIST_ID = 'dealer-import-candidates'

export default function DealerFormPage() {
  const nav = useNavigate()
  const { data: bs } = useBootstrap()
  const create = useCreateDealer()
  const importDealers = useImportDealers()
  const { data: candidates = [] } = useImportCandidates()
  const { isAdmin } = useAuth()
  const addToast = useUiStore((s) => s.addToast)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [matchedCandidateId, setMatchedCandidateId] = useState<string | undefined>()
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>()

  const candidateByName = useMemo(
    () => new Map(candidates.map((c) => [c.name.trim().toLowerCase(), c])),
    [candidates],
  )

  const handleNameChange = (value: string) => {
    const match = candidateByName.get(value.trim().toLowerCase())
    if (match) {
      setMatchedCandidateId(match.id)
      if (match.city) setValue('city', match.city)
      if (match.phone_primary) setValue('phone_primary', match.phone_primary)
      if (match.state_normalized) setValue('state_normalized', match.state_normalized)
    } else {
      setMatchedCandidateId(undefined)
    }
  }

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    importDealers.mutate(file, {
      onSuccess: (r) => addToast(`Imported ${r.imported} dealer name${r.imported === 1 ? '' : 's'}${r.skipped_duplicate ? ` (${r.skipped_duplicate} already known, skipped)` : ''}`, 'success'),
      onError: (e) => addToast(e.message ?? 'Import failed', 'error'),
    })
  }

  const onSubmit = (values: FormValues) => {
    const payload: CreateDealerPayload = {
      name: values.name,
      display_name: values.display_name || undefined,
      tier_id: values.tier_id,
      territory_id: values.territory_id,
      city: values.city || undefined,
      state_normalized: values.state_normalized || undefined,
      phone_primary: values.phone_primary || undefined,
      whatsapp_phone: values.whatsapp_phone || undefined,
      // Only admins can pick a different owner — regular staff always end up
      // owning what they create (enforced server-side too, not just hidden here).
      owner_staff_id: isAdmin ? (values.owner_staff_id || undefined) : undefined,
      import_candidate_id: matchedCandidateId,
    }
    create.mutate(payload, {
      onSuccess: (d) => { addToast('Dealer created', 'success'); nav(`/dealers/${d.id}`) },
      onError: (e) => addToast(e.message ?? 'Failed to create dealer', 'error'),
    })
  }

  return (
    <div className="max-w-xl space-y-4">
      <Breadcrumb crumbs={[{ label: 'Dealers', to: '/dealers' }, { label: 'New Dealer' }]} />
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-600">Have a list of dealer names?</p>
            <p className="text-xs text-gray-400">
              {candidates.length > 0 ? `${candidates.length} imported name${candidates.length === 1 ? '' : 's'} ready to pick below` : 'Upload a CSV to fill the dropdown below'}
            </p>
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={importDealers.isPending}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            <Upload className="h-3.5 w-3.5" />
            {importDealers.isPending ? 'Uploading…' : 'Import CSV'}
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFilePick} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dealer Name</label>
          <input
            {...register('name', { required: 'Required', onChange: (e) => handleNameChange(e.target.value) })}
            list={DATALIST_ID}
            autoComplete="off"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <datalist id={DATALIST_ID}>
            {candidates.map((c) => <option key={c.id} value={c.name} />)}
          </datalist>
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          {matchedCandidateId && <p className="text-xs text-indigo-600 mt-1">Filled from imported list</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name (optional)</label>
          <input {...register('display_name')} placeholder="Defaults to Dealer Name" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
            <select {...register('tier_id', { required: 'Required' })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select tier…</option>
              {bs?.tiers?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {errors.tier_id && <p className="text-xs text-red-500 mt-1">{errors.tier_id.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Territory</label>
            <select {...register('territory_id', { required: 'Required' })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select territory…</option>
              {bs?.territories?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {errors.territory_id && <p className="text-xs text-red-500 mt-1">{errors.territory_id.message}</p>}
          </div>
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input {...register('phone_primary')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input {...register('whatsapp_phone')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        {isAdmin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner (optional)</label>
            <select {...register('owner_staff_id')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Assign to me</option>
              {bs?.staff?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        <button type="submit" disabled={create.isPending} className="w-full bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {create.isPending ? 'Creating…' : 'Create Dealer'}
        </button>
      </form>
    </div>
  )
}
