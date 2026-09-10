import { useBootstrap } from '../../hooks/useBootstrap'
import Spinner from '../../components/loaders/Spinner'

export default function SetupPage() {
  const { data: bs, isLoading } = useBootstrap()
  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Request Types</h3>
        <div className="space-y-2">
          {bs?.types?.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm text-gray-800">{t.name}</span>
              <span className="text-xs text-gray-400">SLA {t.sla_hours}h · {t.fields.length} fields</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Tiers</h3>
        <div className="space-y-2">
          {bs?.tiers?.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm text-gray-800">{t.name}</span>
              <span className="text-xs text-gray-400">×{t.multiplier} SLA</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Territories</h3>
        <div className="flex flex-wrap gap-2">
          {bs?.territories?.map((t) => (
            <span key={t.id} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{t.name}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
