/**
 * Desktop — Calendar Board  (mirrors desktop/calendar_board.php)
 * Week navigation · staff swimlane grid · visit cards · request cards · unscheduled tray
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVisits } from '../../hooks/useVisits'
import { useRequests } from '../../hooks/useRequests'
import { useBootstrap } from '../../hooks/useBootstrap'
import { localDateKey, toLocalDateKey, toLocalTimeKey } from '../../lib/formatDate'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function startOfWeek(d: Date) {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}

// Local calendar date, not UTC — this board is keyed by the viewer's own
// day boundaries, matching how visits/requests are actually scheduled.
const isoDate = localDateKey

export default function DesktopCalendarBoardPage() {
  const nav = useNavigate()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const { data: visits = [] } = useVisits()
  const { data: requests = [] } = useRequests()
  const { data: bs } = useBootstrap()

  const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(weekStart), i))
  const today = isoDate(new Date())

  type Visit = typeof visits[0]
  type Request = typeof requests[0]

  // Build grid: staffId → { name, days: { date → { visits, requests } } }
  const staffList = bs?.staff ?? []
  const grid = staffList.map((member) => ({
    ...member,
    days: days.reduce<Record<string, { visits: Visit[]; requests: Request[] }>>((acc, day) => {
      const d = isoDate(day)
      acc[d] = {
        visits: (visits as Visit[]).filter((v) => v.owner_staff_id === member.id && v.scheduled_at && toLocalDateKey(v.scheduled_at) === d),
        requests: (requests as Request[]).filter((r) => r.owner_staff_id === member.id && r.scheduled_at && toLocalDateKey(r.scheduled_at) === d),
      }
      return acc
    }, {}),
  }))

  const unscheduled = (requests as Request[]).filter((r) => !r.scheduled_at && !['done', 'cancelled'].includes(r.status))

  const priorityColor: Record<number, string> = { 1: 'border-l-red-500', 2: 'border-l-amber-400', 3: 'border-l-indigo-400' }

  return (
    <div className="space-y-4">
      {/* Week nav */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekStart(addDays(new Date(weekStart), -7))}
            className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm font-medium text-gray-700">
            {weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} –{' '}
            {addDays(new Date(weekStart), 6).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <button onClick={() => setWeekStart(addDays(new Date(weekStart), 7))}
            className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <button onClick={() => setWeekStart(startOfWeek(new Date()))}
          className="text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50">Today</button>
      </div>

      <div className="flex gap-4">
        {/* Swimlane grid */}
        <div className="flex-1 overflow-x-auto">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden min-w-max">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-28">Owner</th>
                  {days.map((day) => (
                    <th key={isoDate(day)}
                      className={`px-3 py-2.5 text-left text-xs font-semibold w-36 ${isoDate(day) === today ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}>
                      {day.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {grid.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-gray-400 py-10 text-sm">No staff.</td></tr>
                )}
                {grid.map((member) => (
                  <tr key={member.id} className="align-top">
                    <td className="px-4 py-3 text-xs font-medium text-gray-600 whitespace-nowrap">{member.name}</td>
                    {days.map((day) => {
                      const d = isoDate(day)
                      const cell = member.days[d]
                      return (
                        <td key={d} className={`px-2 py-2 align-top min-h-16 ${d === today ? 'bg-indigo-50/40' : ''}`}>
                          <div className="space-y-1">
                            {cell.visits.map((v) => (
                              <button key={v.id} onClick={() => nav(`/desktop/visits/${v.id}`)}
                                className="w-full text-left bg-blue-50 border border-blue-200 rounded-lg px-2 py-1.5 text-xs hover:bg-blue-100 transition-colors">
                                <p className="font-medium text-blue-800 truncate">{v.dealer_name}</p>
                                <p className="text-blue-600">{v.scheduled_at ? toLocalTimeKey(v.scheduled_at) : ''} · {v.title}</p>
                              </button>
                            ))}
                            {cell.requests.map((r) => (
                              <button key={r.id} onClick={() => nav(`/requests/${r.id}`)}
                                className={`w-full text-left bg-white border-l-2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs hover:bg-gray-50 transition-colors ${priorityColor[r.priority] ?? ''}`}>
                                <p className="font-medium text-gray-700 truncate">{r.dealer_name}</p>
                                <p className="text-gray-400">{r.type_name}</p>
                              </button>
                            ))}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unscheduled tray */}
        <div className="w-52 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Unscheduled ({unscheduled.length})
            </h3>
            <div className="space-y-2">
              {unscheduled.length === 0 && <p className="text-xs text-gray-400">No unscheduled requests.</p>}
              {unscheduled.map((r) => (
                <button key={r.id} onClick={() => nav(`/requests/${r.id}`)}
                  className={`w-full text-left bg-white border-l-2 border border-gray-200 rounded-lg px-2 py-2 text-xs hover:bg-gray-50 ${priorityColor[r.priority] ?? ''}`}>
                  <p className="font-medium text-gray-700 truncate">{r.dealer_name}</p>
                  <p className="text-gray-400">{r.type_name} · {r.owner_name}</p>
                </button>
              ))}
              {unscheduled.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">Click a request to open it.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
