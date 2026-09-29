import { useNavigate } from 'react-router-dom'
import { Plus, FileText, Wrench, Store, User, Bell, ArrowRight, Inbox, Loader2, CheckCircle2, XCircle, Building2, MapPin } from 'lucide-react'
import { useMyProfile, useMyRequests, usePortalNotifications } from '../../hooks/usePortal'
import { useAuth } from '../../hooks/useAuth'
import Spinner from '../../components/loaders/Spinner'
import { relativeTime } from '../../lib/relativeTime'

const STATUS_META: Record<string, { dot: string; pill: string }> = {
  Received: { dot: 'bg-slate-400', pill: 'bg-slate-100 text-slate-600' },
  'In Progress': { dot: 'bg-amber-500', pill: 'bg-amber-100 text-amber-700' },
  Completed: { dot: 'bg-emerald-500', pill: 'bg-green-100 text-green-700' },
  Cancelled: { dot: 'bg-rose-500', pill: 'bg-red-100 text-red-600' },
}

const STATUS_TILES = [
  { key: 'Received', label: 'Received', icon: Inbox },
  { key: 'In Progress', label: 'In Progress', icon: Loader2 },
  { key: 'Completed', label: 'Completed', icon: CheckCircle2 },
  { key: 'Cancelled', label: 'Cancelled', icon: XCircle },
] as const

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function PortalHomePage() {
  const nav = useNavigate()
  const { staff } = useAuth()
  const { data: dealer, isLoading: dealerLoading } = useMyProfile()
  const { data: requests = [], isLoading: requestsLoading } = useMyRequests()
  const { data: notifications = [] } = usePortalNotifications()

  if (dealerLoading || requestsLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const counts = STATUS_TILES.reduce<Record<string, number>>((acc, t) => {
    acc[t.key] = requests.filter((r) => r.status === t.key).length
    return acc
  }, {})
  const openCount = (counts.Received ?? 0) + (counts['In Progress'] ?? 0)
  const recent = [...requests].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5)
  const unreadNotifs = notifications.filter((n) => !n.is_read).slice(0, 3)

  return (
    <div className="space-y-5">
      {/* Identity header */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white">
        <p className="text-indigo-200 text-sm">{greeting()},</p>
        <h1 className="text-xl font-bold">{staff?.name}</h1>
        {dealer && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-indigo-100">
            <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {dealer.display_name} <span className="text-indigo-300 font-mono text-xs">{dealer.code}</span></span>
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {[dealer.city, dealer.state_normalized].filter(Boolean).join(', ') || '—'}</span>
          </div>
        )}
        {dealer && (
          <div className="flex gap-2 mt-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/15 font-medium">{dealer.tier_name} tier</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/15 font-medium">{dealer.territory_name}</span>
          </div>
        )}
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-4 gap-2.5">
        {STATUS_TILES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => nav('/portal/requests')}
            className="bg-white rounded-2xl border border-slate-200 p-3 text-center hover:border-indigo-300 transition-colors"
          >
            <Icon className="h-4 w-4 mx-auto text-slate-400 mb-1.5" />
            <p className="text-lg font-bold text-slate-800 leading-none">{counts[key] ?? 0}</p>
            <p className="text-[10px] text-slate-500 mt-1 leading-tight">{label}</p>
          </button>
        ))}
      </div>

      {/* Status bar */}
      {requests.length > 0 && (
        <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100">
          {STATUS_TILES.map(({ key }) => {
            const pct = ((counts[key] ?? 0) / requests.length) * 100
            if (pct === 0) return null
            return <div key={key} className={STATUS_META[key].dot} style={{ width: `${pct}%` }} />
          })}
        </div>
      )}

      {/* Primary CTA */}
      <button
        onClick={() => nav('/portal/requests/new')}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3.5 rounded-2xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
      >
        <Plus className="h-4 w-4" /> New Request
      </button>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-2.5">
        <button onClick={() => nav('/portal/services')} className="bg-white rounded-2xl border border-slate-200 p-3.5 text-left hover:border-indigo-300 transition-colors">
          <Wrench className="h-5 w-5 text-indigo-500 mb-2" />
          <p className="text-xs font-semibold text-slate-800">Services</p>
        </button>
        <button onClick={() => nav('/portal/providers')} className="bg-white rounded-2xl border border-slate-200 p-3.5 text-left hover:border-indigo-300 transition-colors">
          <Store className="h-5 w-5 text-indigo-500 mb-2" />
          <p className="text-xs font-semibold text-slate-800">Providers</p>
        </button>
        <button onClick={() => nav('/portal/profile')} className="bg-white rounded-2xl border border-slate-200 p-3.5 text-left hover:border-indigo-300 transition-colors">
          <User className="h-5 w-5 text-indigo-500 mb-2" />
          <p className="text-xs font-semibold text-slate-800">Profile</p>
        </button>
      </div>

      {/* Notifications preview */}
      {unreadNotifs.length > 0 && (
        <button
          onClick={() => nav('/portal/notifications')}
          className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left hover:bg-amber-100/60 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-semibold text-amber-900">{unreadNotifs.length} unread notification{unreadNotifs.length > 1 ? 's' : ''}</p>
          </div>
          <div className="space-y-1">
            {unreadNotifs.map((n) => (
              <p key={n.id} className="text-xs text-amber-800 truncate">{n.title}</p>
            ))}
          </div>
        </button>
      )}

      {/* Recent requests */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-700">Recent Requests</h2>
          <button onClick={() => nav('/portal/requests')} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <FileText className="h-6 w-6 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No requests yet.</p>
            <button onClick={() => nav('/portal/requests/new')} className="mt-2 text-indigo-600 text-sm hover:underline font-medium">
              Submit your first request
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {recent.map((r) => (
              <button key={r.id} onClick={() => nav(`/portal/requests/${r.id}`)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${STATUS_META[r.status]?.dot ?? 'bg-slate-300'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{r.title}</p>
                    <p className="text-xs text-slate-400">{r.ref_no} · {relativeTime(r.created_at)}</p>
                  </div>
                </div>
                <span className={`shrink-0 ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_META[r.status]?.pill ?? 'bg-slate-100 text-slate-600'}`}>{r.status}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {openCount === 0 && requests.length > 0 && (
        <p className="text-center text-xs text-slate-400 py-1">All caught up — no open requests right now.</p>
      )}
    </div>
  )
}
