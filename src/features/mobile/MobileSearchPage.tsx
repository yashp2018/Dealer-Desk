import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Clock, FileText, MapPin, Search, UserPlus, X } from 'lucide-react'
import { useDealers } from '../../hooks/useDealers'
import { useRequests } from '../../hooks/useRequests'
import { useProspects } from '../../hooks/useProspects'
import { useVisits } from '../../hooks/useVisits'
import Spinner from '../../components/loaders/Spinner'

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
  try { localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, 5))) } catch { /* ignore */ }
}

const TYPE_ICON = { dealer: Building2, request: FileText, prospect: UserPlus, visit: MapPin }
const TYPE_COLOR: Record<string, string> = {
  dealer: 'text-blue-600 bg-blue-50',
  request: 'text-indigo-600 bg-indigo-50',
  prospect: 'text-violet-600 bg-violet-50',
  visit: 'text-emerald-600 bg-emerald-50',
}

export default function MobileSearchPage() {
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState<string[]>(() => getRecent())

  const { data: dealers = [], isLoading: dealersLoading } = useDealers()
  const { data: requests = [], isLoading: requestsLoading } = useRequests()
  const { data: prospects = [], isLoading: prospectsLoading } = useProspects()
  const { data: visits = [], isLoading: visitsLoading } = useVisits()
  const isLoading = dealersLoading || requestsLoading || prospectsLoading || visitsLoading

  const q = query.trim().toLowerCase()

  const results: SearchResult[] = useMemo(() => {
    if (q.length < 2) return []
    return [
      ...dealers
        .filter((d) => d.display_name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q))
        .slice(0, 5)
        .map((d) => ({ id: `d-${d.id}`, type: 'dealer' as const, title: d.display_name, subtitle: `${d.code} · ${d.city}`, to: `/mobile/dealers/${d.id}` })),
      ...requests
        .filter((r) => r.title.toLowerCase().includes(q) || r.ref.toLowerCase().includes(q))
        .slice(0, 5)
        .map((r) => ({ id: `r-${r.id}`, type: 'request' as const, title: r.title || r.type_name, subtitle: `${r.ref} · ${r.dealer_name}`, to: `/mobile/request/${r.id}` })),
      ...prospects
        .filter((p) => p.company_name.toLowerCase().includes(q))
        .slice(0, 5)
        .map((p) => ({ id: `p-${p.id}`, type: 'prospect' as const, title: p.company_name, subtitle: `${p.city} · ${p.stage}`, to: `/mobile/prospect/${p.id}` })),
      ...visits
        .filter((v) => v.dealer_name?.toLowerCase().includes(q) || v.title?.toLowerCase().includes(q) || v.ref.toLowerCase().includes(q))
        .slice(0, 5)
        .map((v) => ({ id: `v-${v.id}`, type: 'visit' as const, title: v.title || v.dealer_name, subtitle: `${v.ref} · ${v.visit_type}`, to: `/mobile/visit/${v.id}` })),
    ]
  }, [q, dealers, requests, prospects, visits])

  const handleSelect = () => {
    if (query.trim()) addRecent(query.trim())
    setRecent(getRecent())
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 px-5 pb-5 pt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Search</p>
        <h1 className="mt-1 text-xl font-bold text-white">Find anything</h1>
        <label className="mt-4 flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-slate-500">
          <Search className="h-5 w-5 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dealers, requests, prospects, visits…"
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none"
          />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="shrink-0 text-slate-400">
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
      </header>

      <div className="p-4">
        {q.length < 2 ? (
          <>
            {recent.length > 0 && (
              <div>
                <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">Recent</p>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {recent.map((term) => (
                    <button key={term} type="button" onClick={() => setQuery(term)}
                      className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 active:bg-slate-50">
                      <Clock className="h-4 w-4 shrink-0 text-slate-300" />
                      <span className="text-sm text-slate-700">{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {recent.length === 0 && (
              <p className="px-1 py-16 text-center text-sm text-slate-400">Type at least 2 characters to search.</p>
            )}
          </>
        ) : isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : results.length === 0 ? (
          <p className="px-1 py-16 text-center text-sm text-slate-400">No results for "{query}".</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {results.map((r) => {
              const Icon = TYPE_ICON[r.type]
              return (
                <Link key={r.id} to={r.to} onClick={handleSelect}
                  className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 last:border-0 active:bg-slate-50">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TYPE_COLOR[r.type]}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{r.title}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">{r.subtitle}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
