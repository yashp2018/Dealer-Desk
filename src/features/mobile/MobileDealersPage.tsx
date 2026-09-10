import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import { useDealers } from '../../hooks/useDealers'
import Spinner from '../../components/loaders/Spinner'

export default function MobileDealersPage() {
  const [search, setSearch] = useState('')
  const { data = [], isLoading, isError } = useDealers()
  const filtered = useMemo(() => data.filter((dealer) => `${dealer.display_name} ${dealer.city} ${dealer.code}`.toLowerCase().includes(search.toLowerCase())), [data, search])

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  if (isError) return <div className="p-5"><div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">Live dealer data is unavailable.</div></div>

  return <div><header className="bg-slate-950 px-5 pb-5 pt-6 text-white"><div className="flex items-center gap-3"><Link to="/mobile" className="rounded-full bg-white/10 p-2"><ArrowLeft className="h-5 w-5" /></Link><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Directory</p><h1 className="mt-1 text-xl font-bold">Dealers</h1></div></div><label className="mt-5 flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-slate-500"><Search className="h-5 w-5" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search dealers" className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none" /></label></header><div className="divide-y divide-slate-100 bg-white">{filtered.map((dealer) => <Link key={dealer.id} to={`/dealers/${dealer.id}`} className="flex items-center justify-between px-5 py-4 active:bg-slate-50"><span className="min-w-0"><strong className="block truncate text-sm text-slate-800">{dealer.display_name}</strong><span className="mt-1 block text-xs text-slate-400">{dealer.city} · {dealer.code}</span></span>{dealer.overdue_requests > 0 ? <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">{dealer.overdue_requests}</span> : dealer.open_requests > 0 ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{dealer.open_requests}</span> : null}</Link>)}{filtered.length === 0 && <p className="px-5 py-16 text-center text-sm text-slate-400">No dealers found.</p>}</div></div>
}
