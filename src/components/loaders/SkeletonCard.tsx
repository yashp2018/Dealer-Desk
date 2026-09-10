interface SkeletonCardProps { lines?: number; className?: string }

export default function SkeletonCard({ lines = 3, className = '' }: SkeletonCardProps) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 animate-pulse ${className}`}>
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-2.5 bg-slate-100 dark:bg-slate-800 rounded mb-2.5 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}
