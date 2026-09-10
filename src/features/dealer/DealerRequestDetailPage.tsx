import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getMyRequest } from '../../api/requests'
import type { DealerRequest } from '../../api/types'
import StatusBadge from '../../components/badges/StatusBadge'
import PriorityBadge from '../../components/badges/PriorityBadge'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import { formatDate } from '../../lib/formatDate'
import { ArrowLeft } from 'lucide-react'

export default function DealerRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: request, isLoading, isError } = useQuery<DealerRequest>({
    queryKey: ['dealer-request', id],
    queryFn: () => getMyRequest(id!),
    enabled: !!id,
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError || !request) return <Alert type="danger" message="Request not found or access denied." />

  return (
    <div className="max-w-2xl space-y-4">
      <button
        onClick={() => navigate('/dealer/requests')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to My Requests
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-slate-400">{request.ref_no}</p>
            <h2 className="text-lg font-bold text-slate-800 mt-0.5">{request.title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{request.type_name}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>
        </div>

        {request.description && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{request.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-400">Submitted</p>
            <p className="text-sm text-slate-700 mt-0.5">{formatDate(request.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Last Updated</p>
            <p className="text-sm text-slate-700 mt-0.5">{formatDate(request.updated_at)}</p>
          </div>
          {request.due_at && (
            <div>
              <p className="text-xs text-slate-400">Expected by</p>
              <p className="text-sm text-slate-700 mt-0.5">{formatDate(request.due_at)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
