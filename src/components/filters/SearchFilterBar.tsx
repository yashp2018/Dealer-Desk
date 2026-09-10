import { Search } from 'lucide-react'

interface FilterOption { label: string; value: string }
interface Filter { key: string; placeholder: string; options: FilterOption[]; value: string; onChange: (v: string) => void }

interface Props { search: string; onSearch: (v: string) => void; filters?: Filter[] }

export default function SearchFilterBar({ search, onSearch, filters = [] }: Props) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search…" className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56" />
      </div>
      {filters.map((f) => (
        <select key={f.key} value={f.value} onChange={(e) => f.onChange(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">{f.placeholder}</option>
          {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}
    </div>
  )
}
