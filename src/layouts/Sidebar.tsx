import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Radio, CalendarDays, Building2, UserPlus,
  FileText, MapPin, BarChart2, Settings, Bell, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useUiStore } from '../stores/uiStore'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../hooks/useAuth'

const internalNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/control-room', icon: Radio, label: 'Control Room' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/dealers', icon: Building2, label: 'Dealers' },
  { to: '/prospects', icon: UserPlus, label: 'Prospects' },
  { to: '/requests', icon: FileText, label: 'Requests' },
  { to: '/visits', icon: MapPin, label: 'Visits' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/notifications', icon: Bell, label: 'Notifications', badge: true },
  { to: '/setup', icon: Settings, label: 'Setup' },
]

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useUiStore()
  const { data: notifs = [] } = useNotifications()
  const { isAdmin, isStaff } = useAuth()
  const unread = notifs.filter((n) => !n.is_read).length

  // Dealer users should never reach this sidebar — they use DealerPortalLayout.
  // This sidebar is only for admin/staff.
  const nav = (isAdmin || isStaff) ? internalNav : []

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 56 : 220 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative bg-slate-900 dark:bg-slate-950 text-white flex flex-col shrink-0 h-screen sticky top-0 overflow-hidden border-r border-slate-800"
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-3.5 border-b border-slate-800 shrink-0">
        <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <Building2 className="h-3.5 w-3.5 text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="ml-2.5 font-bold text-sm tracking-tight text-white whitespace-nowrap overflow-hidden"
            >
              Dealer Desk
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto scrollbar-thin space-y-0.5 px-2">
        {nav.map(({ to, icon: Icon, label, badge }) => {
          const badgeCount = badge ? unread : 0
          return (
            <NavLink
              key={to}
              to={to}
              title={sidebarCollapsed ? label : undefined}
              className={({ isActive }) =>
                `relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors group ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="relative shrink-0">
                <Icon className="h-4 w-4" />
                {badgeCount > 0 && sidebarCollapsed && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="flex-1 whitespace-nowrap overflow-hidden"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
              {!sidebarCollapsed && badgeCount > 0 && (
                <span className="ml-auto h-5 min-w-5 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-slate-800 shrink-0">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full flex items-center justify-center h-8 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white transition-colors"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </motion.aside>
  )
}
