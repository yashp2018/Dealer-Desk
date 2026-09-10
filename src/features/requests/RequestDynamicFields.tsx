interface Field { key: string; label: string; input_type: string; options: string[]; is_required: boolean; help_text: string; sort_order: number }

interface Props {
  fields: Field[]
  mode: 'read' | 'edit'
  values?: Record<string, string>
  register?: (key: string) => object
  errors?: Record<string, { message?: string }>
}

export default function RequestDynamicFields({ fields, mode, values = {}, register, errors = {} }: Props) {
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
            <select {...(register?.(f.key) ?? {})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select…</option>
              {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : f.input_type === 'textarea' ? (
            <textarea {...(register?.(f.key) ?? {})} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          ) : (
            <input type={f.input_type === 'number' ? 'number' : 'text'} {...(register?.(f.key) ?? {})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          )}
          {f.help_text && <p className="text-xs text-gray-400 mt-0.5">{f.help_text}</p>}
          {errors[f.key] && <p className="text-xs text-red-500 mt-0.5">{errors[f.key].message}</p>}
        </div>
      ))}
    </div>
  )
}
