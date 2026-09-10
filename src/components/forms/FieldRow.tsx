import { forwardRef } from 'react'

interface Props extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
  label: string
  error?: string
  as?: 'input' | 'textarea' | 'select'
  children?: React.ReactNode
}

const FieldRow = forwardRef<HTMLInputElement, Props>(({ label, error, as: Tag = 'input', children, ...props }, ref) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {Tag === 'select' ? (
      <select {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
        {children}
      </select>
    ) : Tag === 'textarea' ? (
      <textarea {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
    ) : (
      <input ref={ref} {...props} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
    )}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
))
FieldRow.displayName = 'FieldRow'
export default FieldRow
