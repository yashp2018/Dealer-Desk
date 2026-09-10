import { useBootstrap } from '../../hooks/useBootstrap'

const toneMap: Record<string, string> = {
  new: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-blue-100 text-blue-700',
  waiting_dealer: 'bg-amber-100 text-amber-700',
  waiting_internal: 'bg-orange-100 text-orange-700',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function StatusBadge({ status }: { status: string }) {
  const { data } = useBootstrap()
  const label = (data?.statuses as Record<string, string> | undefined)?.[status] ?? status
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${toneMap[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  )
}
