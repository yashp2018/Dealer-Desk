import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

/**
 * Catches route-not-found responses and render-time throws anywhere in the
 * router tree. Without this, an unmatched path or a thrown error inside any
 * page component crashes to a blank white screen with no recovery.
 */
export default function RouteErrorBoundary() {
  const error = useRouteError()
  const nav = useNavigate()

  const notFound = isRouteErrorResponse(error) && error.status === 404
  const message = isRouteErrorResponse(error)
    ? error.statusText || 'Page not found'
    : error instanceof Error
      ? error.message
      : 'Something went wrong'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
          {notFound ? 'Page not found' : 'Something went wrong'}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{message}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => nav(-1)}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={() => nav('/', { replace: true })}
            className="flex-1 rounded-xl bg-cyan-700 py-2.5 text-sm font-semibold text-white"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  )
}
