import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface Crumb { label: string; to?: string }

export default function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1 text-xs text-gray-400 mb-4">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          {c.to ? <Link to={c.to} className="hover:text-indigo-600">{c.label}</Link> : <span className="text-gray-600">{c.label}</span>}
        </span>
      ))}
    </nav>
  )
}
