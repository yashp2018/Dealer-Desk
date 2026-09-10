import SkeletonRow from '../loaders/SkeletonRow'

export interface Column<T> { label: string; field?: keyof T; render?: (row: T) => React.ReactNode }

interface Props<T> {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  onRowClick?: (row: T) => void
  emptyMessage?: string
}

export default function DataTable<T extends { id?: number | string }>({ columns, rows, loading, onRowClick, emptyMessage = 'No records found.' }: Props<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((c) => (
              <th key={c.label} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <SkeletonRow cols={columns.length} />
          ) : rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400 text-sm">{emptyMessage}</td></tr>
          ) : (
            rows.map((row, i) => (
              <tr key={row.id ?? i} onClick={() => onRowClick?.(row)} className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}>
                {columns.map((c) => (
                  <td key={c.label} className="px-4 py-3 text-gray-700">
                    {c.render ? c.render(row) : c.field ? String(row[c.field] ?? '') : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}


