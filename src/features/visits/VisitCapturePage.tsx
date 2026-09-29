import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useVisit, useVisitMutations } from '../../hooks/useVisits'
import Breadcrumb from '../../layouts/Breadcrumb'
import SectionCard from '../../components/cards/SectionCard'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import { useUiStore } from '../../stores/uiStore'
import { todayForDateInput } from '../../lib/formatDate'
import type { VisitOutcomePayload } from '../../api/types'

// Only outcomes the backend VisitOutcomePayload supports
const OUTCOMES = [
  { value: 'successful',  label: 'Successful' },
  { value: 'partial',     label: 'Partial — follow-up required' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'no_show',     label: 'No Show — dealer unavailable' },
]

// next_step values — free-text on the backend, these are UI suggestions only
const NEXT_STEPS = [
  { value: '',              label: 'None' },
  { value: 'follow_up',    label: 'Follow-up call' },
  { value: 'next_visit',   label: 'Schedule next visit' },
  { value: 'new_request',  label: 'Raise new request' },
  { value: 'escalate',     label: 'Escalate' },
]

interface FormValues {
  outcome: string
  outcome_note: string
  next_step: string
  next_at: string
}

export default function VisitCapturePage() {
  const { id } = useParams<{ id: string }>()
  const vid = Number(id)
  const nav = useNavigate()
  const addToast = useUiStore((s) => s.addToast)

  const { data: visit, isLoading, isError } = useVisit(vid)
  const mutations = useVisitMutations(vid)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: { outcome: '', outcome_note: '', next_step: '', next_at: '' },
  })

  const selectedOutcome = watch('outcome')

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError || !visit) return <Alert type="danger" message="Visit not found." />

  // Guard: only in_progress visits can record outcome
  if (visit.status !== 'in_progress') {
    return (
      <div className="max-w-xl space-y-5">
        <Breadcrumb crumbs={[{ label: 'Visits', to: '/visits' }, { label: visit.ref, to: `/visits/${vid}` }, { label: 'Outcome' }]} />
        <Alert type="warning" message={`This visit is already "${visit.status}" and cannot be updated.`} />
        <button onClick={() => nav(`/visits/${vid}`)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          ← Back to visit
        </button>
      </div>
    )
  }

  const onSubmit = (data: FormValues) => {
    if (!data.outcome) return

    const payload: VisitOutcomePayload = {
      outcome: data.outcome,
      outcome_note: data.outcome_note || undefined,
      next_step: data.next_step || undefined,
      next_at: data.next_at || undefined,
    }

    mutations.outcome.mutate(payload, {
      onSuccess: () => {
        addToast('Visit completed successfully', 'success')
        nav(`/visits/${vid}`)
      },
      onError: (e) => addToast(e.message ?? 'Failed to record outcome', 'error'),
    })
  }

  return (
    <div className="max-w-xl space-y-5">
      <Breadcrumb crumbs={[{ label: 'Visits', to: '/visits' }, { label: visit.ref, to: `/visits/${vid}` }, { label: 'Finish Visit' }]} />

      <SectionCard title="Finish Visit">
        <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{visit.dealer_name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{visit.visit_type}{visit.title ? ` · ${visit.title}` : ''}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Outcome — required */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Outcome <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {OUTCOMES.map(({ value, label }) => (
                <label key={value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedOutcome === value ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                  <input type="radio" value={value} {...register('outcome', { required: 'Please select an outcome' })} className="accent-indigo-600" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                </label>
              ))}
            </div>
            {errors.outcome && <p className="text-xs text-red-500 mt-1">{errors.outcome.message}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Summary / Notes</label>
            <textarea
              {...register('outcome_note')}
              rows={4}
              placeholder="What was discussed? Any issues or decisions?"
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Next Step */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Next Action</label>
            <select
              {...register('next_step')}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {NEXT_STEPS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {/*
              BACKEND GAP — Task / Follow-up creation
              When a Tasks API is available, selecting "follow_up" or "new_request"
              here should trigger POST /tasks or POST /requests with pre-filled dealer_id.
              For now, next_step is stored as a string on the Visit record only.
            */}
          </div>

          {/* Next Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Next Visit / Follow-up Date</label>
            <input
              type="date"
              {...register('next_at')}
              min={todayForDateInput()}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/*
            BACKEND GAP — Attachments / Photos
            POST /visits/:id/attachments is not available.
            When it is, add a file/camera input here before the submit button.
          */}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => nav(`/visits/${vid}`)}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.outcome.isPending}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {mutations.outcome.isPending ? 'Saving…' : 'Complete Visit'}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  )
}
