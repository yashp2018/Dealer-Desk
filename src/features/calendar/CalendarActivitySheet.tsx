import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

/** Generic mobile bottom sheet chrome — the caller decides what goes inside (create form, or activity details/edit). */
export default function CalendarActivitySheet({ title, onClose, children }: Props) {
  return (
    <div className="fixed inset-0 z-[70]">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-slate-950/50" />
      {/*
        The mobile shell simulates a phone column via `max-w-md mx-auto` on a
        non-fixed ancestor (see MobileLayout.tsx) — that constraint does not
        apply to `fixed`/`absolute` descendants, which size against the real
        viewport instead. On an actual phone that's invisible (the viewport
        already is ~max-w-md), but on a wide desktop browser this sheet would
        otherwise stretch edge-to-edge. Re-declaring left-1/2 + max-w-md here
        (same fix already used for the FAB's quick-actions panel) keeps it
        centered and phone-width regardless of the real viewport.
      */}
      <div className="absolute bottom-0 left-1/2 max-h-[90vh] w-full max-w-md -translate-x-1/2 overflow-y-auto rounded-t-3xl bg-white pb-[calc(1.25rem+env(safe-area-inset-bottom))] dark:bg-slate-900">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
