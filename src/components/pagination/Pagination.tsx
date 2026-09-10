export default function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null
  return (
    <div className="flex items-center gap-1 text-sm">
      <button disabled={current === 1} onClick={() => onChange(current - 1)} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-50">‹</button>
      {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => onChange(p)} className={`px-3 py-1 rounded border ${p === current ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-gray-50'}`}>{p}</button>
      ))}
      <button disabled={current === total} onClick={() => onChange(current + 1)} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-50">›</button>
    </div>
  )
}
