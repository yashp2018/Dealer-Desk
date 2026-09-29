interface Field { key: string; label: string; input_type: string; options: string[]; is_required: boolean; help_text: string; sort_order: number }

interface Props {
  fields: Field[]
  mode: 'read' | 'edit'
  values?: Record<string, string>
  onChange?: (key: string, value: string) => void
}

/** True when every required field in this group has a non-empty value. */
export function isFieldGroupComplete(fields: Field[], values: Record<string, string>): boolean {
  return fields.every((f) => !f.is_required || (values[f.key] ?? '').trim())
}

export default function RequestDynamicFields({ fields, mode, values = {}, onChange }: Props) {
  const sorted = [...fields].sort((a, b) => a.sort_order - b.sort_order)
  if (mode === 'read') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sorted.map((f) => (
          <div key={f.key}>
            <p className="text-xs text-gray-400">{f.label}</p>
            <p className="text-sm text-gray-800 mt-0.5">{values[f.key] ?? '—'}</p>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {sorted.map((f) => (
        <div key={f.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {f.label}{f.is_required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {f.input_type === 'select' ? (
            <select value={values[f.key] ?? ''} onChange={(e) => onChange?.(f.key, e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select…</option>
              {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : f.input_type === 'textarea' ? (
            <textarea value={values[f.key] ?? ''} onChange={(e) => onChange?.(f.key, e.target.value)} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          ) : (
            <input type={f.input_type === 'number' ? 'number' : f.input_type === 'date' ? 'date' : 'text'}
              value={values[f.key] ?? ''} onChange={(e) => onChange?.(f.key, e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          )}
          {f.help_text && <p className="text-xs text-gray-400 mt-0.5">{f.help_text}</p>}
        </div>
      ))}
    </div>
  )
}
