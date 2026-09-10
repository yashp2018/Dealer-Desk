import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Building2, FileText, UserPlus, MapPin, Clock, ArrowRight, X } from 'lucide-react'
import { useUiStore } from '../../stores/uiStore'
import { useDealers } from '../../hooks/useDealers'
import { useRequests } from '../../hooks/useRequests'
import { useProspects } from '../../hooks/useProspects'

interface SearchResult {
  id: string
  type: 'dealer' | 'request' | 'prospect' | 'visit'
  title: string
  subtitle: string
  to: string
}

const RECENT_KEY = 'dd-recent-searches'

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') } catch { return [] }
}
function addRecent(q: string) {
  const prev = getRecent().filter((s) => s !== q)
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, 5)))
}

const typeIcon = { dealer: Building2, request: FileText, prospect: UserPlus, visit: MapPin }
const typeColor: Record<string, string> = {
  dealer: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40',
  request: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40',
  prospect: 'text-violet-500 bg-violet-50 dark:bg-violet-950/40',
  visit: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
}

export default function GlobalSearch() {
  const { globalSearchOpen, setGlobalSearchOpen } = useUiStore()
  const nav = useNavigate()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const [recent, setRecent] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: dealers = [] } = useDealers()
  const { data: requests = [] } = useRequests()
  const { data: prospects = [] } = useProspects()

  useEffect(() => {
    if (globalSearchOpen) {
      setRecent(getRecent())
      setQuery('')
      setCursor(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [globalSearchOpen])

  const q = query.trim().toLowerCase()
  const results: SearchResult[] = q.length < 2 ? [] : [
    ...dealers
      .filter((d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q))
      .slice(0, 3)
      .map((d) => ({ id: `d-${d.id}`, type: 'dealer' as const, title: d.name, subtitle: `${d.code} · ${d.city}`, to: `/dealers/${d.id}` })),
    ...requests
      .filter((r) => r.title.toLowerCase().includes(q) || r.ref.toLowerCase().includes(q))
      .slice(0, 3)
      .map((r) => ({ id: `r-${r.id}`, type: 'request' as const, title: r.title, subtitle: `${r.ref} · ${r.dealer_name}`, to: `/requests/${r.id}` })),
    ...prospects
      .filter((p) => p.company_name.toLowerCase().includes(q))
      .slice(0, 2)
      .map((p) => ({ id: `p-${p.id}`, type: 'prospect' as const, title: p.company_name, subtitle: `${p.city} · ${p.stage}`, to: `/prospects/${p.id}` })),
  ]

  const goTo = useCallback((to: string) => {
    if (query.trim()) addRecent(query.trim())
    setGlobalSearchOpen(false)
    nav(to)
  }, [query, setGlobalSearchOpen, nav])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!globalSearchOpen) return
      if (e.key === 'Escape') { setGlobalSearchOpen(false); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
      if (e.key === 'Enter' && results[cursor]) goTo(results[cursor].to)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [globalSearchOpen, results, cursor, goTo, setGlobalSearchOpen])

  if (!globalSearchOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setGlobalSearchOpen(false)}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(0) }}
            placeholder="Search dealers, requests, prospects…"
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono text-slate-400">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          {q.length >= 2 ? (
            results.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-slate-400">No results for "<span className="font-medium">{query}</span>"</p>
              </div>
            ) : (
              <div className="py-2">
                {results.map((r, i) => {
                  const Icon = typeIcon[r.type]
                  return (
                    <button
                      key={r.id}
                      onClick={() => goTo(r.to)}
                      onMouseEnter={() => setCursor(i)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${cursor === i ? 'bg-indigo-50 dark:bg-indigo-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      <span className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${typeColor[r.type]}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{r.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.subtitle}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                    </button>
                  )
                })}
              </div>
            )
          ) : recent.length > 0 ? (
            <div className="py-2">
              <p className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Recent</p>
              {recent.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{s}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-slate-400">Type at least 2 characters to search</p>
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs text-slate-400">
          <span><kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">↵</kbd> open</span>
          <span><kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">ESC</kbd> close</span>
        </div>
      </motion.div>
    </div>
  )
}
