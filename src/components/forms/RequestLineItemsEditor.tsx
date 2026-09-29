import { Plus, Trash2 } from 'lucide-react'
import type { RequestLineInput } from '../../api/types'

interface Props {
  lines: RequestLineInput[]
  onChange: (lines: RequestLineInput[]) => void
}

export default function RequestLineItemsEditor({ lines, onChange }: Props) {
  const update = (i: number, patch: Partial<RequestLineInput>) =>
    onChange(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const addRow = () => onChange([...lines, { description: '', qty: 1 }])
  const removeRow = (i: number) => onChange(lines.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-2">
      {lines.map((line, i) => (
        <div key={i} className="flex gap-2 items-start">
          <input
            placeholder="Item (e.g. Brake pads)" value={line.description}
            onChange={(e) => update(i, { description: e.target.value })}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="number" min={0.01} step={1} placeholder="Qty" value={line.qty}
            onChange={(e) => update(i, { qty: Number(e.target.value) })}
            className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="button" onClick={() => removeRow(i)} aria-label="Remove item"
            className="shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={addRow}
        className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:text-indigo-700">
        <Plus className="h-3.5 w-3.5" /> Add item
      </button>
    </div>
  )
}
