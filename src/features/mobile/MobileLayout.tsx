import {
  Bell,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  LogOut,
  MapPin,
  Plus,
  Search,
  Store,
  UserRound,
  Users,
  WifiOff,
  X,
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import { useAuth } from '../../hooks/useAuth'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { logout as logoutRequest } from '../../api/auth'

type Tab = {
  to: string
  label: string
  icon: typeof ClipboardList
  end?: boolean
}

const tabs: Tab[] = [
  {
    to: '/mobile',
    label: 'Day',
    icon: ClipboardList,
    end: true,
  },
  {
    to: '/mobile/week',
    label: 'Week',
    icon: CalendarDays,
  },
  {
    to: '/mobile/dealers',
    label: 'Dealers',
    icon: Store,
  },
  {
    to: '/mobile/search',
    label: 'Find',
    icon: Search,
  },
]

export default function MobileLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { data: notifications = [] } = useNotifications()
  const hasUnread = notifications.some((n) => !n.is_read)
  const { staff, logout } = useAuth()
  const isOnline = useOnlineStatus()

  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  const handleLogout = async () => {
    try { await logoutRequest() } finally { logout() }
  }

  const initials = staff?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U'

  // Full-screen single-purpose flows: each owns its own sticky action footer,
  // so the persistent tab bar + FAB (which also sit fixed at the bottom of
  // the screen) must get out of the way instead of silently painting over
  // that page's Save/Submit button.
  const isQuickActionRoute =
    location.pathname === '/mobile/capture' ||
    location.pathname === '/mobile/prospect/new' ||
    location.pathname === '/mobile/dealers/new' ||
    location.pathname.startsWith('/mobile/visit/')

  const handleNavigation = (path: string, state?: Record<string, unknown>) => {
    setQuickActionsOpen(false)
    navigate(path, state ? { state } : undefined)
  }

  return (
    <div className="mobile-app-shell min-h-screen bg-slate-950 text-slate-100 md:bg-slate-200 md:text-slate-900">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-slate-50 text-slate-900 shadow-2xl md:border-x md:border-slate-200">

        {/* =========================================================
            MOBILE HEADER
        ========================================================= */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-700">
                Dealer Desk
              </p>

              <h1 className="truncate text-lg font-bold tracking-tight text-slate-900">
                Field Operations
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => navigate('/mobile/notifications')}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 active:scale-95"
              >
                <Bell className="h-5 w-5" />

                {hasUnread && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>

              {/* Profile */}
              <button
                type="button"
                aria-label="Account"
                onClick={() => setAccountOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95"
              >
                {initials !== 'U' ? initials : <UserRound className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {!isOnline && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              <WifiOff className="h-3.5 w-3.5 shrink-0" />
              You're offline — actions won't save until you're back online.
            </div>
          )}
        </header>

        {/* =========================================================
            PAGE CONTENT
        ========================================================= */}
        <main className={`min-h-0 flex-1 ${isQuickActionRoute ? '' : 'pb-[calc(92px+env(safe-area-inset-bottom))]'}`}>
          <Outlet />
        </main>

        {/* =========================================================
            ACCOUNT SHEET
        ========================================================= */}
        {accountOpen && (
          <>
            <button
              type="button"
              aria-label="Close account menu"
              onClick={() => setAccountOpen(false)}
              className="fixed inset-0 z-[65] bg-slate-950/45 backdrop-blur-[2px]"
            />
            <div className="fixed bottom-0 left-1/2 z-[70] w-full max-w-md -translate-x-1/2 pb-[env(safe-area-inset-bottom)]">
              <div className="rounded-t-3xl border border-b-0 border-slate-200 bg-white p-4 shadow-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{staff?.name ?? 'Account'}</p>
                    <p className="truncate text-xs text-slate-500">{staff?.email}</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setAccountOpen(false)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="flex w-full items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-600 active:bg-red-100"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}

        {!isQuickActionRoute && (
          <>
            {/* =========================================================
                QUICK ACTION BACKDROP
            ========================================================= */}
            {quickActionsOpen && (
              <button
                type="button"
                aria-label="Close quick actions"
                onClick={() => setQuickActionsOpen(false)}
                className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px]"
              />
            )}

            {/* =========================================================
                QUICK ACTIONS
            ========================================================= */}
            <div
              className={`fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 transition-all duration-200 ${
                quickActionsOpen
                  ? 'pointer-events-auto translate-y-0 opacity-100'
                  : 'pointer-events-none translate-y-4 opacity-0'
              }`}
            >
              <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl">
                <div className="mb-2 flex items-center justify-between px-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Quick actions
                    </p>
                    <p className="text-xs text-slate-500">
                      Create or update field activity
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label="Close quick actions"
                    onClick={() => setQuickActionsOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <QuickAction
                    icon={ClipboardList}
                    label="Request"
                    description="New request"
                    onClick={() => handleNavigation('/mobile/capture')}
                  />

                  <QuickAction
                    icon={MapPin}
                    label="Visit"
                    description="Plan visit"
                    onClick={() => handleNavigation('/mobile/visit/new')}
                  />

                  <QuickAction
                    icon={Users}
                    label="Prospect"
                    description="New prospect"
                    onClick={() => handleNavigation('/mobile/prospect/new')}
                  />

                  <QuickAction
                    icon={CalendarClock}
                    label="Calendar Task"
                    description="Task, reminder, meeting…"
                    onClick={() => handleNavigation('/mobile/week', { openCreate: true })}
                  />

                  <QuickAction
                    icon={Store}
                    label="Dealer"
                    description="New dealer"
                    onClick={() => handleNavigation('/mobile/dealers/new')}
                  />
                </div>
              </div>
            </div>

            {/* =========================================================
                MAIN FAB
            ========================================================= */}
            <button
              type="button"
              aria-label={quickActionsOpen ? 'Close actions' : 'New activity'}
              aria-expanded={quickActionsOpen}
              onClick={() => setQuickActionsOpen((open) => !open)}
              className={`fixed bottom-[calc(82px+env(safe-area-inset-bottom))] left-1/2 z-[60] flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-cyan-700 text-white shadow-xl shadow-cyan-900/30 transition-all duration-200 hover:bg-cyan-800 active:scale-95 ${
                quickActionsOpen ? 'rotate-45' : ''
              }`}
            >
              <Plus className="h-6 w-6" />
            </button>

            {/* =========================================================
                BOTTOM NAVIGATION
            ========================================================= */}
            <nav
              aria-label="Mobile navigation"
              className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] backdrop-blur"
            >
              {tabs.map(({ to, label, icon: Icon, end }) => {
                const active = end
                  ? location.pathname === to
                  : location.pathname.startsWith(to)

                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className="flex min-h-16 flex-1 items-center justify-center"
                  >
                    <span
                      className={`flex min-w-[64px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-1.5 text-[11px] font-semibold transition ${
                        active
                          ? 'bg-cyan-50 text-cyan-700'
                          : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                      }`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                      <span>{label}</span>
                    </span>
                  </NavLink>
                )
              })}
            </nav>
          </>
        )}
      </div>
    </div>
  )
}

function QuickAction({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: typeof ClipboardList
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-24 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-2 text-center transition hover:border-cyan-200 hover:bg-cyan-50 active:scale-[0.98]"
    >
      <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-cyan-700 shadow-sm">
        <Icon className="h-5 w-5" />
      </span>

      <span className="text-xs font-bold text-slate-800">
        {label}
      </span>

      <span className="mt-0.5 text-[10px] text-slate-400">
        {description}
      </span>
    </button>
  )
}