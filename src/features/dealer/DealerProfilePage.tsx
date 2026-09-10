import { useQuery } from '@tanstack/react-query'
import { getMyDealer } from '../../api/dealers'
import type { DealerPortal } from '../../api/types'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import { Building2, Phone, MapPin } from 'lucide-react'

export default function DealerProfilePage() {
  const { data: dealer, isLoading, isError } = useQuery<DealerPortal>({
    queryKey: ['dealer-me'],
    queryFn: getMyDealer,
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError || !dealer) return <Alert type="danger" message="Failed to load dealer profile." />

  const rows: [string, string | undefined][] = [
    ['Dealer Code', dealer.code],
    ['Display Name', dealer.display_name],
    ['Phone', dealer.phone_primary],
    ['WhatsApp', dealer.whatsapp_phone],
    ['City', dealer.city],
    ['State', dealer.state_normalized],
    ['Tier', dealer.tier_name],
    ['Territory', dealer.territory_name],
  ]

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-800">My Profile</h2>
        <p className="text-sm text-slate-500">Your dealer account information</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="font-bold text-slate-800">{dealer.name}</p>
            <p className="text-xs font-mono text-slate-400">{dealer.code}</p>
          </div>
        </div>

        <dl className="space-y-3">
          {rows.map(([label, value]) => value ? (
            <div key={label} className="flex justify-between text-sm">
              <dt className="text-slate-500">{label}</dt>
              <dd className="text-slate-800 font-medium text-right">{value}</dd>
            </div>
          ) : null)}
        </dl>
      </div>

      <p className="text-xs text-slate-400 text-center">
        To update your profile information, please contact your account manager.
      </p>
    </div>
  )
}
