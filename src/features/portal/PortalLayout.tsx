import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, Plus, FileText, Wrench, Store, User, LogOut, Building2, Bell } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { logout as apiLogout } from '../../api/auth'
import { useMyProfile, usePortalNotifications } from '../../hooks/usePortal'

const nav = [
  { to: '/portal', icon: Home, label: 'Home', end: true },
  { to: '/portal/requests/new', icon: Plus, label: 'New Request' },
  { to: '/portal/requests', icon: FileText, label: 'My Requests' },
  { to: '/portal/services', icon: Wrench, label: 'Services' },
  { to: '/portal/providers', icon: Store, label: 'Providers' },
  { to: '/portal/profile', icon: User, label: 'Profile' },
]

/**
 * Distinct, mobile-first surface for dealer-portal logins — not a cut-down
 * staff console. Bottom tab bar on phones (where a dealer is most likely to
 * be), a slim sidebar on wider screens. Same color tokens as the staff
 * console (indigo accent) so it still reads as "Dealer Desk", just a
 * simpler, more focused shell around it.
 */
export default function PortalLayout() {
  const { staff, logout } = useAuth()
  const navigate = useNavigate()
  const { data: dealer } = useMyProfile()
  const { data: notifications = [] } = usePortalNotifications()
  const unread = notifications.filter((n) => !n.is_read).length

  const handleLogout = async () => {
    try { await apiLogout() } catch { /* ignore */ }
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar — md and up */}
      <aside className="hidden md:flex md:w-56 bg-slate-900 text-white flex-col shrink-0 h-screen sticky top-0">
        <div className="h-16 flex items-center px-4 border-b border-slate-800 gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-white leading-none truncate">{dealer?.display_name ?? 'Dealer Portal'}</p>
            <p className="text-xs text-slate-400 truncate">{staff?.name}</p>
          </div>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-1">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-slate-800 space-y-1">
          <NavLink
            to="/portal/notifications"
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Bell className="h-4.5 w-4.5 shrink-0" /> Notifications
            {unread > 0 && <span className="ml-auto h-5 min-w-5 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{unread > 9 ? '9+' : unread}</span>}
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" /> Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden h-14 bg-slate-900 text-white flex items-center justify-between px-4 shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <Building2 className="h-3.5 w-3.5 text-white" />
          </div>
          <p className="font-bold text-sm truncate">{dealer?.display_name ?? 'Dealer Portal'}</p>
        </div>
        <div className="flex items-center gap-1">
          <NavLink to="/portal/notifications" className="relative text-slate-400 hover:text-white p-1.5" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {unread > 0 && <span className="absolute top-0.5 right-0.5 h-3.5 w-3.5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{unread > 9 ? '9+' : unread}</span>}
          </NavLink>
          <button onClick={handleLogout} className="text-slate-400 hover:text-white p-1.5" aria-label="Log out">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 max-w-3xl w-full mx-auto">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex items-stretch z-20">
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium ${
                isActive ? 'text-indigo-600' : 'text-slate-400'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
