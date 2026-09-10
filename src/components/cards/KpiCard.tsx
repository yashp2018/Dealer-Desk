import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: number | string
  icon?: LucideIcon
  tone?: 'default' | 'p1' | 'p2' | 'ok' | 'warning' | 'info'
  trend?: number
  sub?: string
  onClick?: () => void
}

const toneMap = {
  default: { bg: 'bg-slate-50 dark:bg-slate-800', icon: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400', value: 'text-slate-800 dark:text-slate-100' },
  p1:      { bg: 'bg-red-50 dark:bg-red-950/30',   icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',     value: 'text-red-700 dark:text-red-400' },
  p2:      { bg: 'bg-amber-50 dark:bg-amber-950/30', icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400', value: 'text-amber-700 dark:text-amber-400' },
  ok:      { bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400', value: 'text-emerald-700 dark:text-emerald-400' },
  warning: { bg: 'bg-orange-50 dark:bg-orange-950/30', icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400', value: 'text-orange-700 dark:text-orange-400' },
  info:    { bg: 'bg-indigo-50 dark:bg-indigo-950/30', icon: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400', value: 'text-indigo-700 dark:text-indigo-400' },
}

export default function KpiCard({ label, value, icon: Icon, tone = 'default', trend, sub, onClick }: KpiCardProps) {
  const t = toneMap[tone]
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-200 dark:border-slate-700 p-4 ${t.bg} ${onClick ? 'cursor-pointer hover:shadow-card-hover transition-shadow' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{label}</p>
          <p className={`text-2xl font-bold mt-1 leading-none ${t.value}`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">{sub}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend)}% vs last week
            </div>
          )}
        </div>
        {Icon && (
          <span className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${t.icon}`}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  )
}
