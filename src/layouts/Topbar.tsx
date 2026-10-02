import { Bell, Menu, LogOut, Sun, Moon, Plus, Search, User, ChevronDown, FileText, Building2, UserPlus, MapPin, Smartphone, Monitor } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUiStore } from '../stores/uiStore'
import { useAuthStore } from '../stores/authStore'
import { useNotifications, useMarkRead } from '../hooks/useNotifications'
import { relativeTime } from '../lib/relativeTime'
import { logout as logoutRequest } from '../api/auth'

const quickCreate = [
  { icon: FileText, label: 'New Request', to: '/requests/new' },
  { icon: Building2, label: 'New Dealer', to: '/dealers/new' },
  { icon: UserPlus, label: 'New Prospect', to: '/prospects/new' },
  { icon: MapPin, label: 'New Visit', to: '/visits/new' },
]

export default function Topbar({ title }: { title?: string }) {
  const nav = useNavigate()
  const location = useLocation()
  const { toggleSidebar, toggleDarkMode, darkMode, setGlobalSearchOpen, viewMode, setViewMode } = useUiStore()
  const { staff, logout } = useAuthStore()
  const { data: notifs = [] } = useNotifications()
  const markRead = useMarkRead()
  const [bellOpen, setBellOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const unread = notifs.filter((n) => !n.is_read).length
  const bellRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const createRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
      if (createRef.current && !createRef.current.contains(e.target as Node)) setCreateOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Ctrl+K global search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setGlobalSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [setGlobalSearchOpen])

  const handleLogout = async () => {
    try { await logoutRequest() } finally { logout() }
  }

  const initials = staff?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U'

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-3 sticky top-0 z-30 shrink-0">
      {/* Hamburger — visible below lg breakpoint */}
      <button
        onClick={toggleSidebar}
        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white lg:hidden p-1"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title */}
      {title && (
        <h1 className="text-sm font-semibold text-slate-700 dark:text-slate-200 hidden sm:block">{title}</h1>
      )}

      {/* Global search trigger */}
      <button
        onClick={() => setGlobalSearchOpen(true)}
        className="hidden md:flex items-center gap-2 ml-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm text-slate-500 dark:text-slate-400 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search…</span>
        <kbd className="ml-2 text-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 font-mono text-slate-400">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Quick Create */}
        <div ref={createRef} className="relative">
          <button
            onClick={() => setCreateOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:block">New</span>
            <ChevronDown className="h-3 w-3 hidden sm:block" />
          </button>
          {createOpen && (
            <div className="absolute right-0 top-10 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
              {quickCreate.map(({ icon: Icon, label, to }) => (
                <button
                  key={to}
                  onClick={() => { nav(to); setCreateOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Icon className="h-4 w-4 text-slate-400" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View mode switcher */}
        <button
          onClick={() => {
            const next = viewMode === 'desktop' ? 'mobile' : 'desktop'
            setViewMode(next)
            if (next === 'mobile') {
              nav('/mobile')
            } else {
              // Return to the equivalent desktop route from current mobile path
              const mob = location.pathname
              if (mob.startsWith('/mobile/visit/')) nav(`/visits/${mob.split('/').pop()}`)
              else if (mob.startsWith('/mobile/dealers')) nav('/dealers')
              else if (mob.startsWith('/mobile')) nav('/dashboard')
              else nav(location.pathname)
            }
          }}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title={viewMode === 'desktop' ? 'Switch to Mobile view' : 'Switch to Desktop view'}
        >
          {viewMode === 'desktop' ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleDarkMode}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notification Bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setBellOpen((v) => !v)}
            className="relative h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {bellOpen && (
            <div className="absolute right-0 top-10 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notifications</span>
                {unread > 0 && (
                  <button
                    onClick={() => nav('/notifications')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View all
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {notifs.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No notifications</p>
                  </div>
                ) : (
                  notifs.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => { markRead.mutate(n.id); setBellOpen(false); if (n.link_url) nav(n.link_url) }}
                      className={`px-4 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!n.is_read ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.is_read && <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />}
                        <div className={!n.is_read ? '' : 'ml-4'}>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.body}</p>
                          <p className="text-xs text-slate-400 mt-1">{relativeTime(n.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User dropdown */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => setUserOpen((v) => !v)}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-200 max-w-24 truncate">
              {staff?.name}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:block" />
          </button>
          {userOpen && (
            <div className="absolute right-0 top-10 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{staff?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{staff?.email}</p>
              </div>
              <button
                onClick={() => { setUserOpen(false); nav('/setup') }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <User className="h-4 w-4 text-slate-400" />
                Profile & Settings
              </button>
              <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                <button
                  onClick={() => void handleLogout()}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
