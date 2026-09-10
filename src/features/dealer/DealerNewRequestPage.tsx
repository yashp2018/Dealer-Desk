import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBootstrap } from '../../hooks/useBootstrap'
import { useMutation } from '@tanstack/react-query'
import { createDealerRequest } from '../../api/requests'
import type { DealerCreateRequestPayload, DealerRequest } from '../../api/types'
import Spinner from '../../components/loaders/Spinner'
import { CheckCircle, ArrowRight, Plus } from 'lucide-react'
import { formatDate } from '../../lib/formatDate'

type Step = 'form' | 'success'

export default function DealerNewRequestPage() {
  const navigate = useNavigate()
  const { data: bs } = useBootstrap()
  const [step, setStep] = useState<Step>('form')
  const [typeId, setTypeId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState<DealerRequest | null>(null)

  const create = useMutation({
    mutationFn: (payload: DealerCreateRequestPayload) => createDealerRequest(payload),
    onSuccess: (result) => {
      setSubmitted(result)
      setStep('success')
    },
  })

  const selectedType = bs?.types?.find((t) => t.id === typeId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!typeId) return
    create.mutate({ type_id: typeId, title: title || undefined, description: description || undefined })
  }

  if (step === 'success' && submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Request Submitted Successfully</h2>
          <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Reference</span>
              <span className="font-mono font-semibold text-slate-800">{submitted.ref_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Type</span>
              <span className="text-slate-700">{submitted.type_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Submitted</span>
              <span className="text-slate-700">{formatDate(submitted.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className="capitalize text-indigo-600 font-medium">{submitted.status}</span>
            </div>
            {submitted.due_at && (
              <div className="flex justify-between">
                <span className="text-slate-500">Expected by</span>
                <span className="text-slate-700">{formatDate(submitted.due_at)}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400">Our team will review your request and update you on progress.</p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate('/dealer/requests')}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700"
            >
              View My Requests <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setStep('form'); setTypeId(null); setTitle(''); setDescription(''); setSubmitted(null) }}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-200"
            >
              <Plus className="h-4 w-4" /> New Request
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-800">New Request</h2>
        <p className="text-sm text-slate-500 mt-0.5">Submit a new request to our team</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        {/* Type picker */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Request Type *</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {bs?.types?.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeId(t.id)}
                className={`border rounded-xl p-3 text-left text-sm transition-colors ${
                  typeId === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-medium text-slate-800">{t.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">SLA {t.sla_hours}h</p>
              </button>
            ))}
          </div>
        </div>

        {selectedType && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={selectedType.name}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe your request…"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            {create.isError && (
              <p className="text-sm text-red-600">Failed to submit request. Please try again.</p>
            )}
            <button
              type="submit"
              disabled={create.isPending}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {create.isPending ? <><Spinner size="sm" /> Submitting…</> : 'Submit Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
