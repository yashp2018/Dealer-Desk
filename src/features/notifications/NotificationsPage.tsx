import { Bell, CheckCheck } from 'lucide-react'
import { useNotifications, useMarkRead } from '../../hooks/useNotifications'
import { relativeTime } from '../../lib/relativeTime'

export default function NotificationsPage() {
  const { data: notifs = [], isLoading } = useNotifications()
  const markRead = useMarkRead()
  const unread = notifs.filter((n) => !n.is_read)

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Notifications</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{unread.length} unread</p>
        </div>
        {unread.length > 0 && (
          <button
            onClick={() => unread.forEach((n) => markRead.mutate(n.id))}
            className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="px-4 py-12 text-center text-sm text-slate-400">Loading…</div>
        ) : notifs.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Bell className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">You're all caught up</p>
          </div>
        ) : (
          notifs.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead.mutate(n.id)}
              className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!n.is_read ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''}`}
            >
              {!n.is_read && <div className="h-2 w-2 rounded-full bg-indigo-500 mt-2 shrink-0" />}
              <div className={!n.is_read ? '' : 'ml-5'}>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.body}</p>
                <p className="text-xs text-slate-400 mt-1">{relativeTime(n.created_at)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
