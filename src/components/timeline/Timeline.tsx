import { relativeTime } from '../../lib/relativeTime'

interface Entry { id: number | string; created_at: string; actor_name: string; event_type: string; summary: string }

export default function Timeline({ entries }: { entries: Entry[] }) {
  if (!entries.length) return <p className="text-sm text-gray-400 py-4">No activity yet.</p>
  return (
    <ol className="relative border-l border-gray-200 space-y-4 pl-4">
      {entries.map((e) => (
        <li key={e.id} className="relative">
          <div className="absolute -left-[1.35rem] top-1 h-3 w-3 rounded-full bg-indigo-500 border-2 border-white" />
          <p className="text-xs text-gray-400">{relativeTime(e.created_at)} · {e.actor_name}</p>
          <p className="text-sm text-gray-700 mt-0.5">{e.summary}</p>
        </li>
      ))}
    </ol>
  )
}
