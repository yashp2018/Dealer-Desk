import { Bell } from 'lucide-react'
import { usePortalNotifications, useMarkPortalNotificationRead, useMarkAllPortalNotificationsRead } from '../../hooks/usePortal'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import { relativeTime } from '../../lib/relativeTime'

export default function PortalNotificationsPage() {
  const { data: notifications = [], isLoading, isError, refetch } = usePortalNotifications()
  const markRead = useMarkPortalNotificationRead()
  const markAllRead = useMarkAllPortalNotificationsRead()
  const unread = notifications.filter((n) => !n.is_read).length

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError) return <Alert type="danger" message="Failed to load notifications." onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Notifications</h1>
        {unread > 0 && (
          <button onClick={() => markAllRead.mutate()} className="text-xs text-indigo-600 hover:underline font-medium">
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <Bell className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && markRead.mutate(n.id)}
              className={`w-full flex items-start gap-2 text-left px-4 py-3 hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-indigo-50/60' : ''}`}
            >
              {!n.is_read && <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />}
              <div className={!n.is_read ? '' : 'ml-4'}>
                <p className="text-sm font-medium text-slate-800">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                <p className="text-xs text-slate-400 mt-1">{relativeTime(n.created_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
