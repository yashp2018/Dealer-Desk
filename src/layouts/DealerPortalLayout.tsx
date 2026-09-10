import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Building2, Plus, FileText, User, Bell, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { logout as apiLogout } from '../api/auth'
import { useNotifications } from '../hooks/useNotifications'

const nav = [
  { to: '/dealer/requests/new', icon: Plus, label: 'New Request' },
  { to: '/dealer/requests', icon: FileText, label: 'My Requests', end: true },
  { to: '/dealer/profile', icon: User, label: 'My Profile' },
  { to: '/dealer/notifications', icon: Bell, label: 'Notifications', badge: true },
]

export default function DealerPortalLayout() {
  const { staff, logout } = useAuth()
  const navigate = useNavigate()
  const { data: notifs = [] } = useNotifications()
  const unread = notifs.filter((n) => !n.is_read).length

  const handleLogout = async () => {
    try { await apiLogout() } catch { /* ignore */ }
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 text-white flex flex-col shrink-0 h-screen sticky top-0">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-slate-800 gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <Building2 className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-white leading-none">Dealer Portal</p>
            <p className="text-xs text-slate-400 truncate max-w-[120px]">{staff?.name}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 space-y-0.5">
          {nav.map(({ to, icon: Icon, label, badge, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && unread > 0 && (
                <span className="h-5 min-w-5 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6">
          <h1 className="text-sm font-semibold text-slate-700">Dealer Portal</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
