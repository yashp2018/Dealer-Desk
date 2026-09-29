const map: Record<number, { label: string; cls: string }> = {
  1: { label: 'P1', cls: 'bg-red-100 text-red-700' },
  2: { label: 'P2', cls: 'bg-amber-100 text-amber-700' },
  3: { label: 'P3', cls: 'bg-gray-100 text-gray-600' },
  4: { label: 'P4', cls: 'bg-gray-100 text-gray-400' },
}
export default function PriorityBadge({ priority }: { priority: number }) {
  const { label, cls } = map[priority] ?? map[3]
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>
}
