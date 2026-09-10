type AlertType = 'info' | 'success' | 'warning' | 'danger'
const styles: Record<AlertType, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  danger: 'bg-red-50 border-red-200 text-red-800',
}
export default function Alert({ type = 'info', message, onRetry }: { type?: AlertType; message: string; onRetry?: () => void }) {
  return (
    <div className={`border rounded-lg px-4 py-3 text-sm flex items-center justify-between ${styles[type]}`}>
      <span>{message}</span>
      {onRetry && <button onClick={onRetry} className="ml-4 underline text-xs">Retry</button>}
    </div>
  )
}
