import { Plus, Trash2 } from 'lucide-react'
import RequestDynamicFields from '../../features/requests/RequestDynamicFields'

interface Field { key: string; label: string; input_type: string; options: string[]; is_required: boolean; help_text: string; sort_order: number }

interface Props {
  fields: Field[]
  groups: Record<string, string>[]
  onChange: (groups: Record<string, string>[]) => void
  /** Noun for the "Add another …" button and group headings, e.g. "vehicle". Defaults to "entry". */
  noun?: string
}

/**
 * Repeats a request type's dynamic field set N times — e.g. a Warranty Claim
 * covering several vehicles in one request. Always keeps at least one group.
 */
export default function RepeatableFieldGroups({ fields, groups, onChange, noun = 'entry' }: Props) {
  const updateGroup = (i: number, key: string, value: string) =>
    onChange(groups.map((g, idx) => (idx === i ? { ...g, [key]: value } : g)))

  const addGroup = () => onChange([...groups, {}])
  const removeGroup = (i: number) => onChange(groups.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-4">
      {groups.map((group, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 relative">
          {groups.length > 1 && (
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {noun.charAt(0).toUpperCase() + noun.slice(1)} {i + 1}
              </p>
              <button type="button" onClick={() => removeGroup(i)} aria-label={`Remove ${noun} ${i + 1}`}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg p-1">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <RequestDynamicFields fields={fields} mode="edit" values={group} onChange={(key, value) => updateGroup(i, key, value)} />
        </div>
      ))}
      <button type="button" onClick={addGroup}
        className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:text-indigo-700">
        <Plus className="h-3.5 w-3.5" /> Add another {noun}
      </button>
    </div>
  )
}
