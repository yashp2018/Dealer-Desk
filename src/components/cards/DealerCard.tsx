import { useNavigate } from 'react-router-dom'

interface Dealer { id: number; code: string; name: string; tier_name: string; city: string; open_requests: number; overdue_requests: number; health: string }

const healthColor: Record<string, string> = { good: 'text-green-600', warning: 'text-amber-600', critical: 'text-red-600' }

export default function DealerCard({ dealer }: { dealer: Dealer }) {
  const nav = useNavigate()
  return (
    <div onClick={() => nav(`/dealers/${dealer.id}`)} className="border rounded-xl p-4 hover:shadow-sm cursor-pointer transition-shadow bg-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-mono">{dealer.code}</span>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{dealer.tier_name}</span>
      </div>
      <p className="font-semibold text-gray-800 text-sm">{dealer.name}</p>
      <p className="text-xs text-gray-400 mt-0.5">{dealer.city}</p>
      <div className="flex gap-3 mt-3 text-xs">
        <span className="text-gray-600">{dealer.open_requests} open</span>
        {dealer.overdue_requests > 0 && <span className="text-red-600 font-medium">{dealer.overdue_requests} overdue</span>}
        <span className={`ml-auto font-medium ${healthColor[dealer.health] ?? 'text-gray-500'}`}>{dealer.health}</span>
      </div>
    </div>
  )
}
