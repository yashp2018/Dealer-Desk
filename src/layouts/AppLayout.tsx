import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { 
  CheckCircle, XCircle, Info, AlertTriangle, X, 
  ChevronRight, HelpCircle 
} from 'lucide-react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import GlobalSearch from '../components/search/GlobalSearch'
import { useUiStore } from '../stores/uiStore'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/control-room': 'Control Room',
  '/dealers': 'Dealers',
  '/prospects': 'Prospects',
  '/requests': 'Requests',
  '/visits': 'Visits',
  '/calendar': 'Calendar',
  '/reports': 'Reports',
  '/notifications': 'Notifications',
  '/setup': 'Setup',
}

const toastStyles = {
  success: { 
    bg: 'bg-emerald-600', 
    icon: CheckCircle,
    border: 'border-emerald-400/20'
  },
  error: { 
    bg: 'bg-red-600', 
    icon: XCircle,
    border: 'border-red-400/20'
  },
  info: { 
    bg: 'bg-indigo-600', 
    icon: Info,
    border: 'border-indigo-400/20'
  },
  warning: { 
    bg: 'bg-amber-500', 
    icon: AlertTriangle,
    border: 'border-amber-400/20'
  },
}

// Page transition variants
const pageVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: 8,
    scale: 0.99
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 0.2, 1] as const,
      staggerChildren: 0.05
    }
  },
  exit: { 
    opacity: 0,
    y: -8,
    scale: 0.98,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 0.2, 1] as const
    }
  }
}

const childVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2 }
  }
}

// Subtle background patterns
const bgPatterns = {
  grid: `
    radial-gradient(circle at 20% 50%, rgba(45, 212, 191, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 50% 80%, rgba(236, 72, 153, 0.02) 0%, transparent 50%)
  `,
  dots: `
    radial-gradient(circle, rgba(15, 23, 42, 0.03) 1px, transparent 1px)
  `
}

export default function AppLayout() {
  const { pathname } = useLocation()
  const { toasts, removeToast } = useUiStore()
  const title = Object.entries(titles).find(([k]) => pathname.startsWith(k))?.[1]
  
  // Detect if on a page with custom background
  const isCalendarPage = pathname.includes('/calendar')
  const isDashboardPage = pathname === '/dashboard'

  return (
    <div className="app-shell flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative">
      
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-400/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-128 h-128 bg-cyan-400/3 rounded-full blur-3xl" />
      </div>

      <Sidebar />
      
      {/* On lg+ sidebar is sticky in-flow; on mobile it's fixed/overlaid so content takes full width */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
        <Topbar title={title} />
        
        <main className={`
          app-main flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-thin
          ${!isCalendarPage && !isDashboardPage ? 'bg-white/50 backdrop-blur-[1px]' : ''}
          ${isCalendarPage ? 'bg-transparent' : ''}
          ${isDashboardPage ? 'bg-transparent' : ''}
        `}>
          {/* Subtle content overlay pattern */}
          {!isCalendarPage && !isDashboardPage && (
            <div className="fixed inset-0 pointer-events-none opacity-[0.015] -z-10">
              <div className="h-full w-full" style={{ 
                backgroundImage: bgPatterns.dots,
                backgroundSize: '24px 24px'
              }} />
            </div>
          )}
          
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative z-10 max-w-7xl mx-auto"
            >
              {/* Page indicator dot */}
              <motion.div 
                variants={childVariants}
                className="flex items-center gap-2 mb-4 text-xs text-slate-400/80"
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400/60" />
                <span className="tracking-wider uppercase font-medium">
                  {title || 'Page'}
                </span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-slate-300">Ready</span>
              </motion.div>

              {/* Content with subtle card effect */}
              <motion.div 
                variants={childVariants}
                className={`
                  ${!isCalendarPage && !isDashboardPage ? 'bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/50 p-4 md:p-6' : ''}
                  ${isCalendarPage ? 'bg-transparent p-0' : ''}
                  ${isDashboardPage ? 'bg-transparent p-0' : ''}
                  transition-all duration-300
                `}
              >
                <Outlet />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Search */}
      <GlobalSearch />

      {/* Enhanced Toast stack with animations */}
      <div className="fixed bottom-6 right-6 space-y-3 z-50 pointer-events-none max-w-md w-full">
        <AnimatePresence mode="sync">
          {toasts.map((t, index) => {
            const { bg, icon: Icon, border } = toastStyles[t.type]
            return (
              <motion.div
                key={t.id}
                custom={index}
                initial={{ opacity: 0, x: 60, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ 
                  opacity: 0, 
                  x: 60, 
                  scale: 0.9,
                  transition: { duration: 0.15 }
                }}
                transition={{ 
                  duration: 0.25, 
                  ease: [0.4, 0, 0.2, 1],
                  delay: index * 0.05
                }}
                className={`
                  pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl 
                  text-white text-sm shadow-xl backdrop-blur-sm
                  border ${border}
                  min-w-[280px] max-w-sm relative overflow-hidden
                  ${bg}
                `}
              >
                {/* Animated progress bar */}
                <motion.div 
                  className="absolute bottom-0 left-0 h-0.5 bg-white/30"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 4, ease: 'linear' }}
                  onAnimationComplete={() => removeToast(t.id)}
                />
                
                <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="flex-1 leading-relaxed">{t.message}</span>
                <button 
                  onClick={() => removeToast(t.id)} 
                  className="opacity-60 hover:opacity-100 transition-all hover:scale-110 shrink-0 mt-0.5"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Quick help floating button */}
      <motion.button 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="fixed bottom-6 left-6 z-40 p-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg hover:shadow-xl transition-all hover:scale-105 text-slate-600 hover:text-teal-600 group"
        aria-label="Help"
      >
        <HelpCircle className="h-5 w-5 transition-transform group-hover:rotate-12" />
      </motion.button>
    </div>
  )
}