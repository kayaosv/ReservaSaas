"use client"

export const TimeInput = ({ label, error, id, className = "", ...props }) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-slate-600">
          {label}
        </label>
      )}
      <input
        type="time"
        id={id}
        className={`px-2 py-1.5 text-sm border rounded-lg outline-none transition-colors
          ${error ? "border-red-500" : "border-slate-300 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
